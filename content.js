console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.right = "20px";
  popup.style.width = "320px";
  popup.style.padding = "15px";
  popup.style.background = "white";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "14px";
  popup.style.fontFamily = "Arial, sans-serif";

  popup.innerHTML = `
    <p><b>Data Collection Notice</b></p>
    <p>This extension collects your video interaction events (play, pause, watch time, etc.)
    for research purposes. A random user ID will be stored locally to recognize you across sessions.</p>
    <p>Do you agree?</p>
    <button id="consent-yes" style="margin-right:10px;">Yes</button>
    <button id="consent-no">No</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent", "true");
    popup.remove();
    initExtension(true); // persistent ID
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "false");
    popup.remove();
    initExtension(false); // session-only ID
  };
}

// ================== INITIALIZATION ==================
function initExtension(persistent = true) {
  console.log("[SwipeExtension] Initializing...");

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

  let currentVideo = null;
  let lastSrc = null;
  let startTime = null;
  let watchedTime = 0;
  let prevDuration = 0;
  let hasPlayed = false;
  let lastUrl = window.location.href;

  // ================== HELPER FUNCTIONS ==================
  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function saveEvent(eventData) {
    eventData.sessionId = sessionId;
    eventData.userId = userId; // add user ID
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

  // ================== VIDEO EVENT HOOK ==================
  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;

    console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${getVideoId()})`);

    video.addEventListener("loadedmetadata", () => {
      prevDuration = video.duration;
    });

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

    // ================== NEW: JUMP / SEEK EVENT ==================
    let seekFrom = null;

    video.addEventListener("seeking", () => {
      seekFrom = video.currentTime;
    });

    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = video.currentTime;
      console.log(`[SwipeExtension] video-jump 🔀 ${video.src} (ID: ${videoId}) - from ${seekFrom?.toFixed(2)}s to ${to.toFixed(2)}s`);
      saveEvent({
        type: "video-jump",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: seekFrom, to },
      });
      seekFrom = null;
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

// ================== STARTUP ==================
if (localStorage.getItem("swipeConsent") === "true") {
  initExtension(true);
} else if (localStorage.getItem("swipeConsent") === "false") {
  initExtension(false);
} else {
  showConsentPopup();
}
