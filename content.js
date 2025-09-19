console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "500px";
  popup.style.padding = "25px";
  popup.style.background = "white";
  popup.style.border = "2px solid #444";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "16px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "center";

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">🔒 Data Collection Notice</h2>
    <p style="line-height:1.5;">
      This extension collects your video interaction events 
      (<b>play, pause, jumps, watch time</b>, etc.) for research purposes.  
      A random user ID will be stored locally to recognize you across sessions.
    </p>
    <p><b>Do you agree?</b></p>
    <button id="consent-yes" style="margin:10px; padding:10px 20px; font-size:16px;">✅ Yes</button>
    <button id="consent-no" style="margin:10px; padding:10px 20px; font-size:16px;">❌ No</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent", "true");
    popup.remove();
    initExtension(true); // ✅ start tracking
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "false");
    popup.remove();
    console.log("[SwipeExtension] User denied consent ❌. Events will not be collected.");
    // Do NOT call initExtension()
  };
}

// ================== INITIALIZATION ==================
function initExtension(persistent = true) {
  console.log("[SwipeExtension] Initializing extension...");

  // ---------- USER ID ----------
  let userId;
  if (persistent) {
    userId = localStorage.getItem("swipeUserId");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("swipeUserId", userId);
    }
  } else {
    userId = sessionStorage.getItem("swipeUserId");
    if (!userId) {
      userId = crypto.randomUUID();
      sessionStorage.setItem("swipeUserId", userId);
    }
  }
  window._swipeUserId = userId;

  // ---------- SESSION ID ----------
  let sessionId = sessionStorage.getItem("swipeSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("swipeSessionId", sessionId);
  }
  window._swipeSessionId = sessionId;

  // ---------- VIDEO EVENT LOGIC ----------
  attachVideoTracking();
}

// ================== CONSENT CHECK ==================
function checkConsent() {
  const consent = localStorage.getItem("swipeConsent");
  if (consent === "true") initExtension(true);
  else if (consent === "false") {
    console.log("[SwipeExtension] User declined tracking ❌");
    return; // do nothing
  } else {
    showConsentPopup();
  }
}

// ================== CHANNEL META EXTRACTION & SYNC ==================

// Map video.src -> { name, url }
// Guarantees channel metadata is tied to specific video instance
const videoChannelMap = new Map();
let lastKnownChannel = null;

// debounce helper
function debounce(fn, wait = 80) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function extractChannelMetaFromDOM() {
  // Shorts channel name
  const shortAnchor = document.querySelector("span.ytReelChannelBarViewModelChannelName a");
  if (shortAnchor) return { name: shortAnchor.textContent.trim(), url: shortAnchor.getAttribute("href") || null };

  // Ads / brand headline
  const adAnchor = document.querySelector("span.ytAdMetadataShapeHostHeadline a");
  if (adAnchor) return { name: adAnchor.textContent.trim(), url: adAnchor.getAttribute("href") || adAnchor.href || null };

  // Fallback: any attributed-string link visible in the bar (less specific)
  const alt = document.querySelector(".yt-core-attributed-string__link");
  if (alt) return { name: alt.textContent.trim(), url: alt.getAttribute("href") || null };

  return { name: null, url: null };
}

function getVideoElement() {
  return document.querySelector("video");
}

function getCurrentVideoSrc() {
  const v = getVideoElement();
  return v ? (v.currentSrc || v.src || null) : null;
}

// Populate mapping for the current video if DOM contains channel info
function updateMappingForCurrentVideo() {
  const src = getCurrentVideoSrc();
  const meta = extractChannelMetaFromDOM();
  if (meta && meta.name) {
    if (src) videoChannelMap.set(src, meta);
    lastKnownChannel = meta;
    console.log("[SwipeExtension] updateMappingForCurrentVideo ->", { src, meta });
  }
}

// Debounced observer on body to catch asynchronous DOM updates (YouTube changes the channel DOM slightly after swipe)
const bodyObserver = new MutationObserver(debounce(() => {
  updateMappingForCurrentVideo();
}, 80));
bodyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

