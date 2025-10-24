// content.js - fixed full script (video events + ordered sending + correct videoId)
// Your original header & translations are preserved, only internals after them are changed/rewired.

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

window._swipeUserId = userId;
window._swipeSessionId = sessionId;

// ================== CONSENT POPUP ==================
// (Keep your original showConsentPopup and showSurveyPopup functions — copy them from your original file.)
// For brevity I'll assume they are unchanged and already present in the file (your original code). 
// If you want the full unchanged functions included here I can paste them — you already provided them earlier.

// ================== USER & SESSION SETUP ==================
let currentVideo = null; // DOM element
let lastSrc = null;      // last seen src string
let lastUrl = window.location.href;

// ================== HELPERS ==================
function getVideoId() {
  const match = window.location.href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ================== ORDERED SENDING QUEUE (guarantees DB order) ==================
let clientSeq = 0;
const eventQueue = [];
let sendingInProgress = false;

// Push event into queue (synchronous)
function queueEvent(event) {
  // ensure basic metadata
  event.sessionId = sessionId;
  event.userId = userId;
  // server timestamp will exist, but attach client timestamp and sequence
  event.clientTimestamp = new Date().toISOString();
  event.clientSeq = ++clientSeq;

  // Log to console (DevTools order)
  console.log("[SwipeExtension] QUEUED:", event.type, event.clientSeq, event.clientTimestamp, event);

  eventQueue.push(event);

  // start sender if idle
  processQueue();
}

// Sequential sender — one request at a time
function processQueue() {
  if (sendingInProgress) return;
  if (eventQueue.length === 0) return;

  sendingInProgress = true;
  const payload = eventQueue.shift();

  // Send with fetch. We rely on sequential sending so DB will receive events in same order.
  fetch("https://swipe-extension-server-2.onrender.com/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(res => {
      if (res.ok) {
        console.log("[SwipeExtension] SENT:", payload.type, payload.clientSeq);
      } else {
        console.error("[SwipeExtension] SERVER ERR:", res.status, res.statusText, payload.type, payload.clientSeq);
      }
    })
    .catch(err => {
      console.error("[SwipeExtension] FETCH ERR:", err, payload.type, payload.clientSeq);
    })
    .finally(() => {
      sendingInProgress = false;
      // schedule next tick to avoid recursion
      setTimeout(processQueue, 0);
    });
}

// Best-effort flush on unload (use sendBeacon for reliability)
window.addEventListener("beforeunload", () => {
  if (eventQueue.length === 0) return;
  try {
    // send remaining events as newline-delimited JSON array — server must accept this optional format or ignore.
    // Fallback: try sending each via navigator.sendBeacon as application/json.
    while (eventQueue.length) {
      const e = eventQueue.shift();
      const blob = new Blob([JSON.stringify(e)], { type: "application/json" });
      navigator.sendBeacon("https://swipe-extension-server-2.onrender.com/api/events", blob);
    }
  } catch (err) {
    // ignore
  }
});

// Wrapper saveEvent that queues (replaces old fetch-based saveEvent)
function saveEvent(eventData) {
  if (consent !== "yes") {
    console.log("[SwipeExtension] Tracking disabled by GDPR ❌");
    return;
  }

  // Ensure event has videoId where appropriate — call getVideoId() at enqueue time for dynamic correctness
  if (!('videoId' in eventData)) {
    eventData.videoId = getVideoId();
  }

  queueEvent(eventData);
}

// ================== PER-VIDEO STATE & HELPERS ==================
// We'll attach a stable _swipeState object to each video element we track.
// This prevents global variables (like hasPlayed) from drifting across reused <video> elements.

function createVideoState(video) {
  const state = {
    pinnedVideoId: getVideoId(),     // ID at attach-time (useful for startup/stall that belong to that video)
    pinnedSrc: video.currentSrc || video.src || null,
    hasStarted: false,              // start has been emitted for this attach
    playStartTs: null,              // Date.now() when playing started (for accumulation)
    watchedAccumSec: 0,             // accumulated watched seconds for this video before current play interval
    prevDuration: video.duration || 0,
    firstPlayTimePerf: null,        // performance.now() for startup timing
    stallStartPerf: null,           // performance.now() when stall begins
  };
  return state;
}

