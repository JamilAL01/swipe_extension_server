console.log("[SwipeExtension] Content script injected ✅");

// ================== TRANSLATIONS ==================
const translations = {
  en: {
    consentTitle: "🔒 Data Collection Notice",
    consentText: `This extension <b>SWiPE X</b> records your interactions with YouTube Shorts
      (<b>play, pause, skips, watch time, likes, shares</b>, etc.) for research purposes.
      Your identity remains completely anonymous. A randomly generated ID is stored locally only to recognize repeated usage across sessions.`,
    consentQuestion: "Do you agree?",
    yes: "✅ Yes",
    no: "❌ No",
    surveyTitle: "📝 Quick Survey",
    surveyText: "Please answer a few short questions:",
    submit: "Submit ✅",
    alertIncomplete: "⚠️ Please answer all required questions before submitting.",
    q1: "1. How often do you watch YouTube Shorts?",
    q1Options: ["-- Select --","Daily","Several times per week","Rarely","Never","Prefer not to say"],
    q2: "2. What device do you usually use?",
    q2Options: ["-- Select --","Desktop computer","Laptop","Smartphone","Tablet","Prefer not to say"],
    q3: "3. What type of content do you prefer?",
    q3Options: ["-- Select --","Comedy & Entertainment","Fashion & Lifestyle","Movies & Animation","Science & Technology","Gaming","Prefer not to say"],
    q4: "4. Your age group?",
    q4Options: ["-- Select --","Under 18","18-25","26-35","36 and above","Prefer not to say"],
    q5: "5. Do you often interact with Shorts?",
    q5Options: ["-- Select --","Like or dislike","Comment on videos","Share with others","All of the above","I usually just watch without engaging","Prefer not to say"],
    q6: "6. Any other comments?"
  },
  fr: {
    consentTitle: "🔒 Avis de collecte de données",
    consentText: `Cette extension <b>SWiPE X</b> enregistre vos interactions avec YouTube Shorts
      (<b>lecture, pause, saut, temps de visionnage, likes, partages</b>, etc.) à des fins de recherche.
      Votre identité reste complètement anonyme. Un ID aléatoire est stocké localement uniquement pour reconnaître les utilisations répétées.`,
    consentQuestion: "Êtes-vous d'accord ?",
    yes: "✅ Oui",
    no: "❌ Non",
    surveyTitle: "📝 Questionnaire rapide",
    surveyText: "Veuillez répondre à quelques questions courtes :",
    submit: "Envoyer ✅",
    alertIncomplete: "⚠️ Veuillez répondre à toutes les questions obligatoires avant de soumettre.",
    q1: "1. À quelle fréquence regardez-vous les YouTube Shorts ?",
    q1Options: ["-- Sélectionner --","Quotidien","Plusieurs fois par semaine","Rarement","Jamais","Je préfère ne pas répondre"],
    q2: "2. Quel appareil utilisez-vous habituellement ?",
    q2Options: ["-- Sélectionner --","Ordinateur de bureau","Ordinateur portable","Smartphone","Tablette","Je préfère ne pas répondre"],
    q3: "3. Quel type de contenu préférez-vous ?",
    q3Options: ["-- Sélectionner --","Comédie & Divertissement","Mode & Style de vie","Films & Animation","Science & Technologie","Jeux vidéo","Je préfère ne pas répondre"],
    q4: "4. Votre tranche d'âge ?",
    q4Options: ["-- Sélectionner --","Moins de 18 ans","18-25","26-35","36 ans et plus","Je préfère ne pas répondre"],
    q5: "5. Interagissez-vous souvent avec les Shorts ?",
    q5Options: ["-- Sélectionner --","Aimer ou ne pas aimer","Commenter les vidéos","Partager avec d'autres","Toutes les réponses ci-dessus","Je regarde généralement sans interagir","Je préfère ne pas répondre"],
    q6: "6. Autres commentaires ?"
  }
};

// ================== LANGUAGE ==================
let selectedLang = localStorage.getItem("swipeLang") || (navigator.language.startsWith("fr") ? "fr" : "en");
let consent = localStorage.getItem("swipeConsent");

// ================== GLOBAL USER & SESSION ID ==================
let userId = localStorage.getItem("swipeUserId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("swipeUserId", userId);
}
let sessionId = crypto.randomUUID();

// For backward compatibility (some parts may use window._swipeUserId)
window._swipeUserId = userId;
window._swipeSessionId = sessionId;


