console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return;

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

  let sessionId = sessionStorage.getItem("swipeSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("swipeSessionId", sessionId);
  }
  window._swipeSessionId = sessionId;

  attachVideoTracking();
}

// ================== CONSENT CHECK ==================
function checkConsent() {
  const consent = localStorage.getItem("swipeConsent");
  if (consent === "true") initExtension(true);
  else if (consent === "false") {
    console.log("[SwipeExtension] User declined tracking ❌");
    return;
  } else {
    showConsentPopup();
  }
}

// ================== VIDEO TRACKING ==================
function attachVideoTracking() {
  let currentVideo = null;
  let lastSrc = null;
  let videoState = {};

  // === SPA re-hook
  let lastUrl = window.location.href;

  function makeVideoState() {
    return {
      videoId: null,
      src: null,
      duration: 0,
      lastCurrentTime: null,
      watchedTime: 0,
      started: false,
      ended: false,
      emitted: new Set(),
      lastEventTs: {},
      hookedAt: Date.now(),
      endedAt: 0,
      playAt: 0
    };
  }

  videoState = makeVideoState();

  const DEDUPE_MS = 500;
  const HOOK_GRACE_MS = 1200;
  const AUTOPLAY_REWATCH_MS = 2500;
  const JUMP_MIN_DELTA_SEC = 0.9;
  const SINGLE_SHOT = new Set([
    "video-start", "video-stopped", "video-watched-100", "video-rewatch", "swiped-to-new-video"
  ]);

  function getVideoId() {
    const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function sendEventToServer(payload) {
    payload.sessionId = window._swipeSessionId;
    payload.userId = window._swipeUserId;
    console.log("[SwipeExtension] Event ->", payload);
    fetch("https://swipe-extension-server-2.onrender.com/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(res => {
      if (!res.ok) console.error("[SwipeExtension] Server error", res.statusText);
    }).catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
  }

  function dispatchEvent(type, extra = {}) {
    const now = Date.now();
    if (videoState.lastEventTs[type] && now - videoState.lastEventTs[type] < DEDUPE_MS) return;
    if (SINGLE_SHOT.has(type) && videoState.emitted.has(type)) return;

    videoState.lastEventTs[type] = now;
    if (SINGLE_SHOT.has(type)) videoState.emitted.add(type);

    if (!videoState.started && !["video-start"].includes(type)) {
      videoState.started = true;
      videoState.emitted.add("video-start");
      sendEventToServer({
        type: "video-start",
        videoId: videoState.videoId,
        src: videoState.src,
        timestamp: new Date().toISOString()
      });
    }

    const payload = {
      type,
      videoId: videoState.videoId,
      src: videoState.src,
      timestamp: new Date().toISOString(),
      ...extra
    };
    sendEventToServer(payload);
  }

  function attachVideoEvents(video) {
    if (!video || video._hooked) return;
    video._hooked = true;
    videoState.hookedAt = Date.now();
    videoState.videoId = getVideoId();
    videoState.src = video.src || null;
    videoState.duration = video.duration || 0;
    videoState.lastCurrentTime = null;
    videoState.watchedTime = 0;
    videoState.started = false;
    videoState.ended = false;
    videoState.emitted = new Set();
    videoState.lastEventTs = {};

    video.addEventListener("loadedmetadata", () => {
      videoState.duration = video.duration || videoState.duration || 0;
    });

    video.addEventListener("play", () => {
      videoState.playAt = Date.now();
      videoState.lastCurrentTime = video.currentTime || 0;
      if (!videoState.started) {
        dispatchEvent("video-start");
        videoState.started = true;
      } else {
        dispatchEvent("video-resume");
      }
    });

    video.addEventListener("timeupdate", () => {
      const t = Number(video.currentTime || 0);
      if (typeof videoState.lastCurrentTime === "number") {
        const delta = t - videoState.lastCurrentTime;
        if (delta > 0 && delta < 60) videoState.watchedTime += delta;
      }
      videoState.lastCurrentTime = t;

      if (!videoState.emitted.has("video-watched-100") && videoState.duration && videoState.watchedTime >= (videoState.duration - 0.15)) {
        dispatchEvent("video-watched-100", {
          watchedTime: Number(videoState.duration.toFixed(2)),
          duration: Number(videoState.duration.toFixed(2)),
          percent: 100
        });
      }
    });

    video.addEventListener("pause", () => {
      const t = Number(video.currentTime || 0);
      if (typeof videoState.lastCurrentTime === "number") {
        const delta = t - videoState.lastCurrentTime;
        if (delta > 0 && delta < 60) videoState.watchedTime += delta;
      }
      videoState.lastCurrentTime = null;

      dispatchEvent("video-paused", {
        watchedTime: Number(videoState.watchedTime.toFixed(2)),
        duration: Number((videoState.duration || 0).toFixed(2)),
        percent: videoState.duration ? Number(Math.min((videoState.watchedTime / videoState.duration) * 100, 100).toFixed(1)) : 0
      });
    });

    video.addEventListener("ended", () => {
      const t = Number(video.currentTime || 0);
      if (typeof videoState.lastCurrentTime === "number") {
        const delta = t - videoState.lastCurrentTime;
        if (delta > 0 && delta < 60) videoState.watchedTime += delta;
      }
      videoState.lastCurrentTime = null;

      if (!videoState.emitted.has("video-watched-100")) {
        dispatchEvent("video-watched-100", {
          watchedTime: Number((videoState.duration || videoState.watchedTime).toFixed(2)),
          duration: Number((videoState.duration || 0).toFixed(2)),
          percent: 100
        });
      }

      dispatchEvent("video-ended", {
        watchedTime: Number((videoState.duration || videoState.watchedTime).toFixed(2)),
        duration: Number((videoState.duration || 0).toFixed(2)),
        percent: 100
      });

      videoState.ended = true;
      videoState.endedAt = Date.now();
    });

    video.addEventListener("seeked", () => {
      const to = Number((video.currentTime || 0).toFixed(3));
      const prev = (typeof videoState.lastCurrentTime === "number") ? videoState.lastCurrentTime : 0;
      const delta = Math.abs(to - prev);
      const now = Date.now();

      if (videoState.ended && (now - videoState.endedAt) <= 2500 && to <= 0.5) {
        if (!videoState.emitted.has("video-watched-100")) {
          dispatchEvent("video-watched-100", {
            watchedTime: Number((videoState.duration || videoState.watchedTime).toFixed(2)),
            duration: Number((videoState.duration || 0).toFixed(2)),
            percent: 100
          });
        }
        dispatchEvent("video-rewatch");
        videoState.watchedTime = 0;
        videoState.lastCurrentTime = to;
        videoState.started = true;
        videoState.emitted = new Set();
        return;
      }

      if ((now - videoState.hookedAt) <= 1200 && to <= 0.5 && prev <= 0.5) {
        videoState.lastCurrentTime = to;
        return;
      }

      if (delta >= 0.9) {
        dispatchEvent("video-jump", { extra: { from: Number(prev.toFixed(2)), to: Number(to.toFixed(2)) } });
      } else {
        videoState.lastCurrentTime = to;
      }
    });
  }

  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    const vidId = getVideoId();
    const srcChanged = video && video.src !== lastSrc;
    const idChanged = vidId && vidId !== videoState.videoId;

    if (video && (srcChanged || idChanged)) {
      if (currentVideo) {
        if (typeof videoState.lastCurrentTime === "number" && currentVideo.currentTime) {
          const t = Number(currentVideo.currentTime || 0);
          const delta = t - videoState.lastCurrentTime;
          if (delta > 0 && delta < 60) videoState.watchedTime += delta;
        }

        dispatchEvent("video-stopped", {
          watchedTime: Number(videoState.watchedTime.toFixed(2)),
          duration: Number((videoState.duration || 0).toFixed(2)),
          percent: videoState.duration ? Number(Math.min((videoState.watchedTime / videoState.duration) * 100, 100).toFixed(1)) : 0
        });
      }

      if (lastSrc) {
        dispatchEvent("swiped-to-new-video", { extra: { previous: lastSrc } });
      }

      currentVideo = video;
      lastSrc = video ? video.src : null;

      videoState = makeVideoState();
      videoState.videoId = vidId;
      videoState.src = lastSrc;
      videoState.duration = video ? (video.duration || 0) : 0;
      videoState.hookedAt = Date.now();
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
  }, 300);
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