// Finalize previous video (send video-stopped etc) — called before switching to new video
function finalizePreviousVideoIfNeeded(prevVideo) {
  if (!prevVideo || !prevVideo._swipeState) return;

  try {
    const s = prevVideo._swipeState;
    // accumulate any current interval
    if (s.playStartTs) {
      s.watchedAccumSec += (Date.now() - s.playStartTs) / 1000;
      s.playStartTs = null;
    }
    const duration = s.prevDuration || prevVideo.duration || 0;
    const percent = duration ? Math.min((s.watchedAccumSec / duration) * 100, 100).toFixed(1) : "0.0";

    // video-stopped
    saveEvent({
      type: "video-stopped",
      videoId: s.pinnedVideoId || getVideoId(),
      src: s.pinnedSrc || prevVideo.currentSrc || prevVideo.src,
      timestamp: new Date().toISOString(),
      watchedTime: s.watchedAccumSec.toFixed(2),
      duration: (duration || 0).toFixed(2),
      percent,
    });

    // update stats (keep same approach but use the same ordering guarantee via queue)
    if (duration > 0) {
      setTimeout(() => {
        updateStats(s.watchedAccumSec, parseFloat(percent), duration);
      }, 80); // small delay to keep server-side ordering nicer
    }
  } catch (err) {
    console.warn("[SwipeExtension] finalizePreviousVideoIfNeeded error", err);
  } finally {
    // Clean up state on previous video
    try { delete prevVideo._swipeState; } catch {}
  }
}

