// content.js - cleaned & fixed
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

// ================== LANGUAGE & CONSENT ==================
let selectedLang = localStorage.getItem("swipeLang") || (navigator.language && navigator.language.startsWith("fr") ? "fr" : "en");
let consent = localStorage.getItem("swipeConsent");

// ================== USER & SESSION IDs ==================
let userId = localStorage.getItem("swipeUserId");
if (!userId) {
  try {
    userId = crypto.randomUUID();
  } catch (e) {
    // fallback
    userId = 'uid-' + Date.now() + '-' + Math.random().toString(36).slice(2,10);
  }
  localStorage.setItem("swipeUserId", userId);
}
const sessionId = (function(){
  try { return crypto.randomUUID(); } catch { return 'sid-' + Date.now() + '-' + Math.random().toString(36).slice(2,10); }
})();

// backward compatibility globals
window._swipeUserId = userId;
window._swipeSessionId = sessionId;

// ================== UTIL: video id ==================
function getVideoId(url = window.location.href) {
  const match = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ================== SERVER SAVE ==================
async function saveEvent(eventData) {
  // ensure consent
  if (localStorage.getItem("swipeConsent") !== "yes") {
    console.log("[SwipeExtension] Tracking disabled by GDPR ❌");
    return;
  }

  // enrich
  eventData.sessionId = sessionId;
  eventData.userId = userId;
  eventData.pageUrl = window.location.href;

  console.log("[SwipeExtension] Event queued:", eventData);

  try {
    const res = await fetch("https://swipe-extension-server-2.onrender.com/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) {
      console.error("[SwipeExtension] Server error ❌", res.status, await res.text().catch(()=>'')); 
    } else {
      console.log("[SwipeExtension] Sent to server ✅");
    }
  } catch (err) {
    console.error("[SwipeExtension] Fetch error ❌", err);
  }
}

// ================== STATS UPDATE ==================
function updateStats(watchedTime, percentWatched, duration, currentBitrate = null) {
  try {
    chrome.storage.local.get(['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'], (data) => {
      const videos = (data.videosWatched || 0) + 1;
      const totalTime = (data.totalWatchedTime || 0) + (watchedTime || 0);
      const prevAvg = (data.avgPercentWatched || 0);
      const avgPercent = ((prevAvg * (videos - 1)) + (percentWatched || 0)) / videos;
      const history = data.videoHistory || [];

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
      }, () => {
        // silent callback
      });
    });
  } catch (err) {
    console.warn("[SwipeExtension] updateStats failed:", err);
  }
}

// ================== VIEWPORT ==================
function getVideoViewport(video) {
  try {
    const rect = video.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      aspect_ratio: (rect.width / rect.height).toFixed(2),
      orientation: rect.width > rect.height ? "landscape" : "portrait",
    };
  } catch (err) {
    return null;
  }
}

// ================== VIDEO TRACKING CORE ==================
// We'll keep a small registry of hooked videos so we can unhook cleanly if needed.
const hookedVideos = new WeakMap();

