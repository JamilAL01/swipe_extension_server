console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return; // prevent duplicates

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "400px";
  popup.style.padding = "20px";
  popup.style.background = "white";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "16px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "center";

  popup.innerHTML = `
    <p><b>Data Collection Notice</b></p>
    <p>This extension collects your video interaction events (play, pause, watch time, etc.) 
       for research purposes. A random user ID will be stored locally to recognize you across sessions.</p>
    <p>Do you agree?</p>
    <button id="consent-yes" style="margin: 10px; padding:5px 15px;">Yes</button>
    <button id="consent-no" style="margin: 10px; padding:5px 15px;">No</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent", "true");
    popup.remove();
    initExtension(true); // persistent tracking
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "false");
    popup.remove();
    console.log("[SwipeExtension] User declined tracking ❌");
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

// ================== VIDEO TRACKING FUNCTION ==================
function attachVideoTracking() {
  // high-level state
  let currentVideo = null;
  let lastSrc = null;
  let lastVideoTime = null; // last known currentTime (seconds)
  let watchedTime = 0; // accumulated seconds for the current view
  let prevDuration = 0;
  let hasPlayed = false;

  // robust detection & suppression config
  const DUPLICATE_SUPPRESSION_MS = 800;            // suppress same event fired rapidly
  const AUTOPLAY_REWATCH_WINDOW_MS = 3000;        // ended -> quick restart => rewatch
  const JUMP_MIN_DELTA_SEC = 1.0;                 // only treat seek as jump if >= 1s change
  const HOOK_GRACE_PERIOD_MS = 2000;              // ignore small seeks during initial hook
  const singleShot = new Set(["video-start","video-stopped","video-watched-100","video-rewatch","swiped-to-new-video"]);

  // per-video runtime state
  let emittedEvents = new Set();
  let lastEventTs = {};     // eventType -> timestamp
  let endedAt = 0;          // ms when ended fired
  let hookedAt = 0;         // ms when attachVideoEvents ran
  let lastVideoId = null;   // to detect video changes (use id, not only src)

  // Helper to get YouTube Shorts video ID
  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // send event to server (keeps your original payload keys)
  function sendEventToServer(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;
    // keep logging for debugging
    console.log("[SwipeExtension] Event:", eventData);

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

  // decide whether to emit (dedupe & single-shot)
  function maybeEmit(event) {
    const nowMs = Date.now();
    // time-based duplicate suppression for any event
    const lastTs = lastEventTs[event.type] || 0;
    if (nowMs - lastTs < DUPLICATE_SUPPRESSION_MS) {
      // suppress very rapid duplicates
      console.debug("[tracker] suppressed rapid duplicate", event.type);
      return;
    }

    // single-shot per video
    if (singleShot.has(event.type)) {
      if (emittedEvents.has(event.type)) {
        console.debug("[tracker] already emitted single-shot", event.type);
        return;
      }
      emittedEvents.add(event.type);
    }

    lastEventTs[event.type] = nowMs;
    sendEventToServer(event);
  }

  function resetVideoStateForNewView() {
    emittedEvents = new Set();
    lastEventTs = {};
    endedAt = 0;
    lastVideoTime = null;
    watchedTime = 0;
    hasPlayed = false;
    hookedAt = Date.now();
  }

  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;
    hookedAt = Date.now();
    lastVideoId = getVideoId();

    console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${lastVideoId})`);

    video.addEventListener("loadedmetadata", () => {
      prevDuration = video.duration || 0;
    });

    video.addEventListener("play", () => {
      // small delay to allow currentTime to stabilize sometimes
      setTimeout(() => {
        const videoId = getVideoId();
        if (!hasPlayed) {
          maybeEmit({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
          hasPlayed = true;
        } else {
          maybeEmit({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
        }
      }, 80);
      // set lastVideoTime to the current playback position
      lastVideoTime = video.currentTime || 0;
    });

    video.addEventListener("timeupdate", () => {
      const t = video.currentTime || 0;
      if (lastVideoTime !== null && typeof lastVideoTime === "number") {
        const delta = t - lastVideoTime;
        // accumulate only forward (positive) deltas and ignore absurd jumps
        if (delta > 0 && delta < 60) {
          watchedTime += delta;
        }
      }
      lastVideoTime = t;

      // defensive early watched-100 detection (if user reaches near full length)
      if (!emittedEvents.has("video-watched-100") && prevDuration && watchedTime >= (prevDuration - 0.15)) {
        maybeEmit({
          type: "video-watched-100",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: prevDuration.toFixed(2),
          duration: prevDuration.toFixed(2),
          percent: 100
        });
      }
    });

    video.addEventListener("pause", () => {
      // ensure we capture any outstanding progress (in case no recent timeupdate)
      const t = video.currentTime || 0;
      if (lastVideoTime !== null) {
        const delta = t - lastVideoTime;
        if (delta > 0 && delta < 60) watchedTime += delta;
      }
      lastVideoTime = null;

      const videoId = getVideoId();
      const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
      maybeEmit({
        type: "video-paused",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: watchedTime.toFixed(2),
        duration: prevDuration ? prevDuration.toFixed(2) : 0,
        percent: Number(watchPercent.toFixed(1))
      });
    });

    video.addEventListener("ended", () => {
      // finalize watchedTime
      const t = video.currentTime || 0;
      if (lastVideoTime !== null) {
        const delta = t - lastVideoTime;
        if (delta > 0 && delta < 60) watchedTime += delta;
      }
      lastVideoTime = null;

      // emit watched-100 once
      maybeEmit({
        type: "video-watched-100",
        videoId: getVideoId(),
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: prevDuration ? prevDuration.toFixed(2) : watchedTime.toFixed(2),
        duration: prevDuration ? prevDuration.toFixed(2) : 0,
        percent: 100
      });

      endedAt = Date.now();
      // do NOT emit rewatch here - wait for a subsequent play/seek detection
    });

    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = Number((video.currentTime || 0).toFixed(3));
      const prev = (lastVideoTime !== null && typeof lastVideoTime === "number") ? lastVideoTime : 0;
      const delta = Math.abs(to - prev);
      const nowMs = Date.now();

      // 1) Autoplay rewatch: ended recently and we seek back near start -> rewatch (not jump)
      if (endedAt && (nowMs - endedAt) <= AUTOPLAY_REWATCH_WINDOW_MS && to <= 0.5) {
        // ensure watched-100 was emitted (ended handler does that, but be defensive)
        if (!emittedEvents.has("video-watched-100")) {
          maybeEmit({
            type: "video-watched-100",
            videoId,
            src: video.src,
            timestamp: new Date().toISOString(),
            watchedTime: prevDuration ? prevDuration.toFixed(2) : watchedTime.toFixed(2),
            duration: prevDuration ? prevDuration.toFixed(2) : 0,
            percent: 100
          });
        }
        // emit rewatch (single-shot)
        maybeEmit({ type: "video-rewatch", videoId, src: video.src, timestamp: new Date().toISOString() });
        // reset counters — new view of same video
        resetVideoStateForNewView();
        return;
      }

      // 2) Initialization noise: hooking/early play can trigger a seek->0; suppress small seeks during grace window
      if ((nowMs - hookedAt) <= HOOK_GRACE_PERIOD_MS && to <= 0.5 && prev <= 0.5) {
        console.debug("[tracker] suppressed init-seek noise (not a user jump)");
        lastVideoTime = to; // keep time pointer in sync
        return;
      }

      // 3) Only treat as a real user jump when the change is meaningful (>= JUMP_MIN_DELTA_SEC)
      if (delta < JUMP_MIN_DELTA_SEC) {
        console.debug("[tracker] suppressed tiny seek (delta < JUMP_MIN_DELTA_SEC)", delta);
        lastVideoTime = to;
        return;
      }

      // Otherwise it's a real jump/seek
      maybeEmit({
        type: "video-jump",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: Number(prev.toFixed(2)), to: Number(to.toFixed(2)) }
      });

      // update pointer
      lastVideoTime = to;
    });
  }

  // ================== OBSERVE VIDEO CHANGES ==================
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    const vidId = getVideoId();

    // video change detection:
    const changedBySrc = video && video.src !== lastSrc;
    const changedById = vidId && vidId !== lastVideoId;

    if (video && (changedBySrc || changedById)) {
      // previous video stopped -> emit once
      if (currentVideo) {
        // make sure to account for outstanding time
        if (lastVideoTime !== null) {
          const t = currentVideo.currentTime || 0;
          const delta = t - lastVideoTime;
          if (delta > 0 && delta < 60) watchedTime += delta;
        }
        maybeEmit({
          type: "video-stopped",
          videoId: lastVideoId || getVideoId(),
          src: currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: watchedTime.toFixed(2),
          duration: prevDuration ? prevDuration.toFixed(2) : 0,
          percent: prevDuration ? Number(Math.min((watchedTime / prevDuration) * 100, 100).toFixed(1)) : 0
        });
      }

      // if there was a previous src, emit swiped-to-new-video (single-shot)
      if (lastSrc || lastVideoId) {
        maybeEmit({
          type: "swiped-to-new-video",
          videoId: vidId,
          src: video ? video.src : null,
          timestamp: new Date().toISOString(),
          extra: { previousSrc: lastSrc, previousVideoId: lastVideoId }
        });
      }

      // switch to the new one
      currentVideo = video;
      lastSrc = video ? video.src : null;
      prevDuration = video ? (video.duration || 0) : 0;
      resetVideoStateForNewView();
      if (video) attachVideoEvents(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ================== RE-HOOK ON URL / SPA CHANGE ==================
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const video = document.querySelector("video");
      if (video) {
        // attempt re-hook — attachVideoEvents guards by video._hooked
        attachVideoEvents(video);
      }
    }
  }, 300);
}

// ================== SPA NAVIGATION CHECK ==================
let lastUrlGlobal = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrlGlobal) {
    lastUrlGlobal = window.location.href;
    checkConsent();
  }
}, 1000);

// ================== INITIAL RUN ==================
checkConsent();