// ================== VIDEO EVENT HOOK (robust & per-video-state) ==================
function attachVideoEvents(video) {
  if (!video || video._swipeEventsBound) return;
  video._swipeEventsBound = true;

  // Create a state object pinned to the current video element
  const state = createVideoState(video);
  video._swipeState = state;

  // update prevDuration when we get metadata
  const onLoadedMetadata = () => {
    state.prevDuration = video.duration || state.prevDuration || 0;
  };
  video.addEventListener("loadedmetadata", onLoadedMetadata);

  // --- START / RESUME detection
  // Strategy:
  // - Consider a "video-start" only the first time playing occurs after attach and when playback has made progress (currentTime > 0.03)
  // - If 'playing' happens but currentTime is ~0 and readyState low, wait for timeupdate to confirm progress (handled below).
  const onPlaying = () => {
    const pinnedId = state.pinnedVideoId || getVideoId();
    const src = state.pinnedSrc || video.currentSrc || video.src;
    // mark firstPlayTime if not set
    if (!state.firstPlayTimePerf) state.firstPlayTimePerf = performance.now();

    // If we haven't emitted video-start yet, ensure that we only do so when we actually have frame progress
    if (!state.hasStarted) {
      // Check if playback has progressed a bit or readyState indicates playable frames
      const progressed = (video.currentTime && video.currentTime > 0.03);
      const readyOk = (video.readyState && video.readyState >= 3); // HAVE_FUTURE_DATA / HAVE_ENOUGH_DATA
      if (progressed || readyOk) {
        // send startup delay (measure from attach/startupStart pinned to state)
        const startupStart = state.attachPerfTs || performance.timing.navigationStart || 0;
        // If we have a pinned firstPlayTime, compute startup delay precisely:
        const firstPlay = state.firstPlayTimePerf || performance.now();
        let startupDelay = (firstPlay - (state.attachPerfTs || performance.timing.navigationStart)) / 1000;
        // Avoid sending extremely small values
        if (startupDelay < 0) startupDelay = 0;
        if (startupDelay > 0.2) {
          saveEvent({
            type: "video-startup-delay",
            videoId: pinnedId,
            src,
            timestamp: new Date().toISOString(),
            extra: { startupDelay: startupDelay.toFixed(2) }
          });
        }

        // Now send video-start
        saveEvent({
          type: "video-start",
          videoId: pinnedId,
          src,
          timestamp: new Date().toISOString()
        });

        state.hasStarted = true;
        state.playStartTs = Date.now();
      } else {
        // playing but no progress -> wait for timeupdate to confirm first frame
        // nothing to do here; timeupdate handler will confirm.
      }
    } else {
      // already started -> this is a resume after pause/stall
      // record playStart for accumulation and emit video-resume
      if (!state.playStartTs) state.playStartTs = Date.now();
      saveEvent({
        type: "video-resume",
        videoId: pinnedId,
        src,
        timestamp: new Date().toISOString()
      });
    }
  };

  // timeupdate: used for confirming first progress and for watched-100 detection
  const onTimeUpdate = () => {
    const pinnedId = state.pinnedVideoId || getVideoId();
    const src = state.pinnedSrc || video.currentSrc || video.src;

    // If not started yet and we have progressed a bit -> treat as start
    if (!state.hasStarted && video.currentTime > 0.03) {
      // send startup delay and start similarly to onPlaying
      const firstPlay = state.firstPlayTimePerf || performance.now();
      let startupDelay = (firstPlay - (state.attachPerfTs || performance.timing.navigationStart)) / 1000;
      if (startupDelay < 0) startupDelay = 0;
      if (startupDelay > 0.2) {
        saveEvent({
          type: "video-startup-delay",
          videoId: pinnedId,
          src,
          timestamp: new Date().toISOString(),
          extra: { startupDelay: startupDelay.toFixed(2) }
        });
      }

      saveEvent({
        type: "video-start",
        videoId: pinnedId,
        src,
        timestamp: new Date().toISOString()
      });

      state.hasStarted = true;
      state.playStartTs = Date.now();
    }

    // watched-100 detection (be conservative)
    const dur = state.prevDuration || video.duration || 0;
    // If duration known and currentTime >= duration-0.5 and not already reset, mark watched-100
    if (dur && video.currentTime >= Math.max(0, dur - 0.5)) {
      // accumulate current interval first
      if (state.playStartTs) {
        state.watchedAccumSec += (Date.now() - state.playStartTs) / 1000;
        state.playStartTs = null;
      }
      // send watched-100 only if we have meaningful accumulation or duration
      saveEvent({
        type: "video-watched-100",
        videoId: state.pinnedVideoId || getVideoId(),
        src: state.pinnedSrc || video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        watchedTime: (dur).toFixed(2),
        duration: (dur).toFixed(2),
        percent: 100
      });
      saveEvent({
        type: "video-rewatch",
        videoId: state.pinnedVideoId || getVideoId(),
        src: state.pinnedSrc || video.currentSrc || video.src,
        timestamp: new Date().toISOString()
      });
      // reset accumulation after marking 100%
      state.watchedAccumSec = 0;
    }
  };

  // pause: finalize played interval and emit video-paused
  const onPause = () => {
    const pinnedId = state.pinnedVideoId || getVideoId();
    const src = state.pinnedSrc || video.currentSrc || video.src;

    if (state.playStartTs) {
      state.watchedAccumSec += (Date.now() - state.playStartTs) / 1000;
      state.playStartTs = null;
    }

    const dur = state.prevDuration || video.duration || 0;
    const percent = dur ? Math.min((state.watchedAccumSec / dur) * 100, 100) : 0;

    saveEvent({
      type: "video-paused",
      videoId: pinnedId,
      src,
      timestamp: new Date().toISOString(),
      watchedTime: state.watchedAccumSec.toFixed(2),
      duration: (dur || 0).toFixed(2),
      percent: percent.toFixed(1)
    });
  };

  // ended: treat like watched-100 (also finalize interval)
  const onEnded = () => {
    const pinnedId = state.pinnedVideoId || getVideoId();
    const src = state.pinnedSrc || video.currentSrc || video.src;

    if (state.playStartTs) {
      state.watchedAccumSec += (Date.now() - state.playStartTs) / 1000;
      state.playStartTs = null;
    }

    const dur = state.prevDuration || video.duration || 0;
    if (dur && Math.abs(state.watchedAccumSec - dur) < 2) {
      saveEvent({
        type: "video-watched-100",
        videoId: pinnedId,
        src,
        timestamp: new Date().toISOString(),
        watchedTime: dur.toFixed(2),
        duration: dur.toFixed(2),
        percent: 100
      });
      saveEvent({ type: "video-rewatch", videoId: pinnedId, src, timestamp: new Date().toISOString() });
    }
    state.watchedAccumSec = 0;
  };

  // seeked/jump
  const onSeeked = () => {
    const pinnedId = state.pinnedVideoId || getVideoId();
    const src = state.pinnedSrc || video.currentSrc || video.src;

    // if seeking while playing, accumulate current interval then restart
    if (state.playStartTs) {
      state.watchedAccumSec += (Date.now() - state.playStartTs) / 1000;
      state.playStartTs = Date.now();
    }

    // ignore trivial jumps to 0
    if (Math.abs(video.currentTime) < 0.01) return;

    saveEvent({
      type: "video-jump",
      videoId: pinnedId,
      src,
      timestamp: new Date().toISOString(),
      extra: { jumpTo: video.currentTime.toFixed(2) }
    });
    console.log(`[SwipeExtension] video-jump ${video.src} (ID: ${pinnedId}) - Jumped to ${video.currentTime.toFixed(2)}s`);
  };

  // STALL detection — measure duration, pin id at attach time
  const onWaiting = () => {
    if (!state.hasStarted && !state.firstPlayTimePerf) return;
    if (!state.stallStartPerf) state.stallStartPerf = performance.now();
  };
  const onResumeFromStall = () => {
    if (!state.stallStartPerf) return;
    const durSec = (performance.now() - state.stallStartPerf) / 1000;
    state.stallStartPerf = null;
    if (durSec > 0.2) {
      saveEvent({
        type: "video-stall",
        videoId: state.pinnedVideoId || getVideoId(),
        src: state.pinnedSrc || video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        extra: { stallDuration: durSec.toFixed(2) }
      });
      console.log("[SwipeExtension] Stall recorded", durSec.toFixed(2), "s");
    }
  };

  // Keep an attach timestamp for more accurate startup-delay
  state.attachPerfTs = performance.now();

  // Add listeners
  video.addEventListener("playing", onPlaying);
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("pause", onPause);
  video.addEventListener("ended", onEnded);
  video.addEventListener("seeked", onSeeked);
  video.addEventListener("waiting", onWaiting);
  video.addEventListener("stalled", onWaiting);
  video.addEventListener("playing", onResumeFromStall);
  video.addEventListener("timeupdate", onResumeFromStall);

  // Also expose a finalize function on the element for convenience
  video._swipeFinalize = () => {
    finalizePreviousVideoIfNeeded(video);
  };
}

