console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return;

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style.cssText = `
    position: fixed; top:50%; left:50%; transform: translate(-50%,-50%);
    width: 400px; padding: 20px; background: white; border: 1px solid #ccc;
    border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index:9999;
    font-size:16px; font-family: Arial, sans-serif; text-align:center;
  `;

  popup.innerHTML = `
    <p><b>Data Collection Notice</b></p>
    <p>This extension collects your video interaction events (play, pause, watch time, etc.) for research purposes. A random user ID will be stored locally to recognize you across sessions.</p>
    <p>Do you agree?</p>
    <button id="consent-yes" style="margin:10px;padding:5px 15px;">Yes</button>
    <button id="consent-no" style="margin:10px;padding:5px 15px;">No</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent", "true");
    popup.remove();
    initExtension(true);
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
    userId = localStorage.getItem("swipeUserId") || crypto.randomUUID();
    localStorage.setItem("swipeUserId", userId);
  } else {
    userId = sessionStorage.getItem("swipeUserId") || crypto.randomUUID();
    sessionStorage.setItem("swipeUserId", userId);
  }
  window._swipeUserId = userId;

  // ---------- SESSION ID ----------
  let sessionId = sessionStorage.getItem("swipeSessionId") || crypto.randomUUID();
  sessionStorage.setItem("swipeSessionId", sessionId);
  window._swipeSessionId = sessionId;

  // ---------- VIDEO EVENT LOGIC ----------
  attachVideoTracking();
}

// ================== CONSENT CHECK ==================
function checkConsent() {
  const consent = localStorage.getItem("swipeConsent");
  if (consent === "true") initExtension(true);
  else if (consent === "false") console.log("[SwipeExtension] User declined tracking ❌");
  else showConsentPopup();
}

// ================== VIDEO TRACKING ==================
function attachVideoTracking() {
  let currentVideo = null;
  let lastSrc = null;
  let lastUrl = window.location.href;

  // state machine per video
  let videoState = null;

  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function saveEvent(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;
    console.log("[SwipeExtension] Event saved:", eventData);

    fetch("https://swipe-extension-server-2.onrender.com/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }).then(res => {
      if (!res.ok) console.error("[SwipeExtension] Server error ❌", res.statusText);
    }).catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
  }

  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;

    console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${getVideoId()})`);

    // reset state for this video
    videoState = {
      started: false,
      paused: false,
      resumed: false,
      ended: false,
      watched100: false,
      rewatched: false,
      lastTime: 0,
      suppressJump: false
    };

    let watchedTime = 0;
    let startTime = null;

    video.addEventListener("loadedmetadata", () => {
      videoState.duration = video.duration;
    });

    video.addEventListener("play", () => {
      startTime = Date.now();
      if (!videoState.started) {
        saveEvent({ type: "video-start", videoId: getVideoId(), src: video.src, timestamp: new Date().toISOString() });
        videoState.started = true;
      } else if (videoState.paused) {
        saveEvent({ type: "video-resume", videoId: getVideoId(), src: video.src, timestamp: new Date().toISOString() });
        videoState.resumed = true;
        videoState.paused = false;
      }
    });

    video.addEventListener("pause", () => {
      if (startTime) watchedTime += (Date.now() - startTime) / 1000;
      startTime = null;
      const percent = videoState.duration ? Math.min((watchedTime / videoState.duration) * 100, 100) : 0;
      saveEvent({
        type: "video-paused",
        videoId: getVideoId(),
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: watchedTime.toFixed(2),
        duration: videoState.duration?.toFixed(2),
        percent: percent.toFixed(1)
      });
      videoState.paused = true;
    });

    video.addEventListener("timeupdate", () => {
      if (startTime) watchedTime += (Date.now() - startTime) / 1000;
      startTime = Date.now();

      if (!videoState.watched100 && videoState.duration && watchedTime >= videoState.duration) {
        saveEvent({
          type: "video-watched-100",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: videoState.duration.toFixed(2),
          duration: videoState.duration.toFixed(2),
          percent: 100
        });
        saveEvent({
          type: "video-rewatch",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString()
        });
        videoState.watched100 = true;
        videoState.rewatched = true;
        videoState.suppressJump = true;
        watchedTime = 0;
      }
    });

    video.addEventListener("ended", () => {
      if (!videoState.ended) {
        saveEvent({
          type: "video-ended",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: watchedTime.toFixed(2),
          duration: videoState.duration?.toFixed(2),
          percent: videoState.duration ? Math.min((watchedTime / videoState.duration) * 100, 100).toFixed(1) : 0
        });
        videoState.ended = true;
      }
      watchedTime = 0;
    });

    video.addEventListener("seeked", () => {
      const to = video.currentTime;
      if (videoState.suppressJump) {
        console.log("[SwipeExtension] Ignored jump after rewatch ✅");
        videoState.suppressJump = false;
        videoState.lastTime = to;
        return;
      }
      const from = videoState.lastTime || 0;
      videoState.lastTime = to;
      saveEvent({
        type: "video-jump",
        videoId: getVideoId(),
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: from.toFixed(2), to: to.toFixed(2) }
      });
    });
  }

  // OBSERVE VIDEO CHANGES
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      if (currentVideo && videoState) {
        // fire video-stopped for previous video
        saveEvent({
          type: "video-stopped",
          videoId: getVideoId(),
          src: currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: (videoState.lastTime || 0).toFixed(2),
          duration: videoState.duration?.toFixed(2),
          percent: videoState.duration ? Math.min((videoState.lastTime / videoState.duration) * 100, 100).toFixed(1) : 0
        });
      }

      if (lastSrc) {
        saveEvent({
          type: "swiped-to-new-video",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: { previous: lastSrc }
        });
      }

      currentVideo = video;
      lastSrc = video.src;
      attachVideoEvents(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // SPA Navigation
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
setInterval(checkConsent, 1000);

// ================== INITIAL RUN ==================
checkConsent();
