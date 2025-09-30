console.log("[SwipeExtension] Content script injected ✅");

// ================== GDPR CONSENT ==================
let consent = localStorage.getItem("swipeConsent");

function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return;

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "500px";
  popup.style.padding = "25px";
  popup.style.background = "white";
  popup.style.border = "2px solid #444";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "16px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "center";

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">🔒 Data Collection Notice</h2>
    <p style="line-height:1.5;">
      This extension records your interactions with YouTube Shorts
      (<b>play, pause, skips, watch time, likes, shares</b>, etc.) for research purposes.
      Your identity remains completely anonymous. A randomly generated ID is stored locally only to recognize repeated usage across sessions.
    </p>
    <p><b>Do you agree?</b></p>
    <button id="consent-yes" style="margin:10px; padding:10px 20px; font-size:16px; cursor:pointer;">✅ Yes</button>
    <button id="consent-no" style="margin:10px; padding:10px 20px; font-size:16px; cursor:pointer;">❌ No</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent", "yes");
    consent = "yes";
    popup.remove();
    console.log("[SwipeExtension] User consented ✅");
    showSurveyPopup(); // show survey only after consent
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "no");
    consent = "no";
    popup.remove();
    console.log("[SwipeExtension] User declined ❌");
  };
}

// Show popup if no choice made yet
if (!consent) {
  showConsentPopup();
} else if (consent === "yes") {
  showSurveyPopup();
}

// ================== SURVEY POPUP ==================
function showSurveyPopup() {
  if (localStorage.getItem("surveyDone")) return; // only once per user

  const popup = document.createElement("div");
  popup.id = "survey-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "500px";
  popup.style.padding = "25px";
  popup.style.background = "white";
  popup.style.border = "2px solid #444";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  popup.style.zIndex = "10000";
  popup.style.fontSize = "16px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "left";
  popup.style.maxHeight = "80vh";
  popup.style.overflowY = "auto";

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">📝 Quick Survey</h2>
    <p>Please answer a few short questions:</p>

    <label>1. How often do you watch YouTube Shorts?</label><br>
    <select id="q1" style="width:100%; padding:5px; margin:5px 0;">
      <option value="">-- Select --</option>
      <option value="Daily">Daily</option>
      <option value="Several times per week">Several times per week</option>
      <option value="Rarely">Rarely</option>
      <option value="Never">Never</option>
    </select><br><br>

    <label>2. What device do you usually use?</label><br>
    <select id="q2" style="width:100%; padding:5px; margin:5px 0;">
      <option value="">-- Select --</option>
      <option value="Desktop computer">Desktop computer</option>
      <option value="Laptop">Laptop</option>
      <option value="Smartphone">Smartphone</option>
      <option value="Tablet">Tablet</option>
    </select><br><br>

    <label>3. What type of content do you prefer?</label><br>
    <select id="q3" style="width:100%; padding:5px; margin:5px 0;">
      <option value="">-- Select --</option>
      <option value="Comedy & Entertainment">Comedy & Entertainment</option>
      <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
      <option value="Movies & Animation">Movies & Animation</option>
      <option value="Science & Technology">Science & Technology</option>
      <option value="Gaming">Gaming</option>
    </select><br><br>

    <label>4. Your age group?</label><br>
    <select id="q4" style="width:100%; padding:5px; margin:5px 0;">
      <option value="">-- Select --</option>
      <option value="Under 18">Under 18</option>
      <option value="18-25">18-25</option>
      <option value="26-35">26-35</option>
      <option value="36 and above">36 and above</option>
    </select><br><br>

    <label>5. Do you often interact with Shorts?</label><br>
    <select id="q5" style="width:100%; padding:5px; margin:5px 0;">
      <option value="">-- Select --</option>
      <option value="Like or dislike">Like or dislike</option>
      <option value="Comment on videos">Comment on videos</option>
      <option value="Share with others">Share with others</option>
      <option value="All of the above">All of the above</option>
      <option value="I usually just watch without engaging">I usually just watch without engaging</option>
    </select><br><br>

    <label>6. Any other comments?</label><br>
    <textarea id="q6" rows="3" style="width:100%;"></textarea><br><br>

    <button id="survey-submit" style="padding:10px 20px; font-size:16px; cursor:pointer;">Submit ✅</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("survey-submit").onclick = () => {
    const answers = {
      q1: document.getElementById("q1").value,
      q2: document.getElementById("q2").value,
      q3: document.getElementById("q3").value,
      q4: document.getElementById("q4").value,
      q5: document.getElementById("q5").value,
      q6: document.getElementById("q6").value,
    };

    if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q5) {
      alert("⚠️ Please answer all required questions before submitting.");
      return;
    }

    fetch("https://swipe-extension-server-2.onrender.com/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionId,
        answers,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(res => res.json())
      .then(() => {
        console.log("[SwipeExtension] Survey saved ✅", answers);
        localStorage.setItem("surveyDone", "true");
        popup.remove();
      })
      .catch(err => console.error("[SwipeExtension] Survey error ❌", err));
  };
}


