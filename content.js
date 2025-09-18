console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  if (localStorage.getItem("swipeConsent")) {
    initExtension(localStorage.getItem("swipeConsent") === "true");
    return;
  }

  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "400px";
  popup.style.padding = "20px";
  popup.style.background = "white";
  popup.style.border = "2px solid #333";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "16px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "center";

  popup.innerHTML = `
    <p><b>Data Collection Notice</b></p>
    <p>This extension collects your video interaction events (play, pause, watch time, jump, like, comment, share, subscribe) for research purposes. A random user ID will be stored locally to recognize you across sessions.</p>
    <p>Do you agree?</p>
    <button id="consent-yes" style="margin-right:10px;padding:6px 12px;">Yes</button>
    <button id="consent-no" style="padding:6px 12px;">No</button>
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

  // ================== VIDEO EVENTS ==================
  let currentVideo = null;
  let lastSrc = null;
  let startTime = null;
  let watchedTime = 0;
  let prevDuration = 0;
  let hasPlayed = false;
  let lastUrl = window.location.href;

  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function saveEvent(eventData) {
    eventData.sessionId = sessionId;
    eventData.userId = userId;
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

    video.addEventListener("loadedmetadata", () => prevDuration = video.duration);

    video.addEventListener("play", () => {
      setTimeout(() => {
        const videoId = getVideoId();
        if (!hasPlayed) saveEvent({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
        else saveEvent({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
        hasPlayed = true;
      }, 100);
      startTime = Date.now();
    });

    video.addEventListener("pause", () => {
      if (startTime) watchedTime += (Date.now() - startTime)/1000;
      startTime = null;
      const videoId = getVideoId();
      const percent = prevDuration ? Math.min((watchedTime/prevDuration)*100,100) : 0;
      saveEvent({ type: "video-paused", videoId, src: video.src, timestamp: new Date().toISOString(), watchedTime: watchedTime.toFixed(2), duration: prevDuration.toFixed(2), percent: percent.toFixed(1) });
    });

    video.addEventListener("ended", () => {
      if (startTime) watchedTime += (Date.now() - startTime)/1000;
      startTime = null;
      const videoId = getVideoId();
      const percent = prevDuration ? Math.min((watchedTime/prevDuration)*100,100) : 0;
      saveEvent({ type: "video-ended", videoId, src: video.src, timestamp: new Date().toISOString(), watchedTime: watchedTime.toFixed(2), duration: prevDuration.toFixed(2), percent: percent.toFixed(1) });
      watchedTime = 0;
    });

    // ================== JUMP/SEEK ==================
    video.addEventListener("seeked", () => {
      const videoId = getVideoId();
      const to = video.currentTime;
      saveEvent({ type: "video-jump", videoId, src: video.src, timestamp: new Date().toISOString(), extra: { from: watchedTime.toFixed(2), to } });
    });

    // ================== INTERACTION EVENTS ==================
    observeInteractions(video);
  }

  // ================== OBSERVE VIDEO CHANGES ==================
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video.src !== lastSrc) {
      if (currentVideo && startTime) watchedTime += (Date.now() - startTime)/1000;

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

  // ================== INTERACTION EVENTS OBSERVER ==================
  function observeInteractions(video) {
    const selectors = {
      like: 'button[aria-label*="like"]',
      dislike: 'button[aria-label*="dislike"]',
      comment: '#comments #submit-button',
      share: 'button[aria-label*="Share"]',
      subscribe: 'tp-yt-paper-button#subscribe-button'
    };

    const attachListener = (type, el) => {
      if (!el._swipeHooked) {
        el._swipeHooked = true;
        el.addEventListener("click", () => {
          saveEvent({ type, videoId: getVideoId(), src: video.src, timestamp: new Date().toISOString() });
        });
      }
    };

    const observer = new MutationObserver(() => {
      Object.entries(selectors).forEach(([type, sel]) => {
        const el = document.querySelector(sel);
        if (el) attachListener(type, el);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// ================== START ==================
showConsentPopup();