// ================== CONSENT POPUP ==================
function showConsentPopup() {
  const t = translations[selectedLang];

  // Remove existing popup if any
  const old = document.getElementById("swipe-consent-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    padding: 25px;
    background: white;
    border: 2px solid #444;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    font-size: 16px;
    font-family: Arial, sans-serif;
    text-align: center;
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

  // Language change handler
  document.getElementById("lang-select").onchange = (e) => {
    selectedLang = e.target.value;
    localStorage.setItem("swipeLang", selectedLang);
    showConsentPopup(); // re-render popup in new language
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
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    padding: 25px;
    background: white;
    border: 2px solid #444;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    font-size: 16px;
    font-family: Arial, sans-serif;
    text-align: left;
    max-height: 80vh;
    overflow-y: auto;
  `;

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px;">${t.surveyTitle}</h2>
    <p>${t.surveyText}</p>
    ${["q1","q2","q3","q4","q5"].map(q=>{
      return `<label>${t[q]}</label><br>
              <select id="${q}" style="width:100%; padding:5px; margin:5px 0;">
                ${t[q+"Options"].map(opt=>`<option value="${opt}">${opt}</option>`).join('')}
              </select><br><br>`;
    }).join('')}
    <label>${t.q6}</label><br>
    <textarea id="q6" rows="3" style="width:100%;"></textarea><br><br>
    <button id="survey-submit" style="padding:10px 20px; cursor:pointer;">${t.submit}</button>
  `;

  document.body.appendChild(popup);

  const submitBtn = document.getElementById("survey-submit");

  //  Define the handler first
  const handleSurveySubmit = () => {
    submitBtn.disabled = true;

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
      console.warn("[SwipeExtension] ❌ Survey submission delayed — user/session not initialized yet");
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
        userId: window._swipeUserId,
        sessionId: window._swipeSessionId,
        answers,
        screen_size: screenInfo,
        device_type: deviceType,
        timestamp: new Date().toISOString()
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
      .finally(() => {
        submitBtn.removeEventListener("click", handleSurveySubmit);
      });
  };

  //  Clear any previous handlers and attach only once
  submitBtn.onclick = null;
  submitBtn.addEventListener("click", handleSurveySubmit);
}

// ================== CONSENT CHECK ==================
if (!consent) {
  showConsentPopup();
} else if (consent === "yes") {
  showSurveyPopup();
}


// ================== USER & SESSION SETUP ==================

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

// Define this globally near the top of your content.js
let lastKnownBitrate = null;


// ================== VIDEO EVENT HOOK ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;

  console.log(`[SwipeExtension]  Hooking into video: ${video.src} (ID: ${getVideoId()})`);

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
    console.log(`[SwipeExtension] video-jump ${video.src} (ID: ${videoId}) - Jumped to ${video.currentTime.toFixed(2)}s`);
  });
}

// ================== LIKE / DISLIKE / SHARE ==================
function attachActionEvents() {
  const likeBtn = document.querySelector('like-button-view-model button');
  const dislikeBtn = document.querySelector('dislike-button-view-model button');
  const shareBtn = document.querySelector('button-view-model');

  const videoId = getVideoId();

  if (likeBtn && !likeBtn._hooked) {
    likeBtn._hooked = true;
    likeBtn.addEventListener("click", () => {
      saveEvent({
        type: "video-like",
        videoId,
        src: currentVideo?.src,
        timestamp: new Date().toISOString(),
      });
    });
  }

  if (dislikeBtn && !dislikeBtn._hooked) {
    dislikeBtn._hooked = true;
    dislikeBtn.addEventListener("click", () => {
      saveEvent({
        type: "video-dislike",
        videoId,
        src: currentVideo?.src,
        timestamp: new Date().toISOString(),
      });
    });
  }

  if (shareBtn && !shareBtn._hooked) {
    shareBtn._hooked = true;
    shareBtn.addEventListener("click", () => {
      saveEvent({
        type: "video-share",
        videoId,
        src: currentVideo?.src,
        timestamp: new Date().toISOString(),
      });
    });
  }
}

// =================  STATS ========================
function updateStats(watchedTime, percentWatched, duration, currentBitrate = null) {
  chrome.storage.local.get(['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'], (data) => {
    const videos = (data.videosWatched || 0) + 1;
    const totalTime = (data.totalWatchedTime || 0) + watchedTime;
    const history = data.videoHistory || [];

    const avgPercent = ((data.avgPercentWatched || 0) * (videos - 1) + percentWatched) / videos;

    // ✅ add bitrate info if available
    history.push({
      duration,
      percentWatched,
      watchedTime,
      currentBitrate,
      timestamp: new Date().toISOString()
    });

    chrome.storage.local.set({
      videosWatched: videos,
      totalWatchedTime: totalTime,
      avgPercentWatched: avgPercent,
      videoHistory: history
    });
  });
}