function attachVideoEvents(video) {
  if (!video) return;
  if (hookedVideos.get(video)?.attached) return;

  // per-video state
  const state = {
    lastPlayTs: null,   // timestamp (ms) when play started
    accumulatedSec: 0,  // seconds watched in current session (resets on video change)
    prevDuration: video.duration || 0,
    hasPlayedOnce: false,
    resolutionIntervalId: null,
    viewportIntervalId: null
  };
  hookedVideos.set(video, { attached: true, state });

  console.log(`[SwipeExtension] Hooking video: ${video.currentSrc || video.src} (id:${getVideoId()})`);

  // helper to compute and accumulate watched time up to now (ms)
  function accumulateWatched() {
    if (state.lastPlayTs) {
      const deltaMs = Date.now() - state.lastPlayTs;
      state.accumulatedSec += deltaMs / 1000;
      state.lastPlayTs = null;
    }
  }

  // PLAY
  const onPlay = () => {
    state.lastPlayTs = Date.now();
    const videoId = getVideoId();
    if (!state.hasPlayedOnce) {
      state.hasPlayedOnce = true;
      saveEvent({ type: "video-start", videoId, src: video.currentSrc || video.src, timestamp: new Date().toISOString() });
    } else {
      saveEvent({ type: "video-resume", videoId, src: video.currentSrc || video.src, timestamp: new Date().toISOString() });
    }
  };

  // PAUSE
  const onPause = () => {
    accumulateWatched();
    const videoId = getVideoId();
    const duration = state.prevDuration || video.duration || 0;
    const percent = duration ? Math.min((state.accumulatedSec / duration) * 100, 100) : 0;

    saveEvent({
      type: "video-paused",
      videoId,
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      watchedTime: state.accumulatedSec.toFixed(2),
      duration: duration.toFixed(2),
      percent: percent.toFixed(1)
    });
  };

  // TIMEUPDATE - used to detect full watch
  const onTimeUpdate = () => {
    // do not accumulate here — accumulation is handled on pause/ended/navigation to avoid double counting
    // but we want to detect if user reached duration (played to end)
    const duration = state.prevDuration || video.duration || 0;
    const currentTime = video.currentTime || 0;
    if (duration > 0 && (duration - currentTime) <= 0.5) {
      // treat as full watch
      accumulateWatched(); // add the final chunk
      saveEvent({
        type: "video-watched-100",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        watchedTime: duration.toFixed(2),
        duration: duration.toFixed(2),
        percent: 100
      });
      // create a rewatch event
      saveEvent({
        type: "video-rewatch",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString()
      });
      // reset accumulation for potential rewatch
      state.accumulatedSec = 0;
      state.lastPlayTs = null;
    }
  };

  // SEEKED
  const onSeeked = () => {
    // Only send if the seek is meaningful
    if (Math.abs(video.currentTime) < 0.01) return;
    accumulateWatched();
    saveEvent({
      type: "video-jump",
      videoId: getVideoId(),
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      extra: { jumpTo: video.currentTime.toFixed(2) }
    });
    console.log(`[SwipeExtension] video-jump => ${video.currentTime.toFixed(2)}s`);
  };

  // ENDED
  const onEnded = () => {
    accumulateWatched();
    const duration = state.prevDuration || video.duration || 0;
    const percent = duration ? Math.min((state.accumulatedSec / duration) * 100, 100) : 0;

    if (duration > 0 && Math.abs(state.accumulatedSec - duration) < 2) {
      saveEvent({
        type: "video-watched-100",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        watchedTime: duration.toFixed(2),
        duration: duration.toFixed(2),
        percent: 100
      });
      saveEvent({
        type: "video-rewatch",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString()
      });
    }

    // update stats
    if (duration > 0) {
      updateStats(state.accumulatedSec, parseFloat(percent.toFixed(1)), duration);
    }

    state.accumulatedSec = 0;
    state.lastPlayTs = null;
  };

  // STALL + STARTUP HANDLING
  const stallState = { firstPlayTs: null, stallStart: null };
  const startupStart = performance.now();
  const onPlayingFirst = () => {
    if (!stallState.firstPlayTs) {
      stallState.firstPlayTs = performance.now();
      let startupDelay = (stallState.firstPlayTs - startupStart) / 1000;
      const popupDismissedAt = window._swipeConsentDismissedAt || null;
      if (popupDismissedAt && popupDismissedAt > startupStart) {
        startupDelay = Math.max(0, (stallState.firstPlayTs - popupDismissedAt) / 1000);
      }
      if (startupDelay > 0.2) {
        saveEvent({ type: "video-startup-delay", videoId: getVideoId(), timestamp: new Date().toISOString(), extra: { startupDelay: startupDelay.toFixed(2) }});
        console.log(`[SwipeExtension] Startup delay: ${startupDelay.toFixed(2)}s`);
      }
    }
  };
  const onStalled = () => {
    if (!stallState.firstPlayTs) return;
    if (!stallState.stallStart) stallState.stallStart = performance.now();
  };
  const onResume = () => {
    if (stallState.stallStart) {
      const stallDuration = (performance.now() - stallState.stallStart) / 1000;
      stallState.stallStart = null;
      if (stallDuration > 0.2) {
        saveEvent({ type: "video-stall", videoId: getVideoId(), timestamp: new Date().toISOString(), extra: { stallDuration: stallDuration.toFixed(2) }});
        console.log(`[SwipeExtension] Stall ended: ${stallDuration.toFixed(2)}s`);
      }
    }
  };

  // Attach listeners
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("seeked", onSeeked);
  video.addEventListener("ended", onEnded);
  video.addEventListener("playing", onPlayingFirst);
  video.addEventListener("waiting", onStalled);
  video.addEventListener("stalled", onStalled);
  video.addEventListener("playing", onResume);
  video.addEventListener("timeupdate", onResume);

  // RESOLUTION & VIEWPORT: light-weight initial dispatch + periodic checks
  const sendResolutionSnapshot = () => {
    try {
      const viewport = getVideoViewport(video);
      const currentW = video.videoWidth || 0;
      const currentH = video.videoHeight || 0;
      saveEvent({
        type: "video-resolution",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        extra: {
          current: `${currentW}x${currentH}`,
          max: null,
          viewport
        }
      });
    } catch (err) {
      // ignore
    }
  };
  sendResolutionSnapshot();
  state.viewportIntervalId = setInterval(() => {
    // only if video dimensions have changed
    sendResolutionSnapshot();
  }, 3000);

  // keep reference for future cleanup
  const cleanup = () => {
    try {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("playing", onPlayingFirst);
      video.removeEventListener("waiting", onStalled);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("playing", onResume);
      video.removeEventListener("timeupdate", onResume);
      if (state.viewportIntervalId) clearInterval(state.viewportIntervalId);
      if (state.resolutionIntervalId) clearInterval(state.resolutionIntervalId);
      hookedVideos.delete(video);
    } catch (err) {
      // ignore
    }
  };

  // store cleanup for external use (if needed)
  hookedVideos.set(video, { attached: true, state, cleanup });
}