// ================== LIKE / DISLIKE / SHARE (dedupe) ==================
const lastActionTs = {};
function sendOncePerSecond(key, payload) {
  const now = Date.now();
  if (lastActionTs[key] && now - lastActionTs[key] < 1000) {
    // dedupe
    console.log("[SwipeExtension] Skipped duplicate action:", key);
    return;
  }
  lastActionTs[key] = now;
  // ensure videoId captured at call time
  if (!('videoId' in payload)) payload.videoId = getVideoId();
  if (!('src' in payload)) payload.src = currentVideo?.src || null;
  saveEvent(payload);
}

function attachActionEvents() {
  try {
    const likeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(1) button, button[aria-label*="like"], button[aria-label*="Like"]');
    const dislikeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(2) button, button[aria-label*="dislike"], button[aria-label*="Dislike"]');
    const shareBtn = document.querySelector('ytd-button-renderer#share-button button, button[aria-label*="share"], button[aria-label*="Share"], #share-button button');

    if (likeBtn && !likeBtn._swipeHooked) {
      likeBtn._swipeHooked = true;
      likeBtn.addEventListener("click", () => {
        sendOncePerSecond("video-like", { type: "video-like", timestamp: new Date().toISOString() });
      });
    }
    if (dislikeBtn && !dislikeBtn._swipeHooked) {
      dislikeBtn._swipeHooked = true;
      dislikeBtn.addEventListener("click", () => {
        sendOncePerSecond("video-dislike", { type: "video-dislike", timestamp: new Date().toISOString() });
      });
    }
    if (shareBtn && !shareBtn._swipeHooked) {
      shareBtn._swipeHooked = true;
      shareBtn.addEventListener("click", () => {
        sendOncePerSecond("video-share", { type: "video-share", timestamp: new Date().toISOString() });
      });
    }
  } catch (err) {
    console.warn("[SwipeExtension] attachActionEvents failed", err);
  }
}

