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
  let currentVideo = null;
  let lastSrc = null;
  let lastUrl = window.location.href;

  // Track video state per video
  const videoState = {
    started: false,
    paused: false,
    watched100: false,
    stopped: false,
    swiped: false,
    lastSeek: 0,
    suppressJump: false,
    watchedTime: 0,
    prevDuration: 0
  };

  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function saveEvent(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;
    console.log("[SwipeExtension] Event:", eventData);

    fetch("https://swipe-extension-server-2.onrender.com/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    }).then(res => {
      if (!res.ok) console.error("[SwipeExtension] Server error ❌", res.statusText);
    }).catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
  }

  function hookVideo(video) {
    if (!video || video._hooked) return;
    video._hooked = true;

    videoState.prevDuration = video.duration || 0;
    videoState.watchedTime = 0;
    videoState.lastSeek = 0;
    videoState.started = false;
    videoState.paused = false;
    videoState.watched100 = false;
    videoState.stopped = false;
    videoState.swiped = false;
    videoState.suppressJump = false;

    let startTime = null;

    // --- Play / Resume ---
    video.addEventListener("play", () => {
      startTime = Date.now();
      const videoId = getVideoId();

      if (!videoState.started) {
        saveEvent({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
        videoState.started = true;
      } else {
        saveEvent({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
      }
    });

    // --- Pause ---
    video.addEventListener("pause", () => {
      if (startTime) videoState.watchedTime += (Date.now() - startTime) / 1000;
      startTime = null;
      const videoId = getVideoId();
      const percent = videoState.prevDuration ? Math.min((videoState.watchedTime / videoState.prevDuration) * 100, 100).toFixed(1) : 0;

      saveEvent({
        type: "video-paused",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: videoState.watchedTime.toFixed(2),
        duration: videoState.prevDuration.toFixed(2),
        percent
      });
    });

    // --- Seek / Jump ---
    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = video.currentTime;
      const from = videoState.lastSeek;

      // Only fire jump if:
      // 1️⃣ Not suppressed by rewatch
      // 2️⃣ User actually jumped forward/backward
      // 3️⃣ Not a jump at the very start of autoplay rewatch
      const isRealJump = !videoState.suppressJump && Math.abs(from - to) > 0.1;

      if (isRealJump) {
        saveEvent({
          type: "video-jump",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: { from: from.toFixed(2), to: to.toFixed(2) }
        });
      }

      // Reset suppressJump only after first seek after rewatch
      if (videoState.suppressJump) videoState.suppressJump = false;

      // Always update lastSeek to current position
      videoState.lastSeek = to;
    });

    // --- Timeupdate for watched-100 and rewatch ---
    video.addEventListener("timeupdate", () => {
      if (startTime) videoState.watchedTime += (Date.now() - startTime) / 1000;
      startTime = Date.now();

      if (!videoState.watched100 && videoState.prevDuration && videoState.watchedTime >= videoState.prevDuration) {
        const videoId = getVideoId();

        // Fire watched-100 + rewatch
        saveEvent({
          type: "video-watched-100",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: videoState.prevDuration.toFixed(2),
          duration: videoState.prevDuration.toFixed(2),
          percent: 100
        });

        saveEvent({
          type: "video-rewatch",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString()
        });

        // Reset state for next round
        videoState.watched100 = true;
        videoState.watchedTime = 0;

        // ✅ Mark that the next automatic jump (from 0 to X) should be ignored
        videoState.suppressJump = true;

        // Update lastSeek to the start of the rewatch video
        videoState.lastSeek = video.currentTime;
      }
    });

    // --- Ended ---
    video.addEventListener("ended", () => {
      if (startTime) videoState.watchedTime += (Date.now() - startTime) / 1000;
      startTime = null;

      if (!videoState.stopped) {
        const videoId = getVideoId();
        const percent = videoState.prevDuration ? Math.min((videoState.watchedTime / videoState.prevDuration) * 100, 100).toFixed(1) : 0;

        saveEvent({
          type: "video-ended",
          videoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          watchedTime: videoState.watchedTime.toFixed(2),
          duration: videoState.prevDuration.toFixed(2),
          percent
        });

        videoState.stopped = true;
        videoState.watchedTime = 0;
      }
    });
  }

  // --- Observe video changes ---
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      if (currentVideo && !videoState.stopped) {
        const videoId = getVideoId();
        const percent = videoState.prevDuration ? Math.min((videoState.watchedTime / videoState.prevDuration) * 100, 100).toFixed(1) : 0;

        saveEvent({
          type: "video-stopped",
          videoId,
          src: currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: videoState.watchedTime.toFixed(2),
          duration: videoState.prevDuration.toFixed(2),
          percent
        });
      }

      if (lastSrc && !videoState.swiped) {
        saveEvent({
          type: "swiped-to-new-video",
          videoId: getVideoId(),
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: { previous: lastSrc }
        });
        videoState.swiped = true;
      }

      currentVideo = video;
      lastSrc = video.src;

      // Reset state for new video
      videoState.started = false;
      videoState.paused = false;
      videoState.watched100 = false;
      videoState.stopped = false;
      videoState.swiped = false;
      videoState.suppressJump = false;
      videoState.lastSeek = 0;
      videoState.watchedTime = 0;
      videoState.prevDuration = video.duration || 0;

      hookVideo(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // --- SPA URL change ---
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const video = document.querySelector("video");
      if (video) hookVideo(video);
    }
  }, 200);
}

// ================== INITIAL RUN ==================
checkConsent();