// Ensure video event listeners are attached (to catch loadeddata/play signals)
function attachVideoListenersOnce() {
  const v = getVideoElement();
  if (!v) return;
  if (v._channelHooked) return;
  v._channelHooked = true;

  v.addEventListener("loadedmetadata", updateMappingForCurrentVideo);
  v.addEventListener("loadeddata", updateMappingForCurrentVideo);
  v.addEventListener("playing", updateMappingForCurrentVideo);

  // Observe attribute changes on the video element itself
  try {
    const attrObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && (m.attributeName === "src" || m.attributeName === "currentSrc")) {
          updateMappingForCurrentVideo();
        }
      }
    });
    attrObs.observe(v, { attributes: true });
  } catch (e) {
    // ignore attach failures on some browsers
  }
}

// Re-attach when new video appears in DOM
const reattachObserver = new MutationObserver(debounce(() => {
  attachVideoListenersOnce();
}, 150));
reattachObserver.observe(document.body, { childList: true, subtree: true });

// Resolve channel meta for the current video, waiting briefly if needed.
// Returns { name, url, source } where source indicates where it came from: 'map'|'dom'|'fallback'|'timeout'
function resolveChannelInfo(timeout = 400) {
  const src = getCurrentVideoSrc();
  if (src && videoChannelMap.has(src)) return Promise.resolve({ ...(videoChannelMap.get(src)), source: "map" });
  if (lastKnownChannel) return Promise.resolve({ ...(lastKnownChannel), source: "fallback" });

  return new Promise((resolve) => {
    let done = false;

    function tryResolve() {
      if (done) return;
      const s = getCurrentVideoSrc();
      if (s && videoChannelMap.has(s)) {
        done = true;
        cleanup();
        return resolve({ ...(videoChannelMap.get(s)), source: "map" });
      }
      const meta = extractChannelMetaFromDOM();
      if (meta && meta.name) {
        if (s) videoChannelMap.set(s, meta);
        done = true;
        cleanup();
        return resolve({ ...meta, source: "dom" });
      }
      // continue waiting
    }

    function cleanup() {
      const v = getVideoElement();
      if (v) {
        v.removeEventListener("playing", tryResolve);
        v.removeEventListener("loadeddata", tryResolve);
      }
      tempObserver.disconnect();
      clearTimeout(tid);
    }

    const v = getVideoElement();
    if (v) {
      v.addEventListener("playing", tryResolve);
      v.addEventListener("loadeddata", tryResolve);
    }

    const tempObserver = new MutationObserver(tryResolve);
    tempObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    const tid = setTimeout(() => {
      if (done) return;
      done = true;
      tempObserver.disconnect();
      if (v) {
        v.removeEventListener("playing", tryResolve);
        v.removeEventListener("loadeddata", tryResolve);
      }
      // fallback to lastKnownChannel or null
      if (lastKnownChannel) resolve({ ...(lastKnownChannel), source: "fallback-timeout" });
      else resolve({ name: null, url: null, source: "timeout" });
    }, timeout);
  });
}

// Debug helpers (inspect from console)
window._videoChannelMap = videoChannelMap;
window._lastKnownChannel = () => lastKnownChannel;

