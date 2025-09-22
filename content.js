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
    initExtension();
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "false");
    popup.remove();
    console.log("[SwipeExtension] Tracking disabled by user ❌");
  };
}

// ================== USER & SESSION SETUP ==================
let userId, sessionId;
let consent = localStorage.getItem("swipeConsent");
let trackingEnabled = consent === "true";

if (trackingEnabled) {
  userId = localStorage.getItem("swipeUserId");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("swipeUserId", userId);
  }

  sessionId = sessionStorage.getItem("swipeSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("swipeSessionId", sessionId);
  }
}

// ================== VIDEO TRACKING STATE ==================
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
  if (!trackingEnabled) return; // stop tracking if user declined
  eventData.sessionId = sessionId;
  eventData.userId = userId;
  console.log("[SwipeExtension] Event saved:", eventData);

  fetch("https://swipe-extension-server-2.onrender.com/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  }).catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
}

// ================== VIDEO EVENT HOOK ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;

  video.addEventListener("loadedmetadata", () => {
    prevDuration = video.duration;
  });

  video.addEventListener("play", () => {
    startTime = Date.now();
    setTimeout(() => {
      const videoId = getVideoId();
      if (!hasPlayed) {
        saveEvent({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
        hasPlayed = true;
      } else {
        saveEvent({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
      }
    }, 100);
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

// ================== SPA URL CHANGE CHECK ==================
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
  }
}, 200);

// ================== INITIAL RUN ==================
if (consent === null) {
  showConsentPopup(); // only show if user hasn't made a choice
} else if (consent === "true") {
  trackingEnabled = true;
  initExtension();
} else {
  trackingEnabled = false;
  console.log("[SwipeExtension] Tracking disabled by previous user choice ❌");
}

// ================== INIT FUNCTION ==================
function initExtension() {
  if (!trackingEnabled) return;
  console.log("[SwipeExtension] Tracking enabled ✅ UserID:", userId, "SessionID:", sessionId);
}
