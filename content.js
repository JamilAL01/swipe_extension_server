console.log("[SwipeExtension] Content script injected ✅");

// ================== TRANSLATIONS ==================
const translations = { /* ... keep your translations object as-is ... */ };

// ================== LANGUAGE ==================
let selectedLang = localStorage.getItem("swipeLang") || (navigator.language.startsWith("fr") ? "fr" : "en");
let consent = localStorage.getItem("swipeConsent");

// ================== GLOBAL USER & SESSION ID ==================
let userId = localStorage.getItem("swipeUserId") || crypto.randomUUID();
localStorage.setItem("swipeUserId", userId);
let sessionId = crypto.randomUUID();
window._swipeUserId = userId;
window._swipeSessionId = sessionId;

// ================== CONSENT POPUP ==================
function showConsentPopup() {
  const t = translations[selectedLang];
  const old = document.getElementById("swipe-consent-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style = `
    position: fixed; top:50%; left:50%; transform: translate(-50%,-50%);
    width: 500px; padding:25px; background:white; border:2px solid #444; border-radius:12px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:9999; font-size:16px; font-family:Arial,sans-serif; text-align:center;
  `;

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">${t.consentTitle}</h2>
    <p style="margin-bottom:10px; margin-top:15px;">Select language / Choisir la langue:</p>
    <select id="lang-select" style="margin-bottom:20px; padding:8px 10px;">
      <option value="en" ${selectedLang==="en"?"selected":""}>English</option>
      <option value="fr" ${selectedLang==="fr"?"selected":""}>Français</option>
    </select>
    <p style="line-height:1.5;">${t.consentText}</p>
    <p><b>${t.consentQuestion}</b></p>
    <button id="consent-yes" style="margin:10px; padding:10px 20px; cursor:pointer;">${t.yes}</button>
    <button id="consent-no" style="margin:10px; padding:10px 20px; cursor:pointer;">${t.no}</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("lang-select").onchange = e => {
    selectedLang = e.target.value;
    localStorage.setItem("swipeLang", selectedLang);
    showConsentPopup();
  };

  document.getElementById("consent-yes").onclick = () => {
    localStorage.setItem("swipeConsent","yes");
    consent = "yes";
    popup.remove();
    window._swipeConsentDismissedAt = performance.now();
    console.log("[SwipeExtension] User consented ✅");
    showSurveyPopup();
  };

  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent","no");
    consent = "no";
    popup.remove();
    console.log("[SwipeExtension] User declined ❌");
  };
}

// ================== SURVEY POPUP ==================
function showSurveyPopup() {
  if (localStorage.getItem("surveyDone")) return;
  const t = translations[selectedLang];

  const popup = document.createElement("div");
  popup.id = "survey-popup";
  popup.style = `
    position: fixed; top:50%; left:50%; transform: translate(-50%,-50%);
    width:500px; padding:25px; background:white; border:2px solid #444; border-radius:12px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:10000; font-size:16px; font-family:Arial,sans-serif;
    text-align:left; max-height:80vh; overflow-y:auto;
  `;

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">${t.surveyTitle}</h2>
    <p>${t.surveyText}</p>
    ${["q1","q2","q3","q4","q5"].map(q=>`
      <label>${t[q]}</label><br>
      <select id="${q}" style="width:100%; padding:5px; margin:5px 0;">
        ${t[q+"Options"].map(opt=>`<option value="${opt}">${opt}</option>`).join('')}
      </select><br><br>
    `).join('')}
    <label>${t.q6}</label><br>
    <textarea id="q6" rows="3" style="width:100%;"></textarea><br><br>
    <button id="survey-submit" style="padding:10px 20px; cursor:pointer;">${t.submit}</button>
  `;

  document.body.appendChild(popup);
  const submitBtn = document.getElementById("survey-submit");

  const handleSurveySubmit = () => {
    submitBtn.disabled = true;
    const ts = new Date().toISOString();

    const answers = ["q1","q2","q3","q4","q5","q6"].reduce((acc,key)=>{
      acc[key] = document.getElementById(key).value;
      return acc;
    }, {});

    if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q5 ||
        answers.q1.startsWith("--") || answers.q2.startsWith("--") ||
        answers.q3.startsWith("--") || answers.q4.startsWith("--") ||
        answers.q5.startsWith("--")) {
      alert(t.alertIncomplete);
      submitBtn.disabled = false;
      return;
    }

    if (!window._swipeUserId || !window._swipeSessionId) {
      console.warn("[SwipeExtension] Survey submission delayed — user/session not initialized yet");
      setTimeout(() => submitBtn.click(), 500);
      return;
    }

    const screenInfo = `${window.innerWidth}x${window.innerHeight}`;
    const deviceType = window.innerWidth <= 768 ? "mobile" :
                       window.innerWidth <= 1024 ? "tablet" :
                       window.innerWidth <= 1440 ? "laptop" : "desktop";

    fetch("https://swipe-extension-server-2.onrender.com/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, sessionId, answers, screen_size: screenInfo,
        device_type: deviceType, timestamp: ts
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Survey save failed");
      console.log("[SwipeExtension] Survey saved ✅", answers);
      localStorage.setItem("surveyDone","true");
      popup.remove();
    })
    .catch(err => {
      console.error("[SwipeExtension] Survey error ❌", err);
      submitBtn.disabled = false;
    })
    .finally(() => submitBtn.removeEventListener("click", handleSurveySubmit));
  };

  submitBtn.onclick = null;
  submitBtn.addEventListener("click", handleSurveySubmit);
}