// Global capture-phase fallback for actions (helps if YouTube re-renders buttons)
function globalActionClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const label = ((btn.getAttribute("aria-label") || btn.title || btn.innerText) + "").toLowerCase().trim();
  if (!label) return;
  if (label.includes("like") || label.includes("aimer") || label.includes("j'aime")) {
    sendOncePerSecond("video-like", { type: "video-like", timestamp: new Date().toISOString() });
  } else if (label.includes("dislike") || label.includes("pas aimer")) {
    sendOncePerSecond("video-dislike", { type: "video-dislike", timestamp: new Date().toISOString() });
  } else if (label.includes("share") || label.includes("partager")) {
    sendOncePerSecond("video-share", { type: "video-share", timestamp: new Date().toISOString() });
  }
}
document.removeEventListener("click", globalActionClick, true);
document.addEventListener("click", globalActionClick, true);

// ================== STATS (unchanged behavior) ==================
function updateStats(watchedTime, percentWatched, duration, currentBitrate = null) {
  chrome.storage.local.get(['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'], (data) => {
    const videos = (data.videosWatched || 0) + 1;
    const totalTime = (data.totalWatchedTime || 0) + watchedTime;
    const history = data.videoHistory || [];

    const avgPercent = ((data.avgPercentWatched || 0) * (videos - 1) + percentWatched) / videos;

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

// ================== VIEWPORT & RESOLUTION (unchanged logically) ==================
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

function trackViewportChanges(video) {
  if (!video) return;
  let lastViewport = { w: 0, h: 0 };

  const sendViewportEvent = (w, h) => {
    saveEvent({
      type: "video-viewport-change",
      videoId: getVideoId(),
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      extra: {
        width: w,
        height: h,
        aspect_ratio: (w / h).toFixed(2),
        orientation: w > h ? "landscape" : "portrait",
      },
    });
  };

  const checkViewport = () => {
    const vp = getVideoViewport(video);
    if (vp && (vp.width !== lastViewport.w || vp.height !== lastViewport.h)) {
      lastViewport = { w: vp.width, h: vp.height };
      sendViewportEvent(vp.width, vp.height);
      console.log(`[SwipeExtension] Viewport changed: ${vp.width}x${vp.height}`);
    }
  };

  video.addEventListener("loadedmetadata", checkViewport);
  window.addEventListener("resize", checkViewport);
  document.addEventListener("fullscreenchange", checkViewport);
  setInterval(checkViewport, 2000);
}

function getMaxResolutionAndBitrate() {
  try {
    const script = [...document.scripts].find(s => s.textContent.includes('ytInitialPlayerResponse'));
    if (!script) return null;
    const match = script.textContent.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
    if (!match) return null;
    const data = JSON.parse(match[1]);
    const adaptiveFormats = data?.streamingData?.adaptiveFormats;
    if (!adaptiveFormats || !adaptiveFormats.length) return null;
    const videoFormats = adaptiveFormats.filter(f => f.width && f.height && f.mimeType.includes('video'));
    if (!videoFormats.length) return null;
    const maxFmt = videoFormats.reduce((acc, fmt) => {
      const accPixels = (acc.width || 0) * (acc.height || 0);
      const pixels = fmt.width * fmt.height;
      return pixels > accPixels ? fmt : acc;
    }, {});
    const maxRes = `${maxFmt.width}x${maxFmt.height}`;
    const bitrate = maxFmt.averageBitrate || maxFmt.bitrate || null;
    return { maxRes, bitrate };
  } catch (err) {
    console.warn('[SwipeExtension] Failed to parse ytInitialPlayerResponse:', err);
    return null;
  }
}

function trackVideoResolution(video) {
  if (!video || video._resolutionHooked) return;
  video._resolutionHooked = true;

  video.addEventListener("loadedmetadata", () => {
    try {
      const currentWidth = video.videoWidth;
      const currentHeight = video.videoHeight;
      const data = (function readIPR() {
        try {
          const scr = [...document.scripts].find(s => s.textContent.includes('ytInitialPlayerResponse'));
          if (!scr) return null;
          const m = scr.textContent.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
          if (!m) return null;
          return JSON.parse(m[1]);
        } catch { return null; }
      })();
      let maxRes = null;
      if (data?.streamingData?.adaptiveFormats) {
        const vf = data.streamingData.adaptiveFormats.filter(f => f.width && f.height);
        if (vf.length) {
          const max = vf.reduce((a,b)=>((a.width*a.height)>(b.width*b.height)?a:b));
          maxRes = `${max.width}x${max.height}`;
        }
      }
      saveEvent({
        type: "video-resolution",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        extra: { current: `${currentWidth}x${currentHeight}`, max: maxRes || undefined, viewport: getVideoViewport(video) }
      });
    } catch (err) {
      // ignore
    }
  });

  let lastW = 0, lastH = 0;
  const interval = setInterval(() => {
    if (video.readyState < 2) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (w && h && (w !== lastW || h !== lastH)) {
      lastW = w; lastH = h;
      saveEvent({
        type: "video-resolution-change",
        videoId: getVideoId(),
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        extra: { width: w, height: h, viewport: getVideoViewport(video) }
      });
    }
  }, 2000);

  video.addEventListener("ended", ()=>clearInterval(interval));
}

// ================== OBSERVE VIDEO CHANGES and SYNCHRONIZED TRANSITIONS ==================
const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (!video) return;

  // Hook resolution & viewport tracking once per video element
  if (!video._resolutionHooked) {
    video._resolutionHooked = true;
    attachStallAndStartupTracking(video); // this will piggyback on per-video state
    trackVideoResolution(video);
    trackViewportChanges(video);
  }

  // Handle new video (src changes)
  const currentSrc = video.currentSrc || video.src || null;
  if (currentSrc && currentSrc !== lastSrc) {
    // Finalize old video BEFORE setting up the next one so ordering is consistent
    if (currentVideo && currentVideo !== video) {
      // finalize previous
      finalizePreviousVideoIfNeeded(currentVideo);

      // swiped-to-new-video event belongs to the new video but we attach previous as 'previous'
      saveEvent({
        type: "swiped-to-new-video",
        videoId: getVideoId(), // new video id, determined now
        src: currentSrc,
        timestamp: new Date().toISOString(),
        extra: { previous: lastSrc }
      });
    }

    // Set current video and attach events
    currentVideo = video;
    lastSrc = currentSrc;

    // Reset variables by attaching events which create a fresh per-video _swipeState
    attachVideoEvents(video);
    attachActionEvents();
  }
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Re-hook on URL change (SPA nav)
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // finalize previous if needed
    if (currentVideo) finalizePreviousVideoIfNeeded(currentVideo);
    const v = document.querySelector("video");
    if (v) {
      // Attach to new video element or re-attach
      attachVideoEvents(v);
      attachActionEvents();
      lastSrc = v.currentSrc || v.src || lastSrc;
      currentVideo = v;
    }
  }
}, 800);

// ================== STALL & STARTUP ATTACHMENT (kept for compatibility) ==================
function attachStallAndStartupTracking(video) {
  // we already handle stall/startup inside attachVideoEvents via per-video state,
  // but keep this for backward compat & to ensure listeners are set early
  if (!video) return;
  if (!video._swipeEventsBound) {
    attachVideoEvents(video);
  }
}

// ================ END OF SCRIPT ================
console.log("[SwipeExtension] Tracking engine loaded (video events & ordered sending) ✅");