// ================== ACTION BUTTONS (LIKE / DISLIKE / SHARE) ==================
let actionHooks = new WeakSet();
function attachActionEvents() {
  // try multiple selectors - YouTube markup evolves frequently; we attempt a few fallbacks
  const selectors = [
    'ytd-toggle-button-renderer:nth-of-type(1) button', // like common
    '#top-level-buttons-computed ytd-toggle-button-renderer:nth-of-type(1) button', // alternative
    'button[aria-label*="like"], button[aria-label*="Like"]'
  ];
  const dislikeSelectors = [
    'ytd-toggle-button-renderer:nth-of-type(2) button',
    'button[aria-label*="dislike"], button[aria-label*="Dislike"]'
  ];
  const shareSelectors = [
    '#share-button button, ytd-button-renderer#share-icon-button button, button[aria-label*="Share"]'
  ];

  function tryAttach(selList, eventType) {
    for (const sel of selList) {
      const btn = document.querySelector(sel);
      if (btn && !actionHooks.has(btn)) {
        btn.addEventListener("click", () => {
          saveEvent({ type: eventType, videoId: getVideoId(), src: (document.querySelector("video")?.currentSrc || document.querySelector("video")?.src), timestamp: new Date().toISOString() });
        });
        actionHooks.add(btn);
      }
    }
  }

  tryAttach(selectors, "video-like");
  tryAttach(dislikeSelectors, "video-dislike");
  tryAttach(shareSelectors, "video-share");
}

// ================== OBSERVE VIDEO CHANGES (mutation observer) ==================
let lastSrc = null;
let currentVideo = null;
const videoObserver = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (!video) return;

  // attach video events
  attachVideoEvents(video);
  attachActionEvents();

  // handle transitions when src changes (swipe to next short)
  const src = video.currentSrc || video.src || "";
  if (src && src !== lastSrc) {
    const prevSrc = lastSrc;
    lastSrc = src;
    // If there was a previous video, save a stopped event for it (if it was playing)
    if (currentVideo && currentVideo !== video) {
      // Attempt to read per-video state to compute watched time
      const entry = hookedVideos.get(currentVideo);
      if (entry && entry.state) {
        // accumulate any playing segment
        if (entry.state.lastPlayTs) {
          entry.state.accumulatedSec += (Date.now() - entry.state.lastPlayTs) / 1000;
          entry.state.lastPlayTs = null;
        }
        const duration = entry.state.prevDuration || currentVideo.duration || 0;
        const percent = duration ? Math.min((entry.state.accumulatedSec / duration) * 100, 100) : 0;
        saveEvent({
          type: "video-stopped",
          videoId: getVideoId(currentVideo.currentSrc || currentVideo.src),
          src: currentVideo.currentSrc || currentVideo.src,
          timestamp: new Date().toISOString(),
          watchedTime: entry.state.accumulatedSec.toFixed(2),
          duration: duration.toFixed ? duration.toFixed(2) : String(duration),
          percent: percent.toFixed(1)
        });
        if (duration > 0) {
          updateStats(entry.state.accumulatedSec, parseFloat(percent.toFixed(1)), duration);
        }
      }
    }

    // Save swipe transition event
    if (prevSrc) {
      saveEvent({
        type: "swiped-to-new-video",
        videoId: getVideoId(),
        src,
        timestamp: new Date().toISOString(),
        extra: { previous: prevSrc }
      });
    }

    currentVideo = video;
    lastSrc = src;
  }
});
videoObserver.observe(document.body, { childList: true, subtree: true });