// ================== USER & SESSION SETUP ==================
let userId = localStorage.getItem("swipeUserId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("swipeUserId", userId);
}

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
  if (consent !== "yes") {
    console.log("[SwipeExtension] Tracking disabled by GDPR ❌");
    return;
  }

  eventData.sessionId = sessionId;
  eventData.userId = userId;
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
    // Prevent false video-jump on rewatch
    if (startTime) watchedTime += (Date.now() - startTime) / 1000;
    startTime = null;
    const videoId = getVideoId();
    if (prevDuration && Math.abs(watchedTime - prevDuration) < 2) {
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
    }
    watchedTime = 0;
  });

  video.addEventListener("seeked", () => {
    const videoId = getVideoId();
    if (Math.abs(video.currentTime) < 0.01) return; // skip "rewatch" resets
    saveEvent({
      type: "video-jump",
      videoId,
      src: video.src,
      timestamp: new Date().toISOString(),
      extra: { jumpTo: video.currentTime.toFixed(2) },
    });
    console.log(`[SwipeExtension] video-jump ⏭️ ${video.src} (ID: ${videoId}) - Jumped to ${video.currentTime.toFixed(2)}s`);
  });
}

// ================== LIKE / DISLIKE / SHARE ==================
function attachActionEvents() {
  const likeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(1) button');
  const dislikeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(2) button');
  const shareBtn = document.querySelector('ytd-button-renderer[button-renderer][is-icon-button] button, #share-button button');

  if (likeBtn && !likeBtn._hooked) {
    likeBtn._hooked = true;
    likeBtn.addEventListener("click", () => {
      saveEvent({ type: "video-like", videoId: getVideoId(), src: currentVideo?.src, timestamp: new Date().toISOString() });
    });
  }

  if (dislikeBtn && !dislikeBtn._hooked) {
    dislikeBtn._hooked = true;
    dislikeBtn.addEventListener("click", () => {
      saveEvent({ type: "video-dislike", videoId: getVideoId(), src: currentVideo?.src, timestamp: new Date().toISOString() });
    });
  }

  if (shareBtn && !shareBtn._hooked) {
    shareBtn._hooked = true;
    shareBtn.addEventListener("click", () => {
      saveEvent({ type: "video-share", videoId: getVideoId(), src: currentVideo?.src, timestamp: new Date().toISOString() });
    });
  }
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
    attachActionEvents();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// ================== VIDEO RESOLUTION ======================

function trackResolutionChanges(video) {
  let lastWidth = video.videoWidth;
  let lastHeight = video.videoHeight;

  setInterval(() => {
    if (video.videoWidth !== lastWidth || video.videoHeight !== lastHeight) {
      lastWidth = video.videoWidth;
      lastHeight = video.videoHeight;

      console.log(`[SwipeExtension] Resolution changed to ${lastWidth}x${lastHeight}`);

      saveEvent({
        type: 'video-resolution-change',
        videoId: getVideoId(),
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { width: lastWidth, height: lastHeight }
      });
    }
  }, 1000); // check every 1 second
}


// ================== RE-HOOK ON URL CHANGE ==================
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
    attachActionEvents();
  }
}, 1000);