// ================== VIEWPORT =======================
function getVideoViewport(video) {
  try {
    const rect = video.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      aspect_ratio: (rect.width / rect.height).toFixed(2),
      orientation: rect.width > rect.height ? "landscape" : "portrait",
    };
  } catch {
    return null;
  }
}

// ================== VIDEO VIEWPORT TRACKING ======================
function trackViewportChanges(video) {
  if (!video) return;

  let lastViewport = { w: 0, h: 0 };
  let currentVideoId = null;

  const sendViewportEvent = (w, h) => {
    saveEvent({
      type: "video-viewport-change",
      videoId: getVideoId(),
      src: video.src,
      timestamp: new Date().toISOString(),
      extra: {
        width: w,
        height: h,
        aspect_ratio: (w / h).toFixed(2),
        orientation: w > h ? "landscape" : "portrait",
      },
    });
    console.log(`[SwipeExtension] Viewport changed: ${w}x${h}`);
  };

  const checkViewport = () => {
    const vp = getVideoViewport(video);
    if (vp && (vp.width !== lastViewport.w || vp.height !== lastViewport.h)) {
      lastViewport = { w: vp.width, h: vp.height };
      sendViewportEvent(vp.width, vp.height);
    }
  };

  // Initial setup when video loads
  video.addEventListener("loadedmetadata", () => {
    currentVideoId = getVideoId();
    checkViewport();
  });

  // Detect window resizes or fullscreen changes
  window.addEventListener("resize", checkViewport);
  document.addEventListener("fullscreenchange", checkViewport);

  // Optional: check every few seconds for subtle UI changes
  setInterval(checkViewport, 2000);
}

// // ================= CODEC ==========================
// function getCodec() {
//   try {
//     // Find the element that contains exactly "Codecs"
//     const elems = [...document.querySelectorAll("*")];
//     const labelElem = elems.find(el => el.textContent.trim() === "Codecs");

//     if (!labelElem) return "unknown";

//     // The codec info is usually the next sibling text node
//     let codecText = labelElem.nextSibling?.textContent?.trim();
//     if (!codecText) {
//       // Sometimes the nextSibling might be another element
//       codecText = labelElem.nextElementSibling?.textContent?.trim();
//     }

//     return codecText || "unknown";
//   } catch (err) {
//     console.warn("[SwipeExtension] Codec extraction failed:", err);
//     return "unknown";
//   }
// }

// ================== MAX VIDEO RESOLUTION ======================
function getMaxResolutionAndBitrate() {
  try {
    const script = [...document.scripts].find(s =>
      s.textContent.includes('ytInitialPlayerResponse')
    );
    if (!script) return null;

    const match = script.textContent.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const adaptiveFormats = data?.streamingData?.adaptiveFormats;
    if (!adaptiveFormats || !adaptiveFormats.length) return null;

    // Only keep valid video formats
    const videoFormats = adaptiveFormats.filter(f => f.width && f.height && f.mimeType.includes('video'));
    if (!videoFormats.length) return null;

    // Pick the one with the largest pixel count
    const maxFmt = videoFormats.reduce((acc, fmt) => {
      const accPixels = acc.width * acc.height;
      const pixels = fmt.width * fmt.height;
      return pixels > accPixels ? fmt : acc;
    });

    const maxRes = `${maxFmt.width}x${maxFmt.height}`;
    const bitrate = maxFmt.averageBitrate || maxFmt.bitrate || null; // in bps
    

    return { maxRes, bitrate };
  } catch (err) {
    console.warn('[SwipeExtension] Failed to parse ytInitialPlayerResponse:', err);
    return null;
  }
}

