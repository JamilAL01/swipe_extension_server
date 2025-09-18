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
    <p>This extension collects your video interaction events (play, pause, watch time, likes, comments, shares, etc.) 
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

  // ---------- VIDEO & INTERACTION EVENT LOGIC ----------
  attachVideoTracking();
  attachInteractionTracking();
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

// ================== VIDEO TRACKING ==================
function attachVideoTracking() {
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

  function getChannelName() {
    const channelEl = document.querySelector("#owner-name a");
    return channelEl ? channelEl.textContent.trim() : null;
    }


  function saveEvent(eventData) {
    eventData.sessionId = window._swipeSessionId;
    eventData.userId = window._swipeUserId;
    eventData.channelName = getChannelName(); // ✅ add channel name
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
      const direction = to > watchedTime ? "jump-forward" : "jump-backward";
      saveEvent({
        type: "video-jump",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { from: watchedTime.toFixed(2), to, direction }
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

  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      const video = document.querySelector("video");
      if (video) attachVideoEvents(video);
    }
  }, 100);
}

// ================== INTERACTION TRACKING ==================
function attachInteractionTracking() {
  const interactions = [
    { selector: 'ytd-toggle-button-renderer[aria-label*="like"]', type: "like" },
    { selector: 'ytd-toggle-button-renderer[aria-label*="dislike"]', type: "dislike" },
    { selector: 'ytd-button-renderer#subscribe-button', type: "subscribe" },
    { selector: 'ytd-button-renderer[aria-label*="comment"]', type: "comment" },
    { selector: 'ytd-button-renderer[aria-label*="share"]', type: "share" },
  ];

  interactions.forEach(({ selector, type }) => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener("click", () => {
        const videoId = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (!videoId) return;
        fetch("https://swipe-extension-server-2.onrender.com/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            videoId,
            sessionId: window._swipeSessionId,
            userId: window._swipeUserId,
            channelName: document.querySelector('#channel-name a, #owner-name a')?.textContent.trim() || null,
            timestamp: new Date().toISOString(),
          }),
        });
      });
    }
  });
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
