console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return;

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 400px; padding: 20px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    z-index: 9999;
    font-family: Arial, sans-serif;
    text-align: center;
  `;

  popup.innerHTML = `
    <p><b>Data Collection Notice</b></p>
    <p>This extension collects your video interaction events (play, pause, watch time, etc.) 
       for research purposes. A random user ID will be stored locally to recognize you across sessions.</p>
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

  // ---------- VIDEO TRACKING LOGIC ----------
  attachVideoTracking();
}

// ================== CONSENT CHECK ==================
function checkConsent() {
  const consent = localStorage.getItem("swipeConsent");
  if (consent === "true") initExtension(true);
  else if (consent === "false") {
    console.log("[SwipeExtension] User declined tracking ❌");
  } else showConsentPopup();
}

// ================== VIDEO TRACKING FUNCTION ==================
function attachVideoTracking() {
  let currentVideo = null;
  let lastSrc = null;
  let lastUrl = window.location.href;

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
      body: JSON.stringify(eventData)
    }).catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
  }

  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;

    // --- per-video state ---
    const state = {
      startTime: null,
      watchedTime: 0,
      prevDuration: video.duration || 0,
      hasPlayed: false,
      videoId: getVideoId(),
    };

    video.addEventListener("loadedmetadata", () => {
      state.prevDuration = video.duration || state.prevDuration;
    });

    video.addEventListener("play", () => {
      state.startTime = Date.now();
      if (!state.hasPlayed) {
        saveEvent({ type: "video-start", videoId: state.videoId, src: video.src, timestamp: new Date().toISOString() });
        state.hasPlayed = true;
      } else {
        saveEvent({ type: "video-resume", videoId: state.videoId, src: video.src, timestamp: new Date().toISOString() });
      }
    });

    video.addEventListener("pause", () => {
      if (state.startTime) state.watchedTime += (Date.now() - state.startTime) / 1000;
      state.startTime = null;
      const percent = state.prevDuration ? Math.min((state.watchedTime / state.prevDuration) * 100, 100).toFixed(1) : 0;
      saveEvent({
        type: "video-paused",
        videoId: state.videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: state.watchedTime.toFixed(2),
        duration: state.prevDuration.toFixed(2),
        percent,
      });
    });

    video.addEventListener("timeupdate", () => {
      if (state.startTime) state.watchedTime += (Date.now() - state.startTime) / 1000;
      state.startTime = Date.now();

      if (state.prevDuration && state.watchedTime >= state.prevDuration) {
        saveEvent({
          type: "video-watched-100",
          videoId: state.videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: state.prevDuration.toFixed(2),
          duration: state.prevDuration.toFixed(2),
          percent: 100,
        });
        saveEvent({ type: "video-rewatch", videoId: state.videoId, src: video.src, timestamp: new Date().toISOString() });
        state.watchedTime = 0;
      }
    });

    video.addEventListener("ended", () => {
      if (state.startTime) state.watchedTime += (Date.now() - state.startTime) / 1000;
      state.startTime = null;
      const percent = state.prevDuration ? Math.min((state.watchedTime / state.prevDuration) * 100, 100).toFixed(1) : 0;
      saveEvent({
        type: "video-ended",
        videoId: state.videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: state.watchedTime.toFixed(2),
        duration: state.prevDuration.toFixed(2),
        percent,
      });
      state.watchedTime = 0;
    });
  }

  // ================== OBSERVE VIDEO CHANGES ==================
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      currentVideo = video;
      lastSrc = video.src;
      attachVideoEvents(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ================== SPA URL CHANGE CHECK ==================
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const video = document.querySelector("video");
      if (video && video.src !== lastSrc) {
        currentVideo = video;
        lastSrc = video.src;
        attachVideoEvents(video);
      }
    }
  }, 200);
}

// ================== INITIAL RUN ==================
checkConsent();