// ================ Periodic URL change fallback ================
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // re-run attachers — safe no-op if already attached
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
    attachActionEvents();
  }
}, 1000);

// ================== SURVEY & CONSENT UI ==================
function showConsentPopup() {
  if (document.getElementById("swipe-consent-popup")) return; // already open
  const t = translations[selectedLang];

  // remove old if any
  const old = document.getElementById("swipe-consent-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "swipe-consent-popup";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    max-width: 90%;
    padding: 22px;
    background: white;
    border: 2px solid #444;
    border-radius: 12px;
    box-shadow: 0 6px 30px rgba(0,0,0,0.35);
    z-index: 999999;
    font-size: 15px;
    font-family: Arial, sans-serif;
    text-align: center;
  `;

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:18px;">${t.consentTitle}</h2>
    <p style="margin:4px 0 10px;">Select language / Choisir la langue:</p>
    <select id="lang-select" style="margin-bottom:12px; padding:8px 10px;">
      <option value="en" ${selectedLang==="en"?"selected":""}>English</option>
      <option value="fr" ${selectedLang==="fr"?"selected":""}>Français</option>
    </select>
    <div style="text-align:left; line-height:1.5; margin-top:8px;">${t.consentText}</div>
    <p style="margin-top:8px;"><b>${t.consentQuestion}</b></p>
    <div style="margin-top:10px;">
      <button id="consent-yes" style="margin:6px; padding:8px 16px; cursor:pointer;">${t.yes}</button>
      <button id="consent-no" style="margin:6px; padding:8px 16px; cursor:pointer;">${t.no}</button>
    </div>
  `;

  document.body.appendChild(popup);

  const sel = popup.querySelector("#lang-select");
  sel.addEventListener("change", (e) => {
    selectedLang = e.target.value;
    localStorage.setItem("swipeLang", selectedLang);
    popup.remove();
    // re-show in new language
    setTimeout(showConsentPopup, 50);
  });

  popup.querySelector("#consent-yes").addEventListener("click", () => {
    localStorage.setItem("swipeConsent", "yes");
    consent = "yes";
    popup.remove();
    window._swipeConsentDismissedAt = performance.now();
    console.log("[SwipeExtension] User consented ✅");
    showSurveyPopup();
  });

  popup.querySelector("#consent-no").addEventListener("click", () => {
    localStorage.setItem("swipeConsent", "no");
    consent = "no";
    popup.remove();
    console.log("[SwipeExtension] User declined ❌");
  });
}

function showSurveyPopup() {
  if (localStorage.getItem("surveyDone")) return;
  if (document.getElementById("survey-popup")) return;

  const t = translations[selectedLang];

  const popup = document.createElement("div");
  popup.id = "survey-popup";
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    max-width: 95%;
    padding: 18px;
    background: white;
    border: 2px solid #444;
    border-radius: 12px;
    box-shadow: 0 6px 30px rgba(0,0,0,0.35);
    z-index: 1000000;
    font-size: 15px;
    font-family: Arial, sans-serif;
    text-align: left;
    max-height: 80vh;
    overflow-y: auto;
  `;

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:18px;">${t.surveyTitle}</h2>
    <p style="margin-top:6px;">${t.surveyText}</p>
    <div id="survey-questions"></div>
    <div style="text-align:right; margin-top:8px;">
      <button id="survey-submit" style="padding:8px 14px; cursor:pointer;">${t.submit}</button>
    </div>
  `;

  const questionsDiv = popup.querySelector("#survey-questions");
  ["q1","q2","q3","q4","q5"].forEach(q => {
    const label = document.createElement("label");
    label.textContent = t[q];
    const select = document.createElement("select");
    select.id = q;
    select.style.cssText = "width:100%; padding:6px; margin:6px 0;";
    (t[q + "Options"] || []).forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    questionsDiv.appendChild(label);
    questionsDiv.appendChild(document.createElement("br"));
    questionsDiv.appendChild(select);
    questionsDiv.appendChild(document.createElement("br"));
  });

  const label6 = document.createElement("label");
  label6.textContent = t.q6;
  const ta = document.createElement("textarea");
  ta.id = "q6";
  ta.rows = 3;
  ta.style.cssText = "width:100%; padding:6px; margin:6px 0;";
  questionsDiv.appendChild(label6);
  questionsDiv.appendChild(document.createElement("br"));
  questionsDiv.appendChild(ta);

  document.body.appendChild(popup);

  const submitBtn = popup.querySelector("#survey-submit");

  const handleSurveySubmit = async () => {
    submitBtn.disabled = true;
    const answers = ["q1","q2","q3","q4","q5","q6"].reduce((acc, key) => {
      const el = document.getElementById(key);
      acc[key] = el ? el.value : "";
      return acc;
    }, {});

    // basic validation
    if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q5 ||
        answers.q1.startsWith("--") || answers.q2.startsWith("--") ||
        answers.q3.startsWith("--") || answers.q4.startsWith("--") ||
        answers.q5.startsWith("--")) {
      alert(t.alertIncomplete);
      submitBtn.disabled = false;
      return;
    }

    // ensure IDs present
    if (!window._swipeUserId || !window._swipeSessionId) {
      console.warn("[SwipeExtension] ❌ Survey submission delayed — user/session not initialized yet");
      // fallback: still try to send after small delay
      setTimeout(handleSurveySubmit, 500);
      return;
    }

    const screenInfo = `${window.innerWidth}x${window.innerHeight}`;
    const deviceType = window.innerWidth <= 768 ? "mobile" :
                       window.innerWidth <= 1024 ? "tablet" :
                       window.innerWidth <= 1440 ? "laptop" : "desktop";

    try {
      const res = await fetch("https://swipe-extension-server-2.onrender.com/api/surveys", {
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
      });
      if (!res.ok) throw new Error("Survey save failed");
      console.log("[SwipeExtension] Survey saved ✅", answers);
      localStorage.setItem("surveyDone", "true");
      popup.remove();
    } catch (err) {
      console.error("[SwipeExtension] Survey error ❌", err);
      alert("Failed to save survey — please try again later.");
      submitBtn.disabled = false;
    }
  };

  submitBtn.addEventListener("click", handleSurveySubmit);
}