// ================== VIDEO RESOLUTION & BITRATE TRACKING ======================
function trackVideoResolution(video) {
  if (!video) return;

  let lastWidth = 0;
  let lastHeight = 0;
  let allowChanges = false;
  let currentVideoId = null;
  let resolutionInterval = null;
  let timeoutId = null;

  const cleanup = () => {
    clearInterval(resolutionInterval);
    clearTimeout(timeoutId);
    resolutionInterval = null;
    allowChanges = false;
  };

  const startResolutionTracking = () => {
    timeoutId = setTimeout(() => {
      currentVideoId = getVideoId();
      if (!currentVideoId) return;

      const currentWidth = video.videoWidth;
      const currentHeight = video.videoHeight;

      // Parse ytInitialPlayerResponse
      const script = [...document.scripts].find(s =>
        s.textContent.includes("ytInitialPlayerResponse")
      );
      if (!script) return;

      const match = script.textContent.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
      if (!match) return;

      const data = JSON.parse(match[1]);
      const adaptiveFormats = data?.streamingData?.adaptiveFormats || [];

      // Video-only formats
      const videoFormats = adaptiveFormats.filter(f => f.mimeType.includes("video"));
      if (!videoFormats.length) return;

      // Find max resolution + bitrate + codec
      const maxFmt = videoFormats.reduce(
        (acc, fmt) => (fmt.bitrate || 0) > (acc.bitrate || 0) ? fmt : acc,
        {}
      );
      const maxRes = maxFmt.width && maxFmt.height
        ? `${maxFmt.width}x${maxFmt.height}`
        : `${currentWidth}x${currentHeight}`;
      // const maxBitrate = maxFmt.averageBitrate || maxFmt.bitrate || null;

      // // Find current bitrate
      // const currentFmt = videoFormats.find(
      //   f => f.width === currentWidth && f.height === currentHeight
      // );
      // const currentBitrate = currentFmt
      //   ? (currentFmt.averageBitrate || currentFmt.bitrate)
      //   : null;

      // lastKnownBitrate = currentBitrate || lastKnownBitrate;


      // Log initial
      saveEvent({
        type: "video-resolution",
        videoId: currentVideoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: {
          current: `${currentWidth}x${currentHeight}`,
          max: maxRes,
          //codec: getCodec(),
          //currentBitrate,
          //maxBitrate,
          viewport: getVideoViewport(video),
        },
      });

      allowChanges = true;
      lastWidth = currentWidth;
      lastHeight = currentHeight;

      // Periodic resolution/bitrate tracking
      resolutionInterval = setInterval(() => {
        if (!allowChanges || !currentVideoId || video.readyState < 2) return;

        const w = video.videoWidth;
        const h = video.videoHeight;

        if ((w !== lastWidth || h !== lastHeight) && w && h) {
          lastWidth = w;
          lastHeight = h;

          const fmt = videoFormats.find(f => f.width === w && f.height === h);
          const currentBitrateChange = fmt
            ? (fmt.averageBitrate || fmt.bitrate)
            : null;

          saveEvent({
            type: "video-resolution-change",
            videoId: currentVideoId,
            src: video.src,
            timestamp: new Date().toISOString(),
            extra: {
              width: w,
              height: h,
              //currentBitrate: currentBitrateChange,
              //maxBitrate,
              viewport: getVideoViewport(video),
            },
          });
        }
      }, 2000);
    }, 100);
  };

  video.addEventListener("loadedmetadata", () => {
    cleanup();
    startResolutionTracking();
  });

  video.addEventListener("ended", cleanup);
}


// // ============ VIDEO BITRATE ===================
// function computeDataUsageMB(durationSec, percentWatched, currentBitrateBps) {
//   if (!durationSec || !currentBitrateBps) return { watchedMB: 0, wastedMB: 0 };

//   const watchedSec = durationSec * (percentWatched / 100);
//   const wastedSec = durationSec - watchedSec;

//   // bits → bytes → MB
//   const watchedMB = (watchedSec * currentBitrateBps) / 8 / 1e6;
//   const wastedMB  = (wastedSec  * currentBitrateBps) / 8 / 1e6;

//   return {
//     watchedMB: watchedMB.toFixed(2),
//     wastedMB: wastedMB.toFixed(2)
//   };
// }


