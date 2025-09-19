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
      if (res.ok) console.log("[SwipeExtension] Sent to server ✅");
      else console.error("[SwipeExtension] Server error ❌", res.statusText);
    })
    .catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
}

// ================== VIDEO EVENT HOOK ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;

  console.log(`[SwipeExtension] 🎥 Hooking into video: ${video.src} (ID: ${getVideoId()})`);

  let lastTime = 0;
  let jumpCount = 0; // counter for jumps

  video.addEventListener("loadedmetadata", () => {
    prevDuration = video.duration;
    lastTime = video.currentTime || 0;
    jumpCount = 0;
  });

  video.addEventListener("play", () => {
    setTimeout(() => {
      const videoId = getVideoId();
      if (!hasPlayed) {
        console.log(`[SwipeExtension] video-start ▶️ ${video.src} (ID: ${videoId})`);
        saveEvent({ type: "video-start", videoId, src: video.src, timestamp: new Date().toISOString() });
        hasPlayed = true;
      } else {
        console.log(`[SwipeExtension] video-resume ▶️ ${video.src} (ID: ${videoId})`);
        saveEvent({ type: "video-resume", videoId, src: video.src, timestamp: new Date().toISOString() });
      }
    }, 100);
    startTime = Date.now();
  });

  video.addEventListener("pause", () => {
    if (startTime) watchedTime += (Date.now() - startTime) / 1000;
    startTime = null;
    const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
    const videoId = getVideoId();
    console.log(`[SwipeExtension] video-paused ⏸️ ${video.src} (ID: ${videoId}) - Watched: ${watchedTime.toFixed(2)}s / ${prevDuration.toFixed(2)}s (${watchPercent.toFixed(1)}%)`);
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
      const watchPercent = 100;
      saveEvent({
        type: "video-watched-100",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: prevDuration.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: watchPercent,
      });

      console.log(`[SwipeExtension] video-rewatch 🔁 ${video.src} (ID: ${videoId})`);
      saveEvent({ type: "video-rewatch", videoId, src: video.src, timestamp: new Date().toISOString() });
      watchedTime = 0;
    }
  });

  video.addEventListener("ended", () => {
    if (startTime) watchedTime += (Date.now() - startTime) / 1000;
    startTime = null;
    const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
    const videoId = getVideoId();
    console.log(`[SwipeExtension] video-ended ⏹️ ${video.src} (ID: ${videoId}) - Watched: ${watchedTime.toFixed(2)}s / ${prevDuration.toFixed(2)}s (${watchPercent.toFixed(1)}%)`);
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
  video.addEventListener("seeking", () => {
    lastTime = video.currentTime;
  });

  video.addEventListener("seeked", () => {
    const newTime = video.currentTime;
    if (Math.abs(newTime - lastTime) < 0.01) return; // ignore tiny movements
    const videoId = getVideoId();
    const direction = newTime > lastTime ? "jump-forward" : "jump-backward";

    jumpCount += 1; // increment jump counter

    console.log(`[SwipeExtension] video-jump ⏩ ${direction} (from ${lastTime.toFixed(2)}s to ${newTime.toFixed(2)}s) | jump #${jumpCount}`);

    saveEvent({
      type: "video-jump",
      videoId,
      src: video.src,
      timestamp: new Date().toISOString(),
      extra: { direction, from: lastTime.toFixed(2), to: newTime.toFixed(2), jumpCount },
    });

    lastTime = newTime;
  });
}

// ================== OBSERVE VIDEO CHANGES ==================
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (video && video.src !== lastSrc) {
    const videoId = getVideoId();

    if (currentVideo && startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
      const watchPercent = prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100) : 0;
      const stoppedId = getVideoId();
      console.log(`[SwipeExtension] video-stopped ⏹️ ${currentVideo.src} (ID: ${stoppedId}) - Watched: ${watchedTime.toFixed(2)}s / ${prevDuration.toFixed(2)}s (${watchPercent.toFixed(1)}%)`);
      saveEvent({
        type: "video-stopped",
        videoId: stoppedId,
        src: currentVideo.src,
        timestamp: new Date().toISOString(),
        watchedTime: watchedTime.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: watchPercent.toFixed(1),
      });
    }

    if (lastSrc) {
      console.log(`[SwipeExtension] swiped-to-new-video ↕️ Previous: ${lastSrc} (ID: ${getVideoId() || "N/A"})`);
      saveEvent({
        type: "swiped-to-new-video",
        videoId: videoId,
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
    const newId = getVideoId();
    console.log("[SwipeExtension] URL changed, new video ID:", newId);
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
  }
}, 100);

observer.observe(document.body, { childList: true, subtree: true });