// ================== INITIAL CONSENT CHECK ==================
if (!consent) {
  showConsentPopup();
} else if (consent === "yes") {
  // show survey only if not done already
  showSurveyPopup();
}

// ================== CLEANUP ON NAVIGATION AWAY (optional) ==================
// When page is unloaded, we try to flush any last per-video accumulation.
window.addEventListener("beforeunload", () => {
  try {
    const video = document.querySelector("video");
    if (!video) return;
    const entry = hookedVideos.get(video);
    if (entry && entry.state) {
      if (entry.state.lastPlayTs) {
        entry.state.accumulatedSec += (Date.now() - entry.state.lastPlayTs) / 1000;
        entry.state.lastPlayTs = null;
      }
      const duration = entry.state.prevDuration || video.duration || 0;
      const percent = duration ? Math.min((entry.state.accumulatedSec / duration) * 100, 100) : 0;
      navigator.sendBeacon && navigator.sendBeacon("https://swipe-extension-server-2.onrender.com/api/events", JSON.stringify({
        type: "video-stopped",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        watchedTime: entry.state.accumulatedSec.toFixed(2),
        duration: duration.toFixed ? duration.toFixed(2) : String(duration),
        percent: percent.toFixed(1),
        sessionId,
        userId,
        pageUrl: window.location.href
      }));
    }
  } catch (err) {
    // ignore
  }
});

console.log("[SwipeExtension] Content script initialized - tracking ready ✅");
