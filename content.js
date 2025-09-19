console.log("[SwipeExtension] Content script injected ✅"); 

// ================== SESSION SETUP ==================
let sessionId = sessionStorage.getItem("swipeSessionId");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  sessionStorage.setItem("swipeSessionId", sessionId);
}

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
  console.log("[SwipeExtension] Event saved:", eventData);

  fetch("https://swipe-extension-server-2.onrender.com/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  })
    .then(res => {
      if (!res.ok) console.error("[SwipeExtension] Server error ❌", res.statusText);
    })
    .catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
}

// ================== VIDEO EVENT HOOK ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;

  console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${getVideoId()})`);

  let lastTime = video.currentTime || 0;

  video.addEventListener("loadedmetadata", () => {
    prevDuration = video.duration;
    lastTime = video.currentTime || 0;
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
    const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
    saveEvent({ 
      type: "video-paused",
      videoId: getVideoId(),
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
    const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
    saveEvent({
      type: "video-ended",
      videoId: getVideoId(),
      src: video.src,
      timestamp: new Date().toISOString(),
      watchedTime: watchedTime.toFixed(2),
      duration: prevDuration.toFixed(2),
      percent: watchPercent.toFixed(1),
    });
    watchedTime = 0;
  });

  // ================== JUMP / SEEK EVENT ==================
  video.addEventListener("seeking", () => {
    lastTime = video.currentTime;
  });

  video.addEventListener("seeked", () => {
    const newTime = video.currentTime;
    if (Math.abs(newTime - lastTime) < 0.01) return; // ignore tiny changes
    const direction = newTime > lastTime ? "jump-forward" : "jump-backward";
    saveEvent({
      type: "video-jump",
      videoId: getVideoId(),
      src: video.src,
      timestamp: new Date().toISOString(),
      extra: { direction, from: lastTime.toFixed(2), to: newTime.toFixed(2) },
    });
    lastTime = newTime;
  });
}

// ================== OBSERVE VIDEO CHANGES ==================
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (video && video.src !== lastSrc) {
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
        videoId: getVideoId(),
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