// ============= START-UP DELAY & STALLS ================
function attachStallAndStartupTracking(video) {
  if (video._stallStartupHooked) return;
  video._stallStartupHooked = true;

  const videoId = getVideoId();

  let firstPlayTime = null;
  let stallStart = null;

  // -------- STARTUP DELAY ----------
  const startupStart = performance.now();

  const onPlayingFirst = () => {
    if (!firstPlayTime) {
      firstPlayTime = performance.now();
      let startupDelay = (firstPlayTime - startupStart) / 1000;

      // Subtract any "survey popup" time if needed
      const popupDismissedAt = window._swipeConsentDismissedAt || null;
      if (popupDismissedAt && popupDismissedAt > startupStart) {
        startupDelay = Math.max(0, (firstPlayTime - popupDismissedAt) / 1000);
      }

      if (startupDelay > 0.2) {  // ignore tiny startup delays
        saveEvent({
          type: "video-startup-delay",
          videoId,
          timestamp: new Date().toISOString(),
          extra: { startupDelay: startupDelay.toFixed(2) }
        });
        console.log(`[SwipeExtension] Startup delay sent: ${startupDelay.toFixed(2)}s`);
      }

      video.removeEventListener("playing", onPlayingFirst);
    }
  };

  video.addEventListener("playing", onPlayingFirst);

  // -------- STALL DETECTION ----------
  const onStalled = () => {
    // Ignore stalls before first playback
    if (!firstPlayTime) return;
    if (stallStart === null) {
      stallStart = performance.now();
      console.log("[SwipeExtension] Stall started…");
    }
  };

  const onResume = () => {
    if (stallStart !== null) {
      const stallDuration = (performance.now() - stallStart) / 1000;
      stallStart = null;

      if (stallDuration > 0.2) {  // filter out micro-stalls
        saveEvent({
          type: "video-stall",
          videoId,
          timestamp: new Date().toISOString(),
          extra: { stallDuration: stallDuration.toFixed(2) }
        });
        console.log(`[SwipeExtension] Stall ended: ${stallDuration.toFixed(2)}s`);
      }
    }
  };

  video.addEventListener("waiting", onStalled);
  video.addEventListener("stalled", onStalled);
  video.addEventListener("playing", onResume);
  video.addEventListener("timeupdate", onResume);
}


// // =============== BUFFER HEALTH ======================
// function getBufferHealth() {
//   try {
//     // Find any element containing "Buffer Health"
//     const elems = [...document.querySelectorAll("*")];
//     const target = elems.find(el =>
//       el.textContent.includes("Buffer Health")
//     );

//     if (!target) return null;

//     // Extract numeric value
//     const match = target.textContent.match(/Buffer\s*Health\s*([0-9.]+)\s*s/i);
//     if (match) {
//       return parseFloat(match[1]);
//     }
//   } catch (err) {
//     console.warn("[SwipeExtension] Buffer health extraction failed:", err);
//   }
//   return null;
// }



// ================== OBSERVE VIDEO CHANGES ==================
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (!video) return;

  // === Hook resolution & viewport tracking once per video ===
  if (!video._resolutionHooked) {
    video._resolutionHooked = true;

    // Hook stall + startup delay early
    attachStallAndStartupTracking(video);
    
    const videoId = getVideoId();
    trackVideoResolution(video, videoId);
    trackViewportChanges(video);
  }

  // === Handle new video (when src changes) ===
  if (video.src && video.src !== lastSrc) {
    const videoId = getVideoId();

    // --- If we were watching a previous video ---
    if (currentVideo && startTime) {
      watchedTime += (Date.now() - startTime) / 1000;

      const duration = prevDuration || currentVideo.duration || 0;
      const percent = duration
        ? Math.min((watchedTime / duration) * 100, 100).toFixed(1)
        : "0";

      // const currentBitrate = lastKnownBitrate || 0;
      // const { watchedMB, wastedMB } = computeDataUsageMB(
      //   duration,
      //   parseFloat(percent),
      //   currentBitrate
      // );

      // const bufferHealth = getBufferHealth();

      // saveEvent({
      //   type: "video-buffer-health",
      //   videoId: getVideoId(),
      //   src: currentVideo.src,
      //   timestamp: new Date().toISOString(),
      //   extra: {
      //     bufferHealthSec: bufferHealth
      //   }
      // });



      // ✅ Save video-stopped event with bitrate + data usage
      saveEvent({
        type: "video-stopped",
        videoId: getVideoId(),
        src: currentVideo.src,
        timestamp: new Date().toISOString(),
        watchedTime: watchedTime.toFixed(2),
        duration: duration.toFixed(2),
        percent,
      });

      // Update summary stats (with small delay to ensure event order)
      if (duration > 0) {
        setTimeout(() => {
          updateStats(watchedTime, parseFloat(percent), duration);
        }, 100);
      }
    }

    // --- Save transition ---
    if (lastSrc) {
      saveEvent({
        type: "swiped-to-new-video",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: { previous: lastSrc },
      });
    }

    // === Prepare for next video ===
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

// ================== RE-HOOK ON URL CHANGE ==================
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
    attachActionEvents();
  }
}, 1000);
