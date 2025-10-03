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
    q1Options: ["-- Select --","Daily","Several times per week","Rarely","Never"],
    q2: "2. What device do you usually use?",
    q2Options: ["-- Select --","Desktop computer","Laptop","Smartphone","Tablet"],
    q3: "3. What type of content do you prefer?",
    q3Options: ["-- Select --","Comedy & Entertainment","Fashion & Lifestyle","Movies & Animation","Science & Technology","Gaming"],
    q4: "4. Your age group?",
    q4Options: ["-- Select --","Under 18","18-25","26-35","36 and above"],
    q5: "5. Do you often interact with Shorts?",
    q5Options: ["-- Select --","Like or dislike","Comment on videos","Share with others","All of the above","I usually just watch without engaging"],
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
    q1Options: ["-- Sélectionner --","Quotidien","Plusieurs fois par semaine","Rarement","Jamais"],
    q2: "2. Quel appareil utilisez-vous habituellement ?",
    q2Options: ["-- Sélectionner --","Ordinateur de bureau","Ordinateur portable","Smartphone","Tablette"],
    q3: "3. Quel type de contenu préférez-vous ?",
    q3Options: ["-- Sélectionner --","Comédie & Divertissement","Mode & Style de vie","Films & Animation","Science & Technologie","Jeux vidéo"],
    q4: "4. Votre tranche d'âge ?",
    q4Options: ["-- Sélectionner --","Moins de 18 ans","18-25","26-35","36 ans et plus"],
    q5: "5. Interagissez-vous souvent avec les Shorts ?",
    q5Options: ["-- Sélectionner --","Aimer ou ne pas aimer","Commenter les vidéos","Partager avec d'autres","Toutes les réponses ci-dessus","Je regarde généralement sans interagir"],
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
    console.log("[SwipeExtension] User consented ✅");
    showSurveyPopup();   // show survey
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

  document.getElementById("survey-submit").onclick = () => {
    const answers = ["q1","q2","q3","q4","q5","q6"].reduce((acc,key)=>{
      acc[key] = document.getElementById(key).value;
      return acc;
    }, {});

    if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q5) {
      alert(t.alertIncomplete);
      return;
    }

    // ✅ Ensure IDs are ready before sending
    if (!window._swipeUserId || !window._swipeSessionId) {
      console.warn("[SwipeExtension] ❌ Survey submission delayed — user/session not initialized yet");
      setTimeout(() => document.getElementById("survey-submit").click(), 500);
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
    }).then(res => {
      if (!res.ok) throw new Error("Survey save failed");
      console.log("[SwipeExtension] Survey saved ✅", answers);
      localStorage.setItem("surveyDone","true");
      popup.remove();
    }).catch(err=>console.error("[SwipeExtension] Survey error ❌",err));
  };
}

// ================== CONSENT CHECK ==================
if (!consent) showConsentPopup();
else if (consent==="yes") {
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
  if (video && !video._resolutionHooked) {
    video._resolutionHooked = true;

    const videoId = getVideoId(); // capture ID immediately
    trackVideoResolution(video, videoId); // pass it in
  }

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
        percent: prevDuration
          ? Math.min((watchedTime / prevDuration) * 100, 100).toFixed(1)
          : 0,
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
    // Delay slightly to let YouTube update videoId properly
    timeoutId = setTimeout(() => {
      currentVideoId = getVideoId(); // ✅ now gets the correct current video ID
      if (!currentVideoId) return;

      const currentWidth = video.videoWidth;
      const currentHeight = video.videoHeight;
      let maxWidth = currentWidth;
      let maxHeight = currentHeight;

      // Another short delay to stabilize adaptive quality
      setTimeout(() => {
        const maybeW = video.videoWidth;
        const maybeH = video.videoHeight;
        if (maybeW > maxWidth || maybeH > maxHeight) {
          maxWidth = maybeW;
          maxHeight = maybeH;
        }

        console.log(`[SwipeExtension] [${currentVideoId}] Initial resolution: ${currentWidth}x${currentHeight}, max: ${maxWidth}x${maxHeight}`);
        saveEvent({
          type: "video-resolution",
          videoId: currentVideoId,
          src: video.src,
          timestamp: new Date().toISOString(),
          extra: {
            current: `${currentWidth}x${currentHeight}`,
            max: `${maxWidth}x${maxHeight}`,
          },
        });

        allowChanges = true;
        lastWidth = video.videoWidth;
        lastHeight = video.videoHeight;
      }, 300); // <— small extra delay to avoid previous ID bleed

      // Start fresh interval for resolution changes
      if (resolutionInterval) clearInterval(resolutionInterval);
      resolutionInterval = setInterval(() => {
        if (!allowChanges || !currentVideoId) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if ((w !== lastWidth || h !== lastHeight) && w && h) {
          lastWidth = w;
          lastHeight = h;

          console.log(`[SwipeExtension] [${currentVideoId}] Resolution changed: ${w}x${h}`);
          saveEvent({
            type: "video-resolution-change",
            videoId: currentVideoId,
            src: video.src,
            timestamp: new Date().toISOString(),
            extra: { width: w, height: h },
          });
        }
      }, 2000);
    }, 100); // ✅ short delay to ensure getVideoId() reflects the new video
  };

  // Triggered every time a new video loads in the same element
  video.addEventListener("loadedmetadata", () => {
    cleanup();
    startResolutionTracking();
  });

  video.addEventListener("ended", cleanup);
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