// ================== VIDEO TRACKING FUNCTION ==================
function attachVideoTracking() {
  let currentVideo = null;
  let lastSrc = null;
  let startTime = null;
  let watchedTime = 0;
  let prevDuration = 0;
  let hasPlayed = false;
  let lastUrl = window.location.href;

  // Helper to get YouTube Shorts video ID
  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // async sender: resolves channel info before sending
  async function saveEvent(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;

    // Wait for channel meta to be resolved (safe default 400ms)
    try {
      const meta = await resolveChannelInfo(400);
      eventData.channelName = meta && meta.name ? meta.name : null;
      eventData.channelUrl = meta && meta.url ? meta.url : null;
      // debug
      console.log("[SwipeExtension] Resolved channel for event:", {
        type: eventData.type,
        src: eventData.src,
        resolved: eventData.channelName,
        source: meta && meta.source,
      });
    } catch (e) {
      eventData.channelName = null;
      eventData.channelUrl = null;
    }

    console.log("[SwipeExtension] Event saved (ready to send):", eventData);

    // POST to server (non-blocking)
    fetch("https://swipe-extension-server-2.onrender.com/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    })
      .then((res) => {
        if (res.ok) console.log("[SwipeExtension] Sent to server ✅");
        else console.error("[SwipeExtension] Server error ❌", res.statusText);
      })
      .catch((err) => console.error("[SwipeExtension] Fetch error ❌", err));
  }

  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;

    console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${getVideoId()})`);

    video.addEventListener("loadedmetadata", () => { prevDuration = video.duration || 0; });

    video.addEventListener("play", () => {
      setTimeout(() => {
        const videoId = getVideoId();
        if (!hasPlayed) {
          saveEvent({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
          hasPlayed = true;
        } else {
          saveEvent({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
        }
      }, 100);
      startTime = Date.now();
    });

    video.addEventListener("pause", () => {
      if (startTime) watchedTime += (Date.now() - startTime) / 1000;
      startTime = null;
      const videoId = getVideoId();
      const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
      saveEvent({
        type: "video-paused",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: Number(watchedTime.toFixed(2)),
        duration: Number(prevDuration.toFixed(2)),
        percent: Number(watchPercent.toFixed(1)),
      });
    });

    video.addEventListener("timeupdate", () => {
      if (startTime) watchedTime += (Date.now() - startTime) / 1000;
      startTime = Date.now();

      if (prevDuration && watchedTime >= prevDuration) {
        const videoId = getVideoId();
        saveEvent({
          type: "video-watched-100",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: Number(prevDuration.toFixed(2)),
          duration: Number(prevDuration.toFixed(2)),
          percent: 100,
        });
        saveEvent({ type: "video-rewatch", videoId, src: video.src, timestamp: new Date().toISOString() });
        watchedTime = 0;
      }
    });

    video.addEventListener("ended", () => {
      if (startTime) watchedTime += (Date.now() - startTime) / 1000;
      startTime = null;
      const videoId = getVideoId();
      const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
      saveEvent({
        type: "video-ended",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: Number(watchedTime.toFixed(2)),
        duration: Number(prevDuration.toFixed(2)),
        percent: Number(watchPercent.toFixed(1)),
      });
      watchedTime = 0;
    });

    // JUMP / SEEK EVENT
    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = video.currentTime;
      console.log(`[SwipeExtension] video-jump 🔀 ${video.src} (ID: ${videoId}) - to ${to.toFixed(2)}s`);
      saveEvent({
        type: "video-jump",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: Number(watchedTime.toFixed(2)), to }
      });
    });
  }

  // Observe video changes and handle swipes
  const videoObserver = new MutationObserver(debounce(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      const videoId = getVideoId();

      // When new video appears, try to immediately update the mapping (DOM may still be updating)
      updateMappingForCurrentVideo();

      // If switching away from previous video, emit video-stopped for previous
      if (currentVideo && startTime) {
        watchedTime += (Date.now() - startTime) / 1000;
        saveEvent({
          type: "video-stopped",
          videoId: getVideoId(),
          src: currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: Number(watchedTime.toFixed(2)),
          duration: Number(prevDuration.toFixed(2)),
          percent: prevDuration ? Number((Math.min((watchedTime / prevDuration) * 100, 100)).toFixed(1)) : 0,
        });
      }

      // swiped-to-new-video event for the new video
      if (lastSrc) {
        saveEvent({
          type: "swiped-to-new-video",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: { previous: lastSrc },
        });
      }

      // update refs for new video
      currentVideo = video;
      lastSrc = video.src;
      startTime = Date.now();
      watchedTime = 0;
      prevDuration = video.duration || 0;
      hasPlayed = false;

      // attach listeners and mapping listeners
      attachVideoEvents(video);
      attachVideoListenersOnce();
    }
  }, 40)); // small debounce to coalesce rapid DOM churn

  videoObserver.observe(document.body, { childList: true, subtree: true });

  // Re-hook on URL change (SPA navigation)
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const video = document.querySelector("video");
      if (video) attachVideoEvents(video);
    }
  }, 100);
}

// ================== SPA NAVIGATION CHECK ==================
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    checkConsent();
  }
}, 1000);

// ================== INITIAL RUN ==================
checkConsent();