// ================== CONSENT CHECK ==================
if (!consent) showConsentPopup();
else if (consent === "yes") showSurveyPopup();

// ================== EVENT TRACKING ==================
let currentVideo = null, lastSrc = null, startTime = null, watchedTime = 0, prevDuration = 0, hasPlayed = false;
let lastUrl = window.location.href;

function getVideoId() {
  const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ================== SAVE EVENT (consistent timestamp) ==================
function saveEvent(eventData, timestamp=null) {
  if (consent !== "yes") return;

  const ts = timestamp || new Date().toISOString();
  const payload = {...eventData, userId, sessionId, timestamp: ts};

  console.log("[SwipeExtension] Event saved:", payload);

  fetch("https://swipe-extension-server-2.onrender.com/api/events", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => res.ok ? console.log("[SwipeExtension] Sent to server ✅") : console.error("[SwipeExtension] Server error ❌", res.statusText))
  .catch(err => console.error("[SwipeExtension] Fetch error ❌", err));
}

// ================== UPDATE STATS (sorted by timestamp) ==================
function updateStats(watchedTime, percentWatched, duration, currentBitrate=null) {
  chrome.storage.local.get(['videosWatched','totalWatchedTime','avgPercentWatched','videoHistory'], data => {
    const videos = (data.videosWatched || 0) + 1;
    const totalTime = (data.totalWatchedTime || 0) + watchedTime;
    const avgPercent = ((data.avgPercentWatched || 0) * (videos-1) + percentWatched) / videos;

    const history = data.videoHistory || [];
    history.push({duration, percentWatched, watchedTime, currentBitrate, timestamp: new Date().toISOString()});
    history.sort((a,b)=> new Date(a.timestamp) - new Date(b.timestamp));

    chrome.storage.local.set({
      videosWatched: videos,
      totalWatchedTime: totalTime,
      avgPercentWatched: avgPercent,
      videoHistory: history
    });
  });
}

// ================== VIDEO EVENT ATTACH ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;

  video.addEventListener("play", () => {
    const ts = new Date().toISOString();
    if (!hasPlayed) {
      saveEvent({type:"video-start", videoId:getVideoId(), src:video.src}, ts);
      hasPlayed = true;
    } else {
      saveEvent({type:"video-resume", videoId:getVideoId(), src:video.src}, ts);
    }
    startTime = Date.now();
  });

  video.addEventListener("pause", () => {
    const ts = new Date().toISOString();
    if (startTime) watchedTime += (Date.now() - startTime)/1000;
    startTime = null;

    const videoId = getVideoId();
    const watchPercent = prevDuration ? Math.min((watchedTime/prevDuration)*100,100) : 0;

    saveEvent({type:"video-paused", videoId, src:video.src, watchedTime:watchedTime.toFixed(2), duration:prevDuration.toFixed(2), percent:watchPercent.toFixed(1)}, ts);
  });

  video.addEventListener("ended", () => {
    const ts = new Date().toISOString();
    if (startTime) watchedTime += (Date.now() - startTime)/1000;
    startTime = null;

    const videoId = getVideoId();
    if (prevDuration && Math.abs(watchedTime - prevDuration)<2) {
      saveEvent({type:"video-watched-100", videoId, src:video.src, watchedTime:prevDuration.toFixed(2), duration:prevDuration.toFixed(2), percent:100}, ts);
      saveEvent({type:"video-rewatch", videoId, src:video.src}, ts);
    }
    watchedTime = 0;
  });

}

