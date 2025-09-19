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

// ================== CHANNEL NAME / HANDLE ==================
let currentChannelName = null;

function extractChannelName() {
  let channelEl = document.querySelector("span.ytReelChannelBarViewModelChannelName a");
  if (channelEl) return channelEl.textContent.trim();

  let adEl = document.querySelector("span.ytAdMetadataShapeHostHeadline a");
  if (adEl) return adEl.textContent.trim();

  return null;
}

// Watch for changes in the Shorts container
const observer = new MutationObserver(() => {
  const name = extractChannelName();
  if (name && name !== currentChannelName) {
    currentChannelName = name;
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

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

  function saveEvent(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;
    eventData.channelName = currentChannelName;;
    console.log("[SwipeExtension] Event saved:", eventData);

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

    video.addEventListener("loadedmetadata", () => { prevDuration = video.duration; });

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
        watchedTime: watchedTime.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: watchPercent.toFixed(1),
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
          watchedTime: prevDuration.toFixed(2),
          duration: prevDuration.toFixed(2),
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
        watchedTime: watchedTime.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: watchPercent.toFixed(1),
      });
      watchedTime = 0;
    });

    // ================== JUMP / SEEK EVENT ==================
    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = video.currentTime;
      console.log(`[SwipeExtension] video-jump 🔀 ${video.src} (ID: ${videoId}) - to ${to.toFixed(2)}s`);
      saveEvent({
        type: "video-jump",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: watchedTime.toFixed(2), to }
      });
    });
  }

  // ================== OBSERVE VIDEO CHANGES ==================
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      const videoId = getVideoId();

      if (currentVideo && startTime) {
        watchedTime += (Date.now() - startTime) / 1000;
        saveEvent({
          type: "video-stopped",
          videoId: getVideoId(),
          src: currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: watchedTime.toFixed(2),
          duration: prevDuration.toFixed(2),
          percent: prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100).toFixed(1) : 0,
        });
      }

      if (lastSrc) {
        saveEvent({
          type: "swiped-to-new-video",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: { previous: lastSrc },
        });
      }

      currentVideo = video;
      lastSrc = video.src;
      startTime = Date.now();
      watchedTime = 0;
      prevDuration = video.duration || 0;
      hasPlayed = false;

      attachVideoEvents(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ================== RE-HOOK ON URL CHANGE ==================
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