// ================== VIDEO SEEK ==================
function attachSeekEvents(video) {
  if (!video || video._seekHooked) return;
  video._seekHooked = true;

  video.addEventListener("seeked", () => {
    const ts = new Date().toISOString();
    const videoId = getVideoId();
    if (Math.abs(video.currentTime) < 0.01) return; // skip trivial rewinds

    saveEvent({
      type: "video-jump",
      videoId,
      src: video.src,
      extra: { jumpTo: video.currentTime.toFixed(2) }
    }, ts);

    console.log(`[SwipeExtension] video-jump ${video.src} - Jumped to ${video.currentTime.toFixed(2)}s`);
  });
}

// ================== LIKE / DISLIKE / SHARE ==================
function attachActionEvents() {
  const likeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(1) button');
  const dislikeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(2) button');
  const shareBtn = document.querySelector('ytd-button-renderer[button-renderer][is-icon-button] button, #share-button button');

  const attach = (btn, type) => {
    if (btn && !btn._hooked) {
      btn._hooked = true;
      btn.addEventListener("click", () => {
        saveEvent({ type, videoId: getVideoId(), src: currentVideo?.src }, new Date().toISOString());
      });
    }
  };

  attach(likeBtn, "video-like");
  attach(dislikeBtn, "video-dislike");
  attach(shareBtn, "video-share");
}

// ================== VIEWPORT TRACKING ==================
function getVideoViewport(video) {
  try {
    const rect = video.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      aspect_ratio: (rect.width / rect.height).toFixed(2),
      orientation: rect.width > rect.height ? "landscape" : "portrait"
    };
  } catch {
    return null;
  }
}

function trackViewportChanges(video) {
  if (!video || video._viewportHooked) return;
  video._viewportHooked = true;

  let lastViewport = { width: 0, height: 0 };

  const sendViewportEvent = () => {
    const vp = getVideoViewport(video);
    if (!vp) return;
    if (vp.width !== lastViewport.width || vp.height !== lastViewport.height) {
      lastViewport = vp;
      saveEvent({
        type: "video-viewport-change",
        videoId: getVideoId(),
        src: video.src,
        extra: vp
      }, new Date().toISOString());
    }
  };

  video.addEventListener("loadedmetadata", sendViewportEvent);
  window.addEventListener("resize", sendViewportEvent);
  document.addEventListener("fullscreenchange", sendViewportEvent);
  setInterval(sendViewportEvent, 2000); // periodic check
}

// ================== VIDEO RESOLUTION TRACKING ==================
function trackVideoResolution(video) {
  if (!video || video._resolutionHooked) return;
  video._resolutionHooked = true;

  let lastWidth = 0, lastHeight = 0;

  const checkResolution = () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    if (w !== lastWidth || h !== lastHeight) {
      lastWidth = w;
      lastHeight = h;
      saveEvent({
        type: "video-resolution-change",
        videoId: getVideoId(),
        src: video.src,
        extra: { width: w, height: h, viewport: getVideoViewport(video) }
      }, new Date().toISOString());
    }
  };

  video.addEventListener("loadedmetadata", checkResolution);
  setInterval(checkResolution, 2000); // periodic check
}

// ================== ATTACH ALL HOOKS ==================
function attachAllHooks(video) {
  attachVideoEvents(video);
  attachSeekEvents(video);
  attachActionEvents();
  trackViewportChanges(video);
  trackVideoResolution(video);
}

// ================== OBSERVE VIDEO CHANGES (UPDATED) ==================
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (!video) return;

  // Attach all hooks once per video
  attachAllHooks(video);

  if (video.src && video.src !== lastSrc) {
    const ts = new Date().toISOString();

    // Save previous video stats
    if (currentVideo && startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
      const duration = prevDuration || currentVideo.duration || 0;
      const percent = duration ? Math.min((watchedTime / duration) * 100, 100).toFixed(1) : "0";

      saveEvent({
        type: "video-stopped",
        videoId: getVideoId(),
        src: currentVideo.src,
        watchedTime: watchedTime.toFixed(2),
        duration: duration.toFixed(2),
        percent
      }, ts);

      if (duration > 0) setTimeout(() => updateStats(watchedTime, parseFloat(percent), duration), 100);
    }

    // Save swipe event
    if (lastSrc) {
      saveEvent({
        type: "swiped-to-new-video",
        videoId: getVideoId(),
        src: video.src,
        extra: { previous: lastSrc }
      }, ts);
    }

    currentVideo = video;
    lastSrc = video.src;
    startTime = Date.now();
    watchedTime = 0;
    prevDuration = video.duration || 0;
    hasPlayed = false;
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// ================== URL CHANGE RE-HOOK ==================
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const video = document.querySelector("video");
    if (video) attachAllHooks(video);
  }
}, 1000);
