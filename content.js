// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025, SWiPE X / COATI-DIANA

console.log("[SwipeExtension] Content script injected ✅");
const API_URL = "https://swipex.inria.fr"; 
const API_KEY = "205aeeaf6a910355d142789b7ff53b2b5219120edb6f43b724aa3d2e473836bd";

// ================== TRANSLATIONS ==================
const translations = {
 en: {
    consentTitle: "🔒 Information and Consent to Participate",
    consentText: `
    <div style="text-align: left;">

    <b>⛓️‍💥 PROJECT IDENTIFICATION</b><br><br>

    <b>📌 Project initiative</b><br>
    This experiment is initiated by the <b>Inria Centre at Université Côte d’Azur (Sophia Antipolis)</b>.

    <br><br>
    <b>📌 Project lead</b><br>
    <b>GIROIRE Frédéric</b> – CNRS Research Director.

    <br><br>
    <b>📌 Other researchers involved</b><br>
    - <b>MOULIÉRAC Joanna</b> – Associate Professor, Université Côte d’Azur (COATI project-team).<br>
    - <b>TURLETTI Thierry</b> – Inria Research Director (DIANA project-team).<br>
    - <b>BARAKAT Chadi</b> – Inria Research Director (DIANA project-team).<br>
    - <b>ABOU LTAIF Jamil</b> – PhD student, Inria Centre at Université Côte d’Azur (COATI project-team).

    <br><br>
    <b>📌 Project teams and location of the experiment</b><br>
    This project is conducted by the joint <b>COATI and DIANA project-teams</b>, affiliated with the <b>Inria Centre at Université Côte d’Azur</b>, located at: <i>2004 route des Lucioles, 06902 Sophia Antipolis, France</i>.

    <br><br>
    <b>📌 Project title</b><br>
    SWiPE X
    <br><br>
    <b>📌 Ethical approval</b><br>
    This project has received a <b>favorable opinion from Inria’s Operational Committee for the Evaluation of Legal and Ethical Risks (COERLE)</b>.

    <br><br>
    <b>📌 Voluntary participation</b><br>
    Your participation in this project is <b>entirely voluntary</b>.  
    After reading and understanding the “Data Collection Notice” below, your acceptance of this form indicates your free and informed consent to participate, without any constraint or external pressure.  
    <br>
    If you require additional information to make your decision, please contact the person listed below.

    <br><br>
    <hr>

    <b>🔐 DATA COLLECTION NOTICE</b><br><br>

    <b>📌 Purpose of data collection</b><br>
    The purpose of this data collection is to analyze how users interact with short-form videos in order to improve the design and performance of short-video platforms.

    <br><br>
    <b>📌 Data collected</b><br>
    If you agree to participate, the browser extension will collect:
    <ul style="padding-left: 25px; margin-top:5px; margin-bottom:5px;">
      <li>User interactions with Shorts videos (play, pause, resume, skip, swipe, like/dislike, share, stop, rewatch)</li>
      <li>Video characteristics (identifier, channel, category, duration, resolution, watch time)</li>
      <li>Quality of service indicators (startup time, playback interruptions)</li>
    </ul>

    <br>
    <b>📌 Participation requirements</b><br>
    Participation is limited to individuals aged <b>18 years or older</b>.  
    If you are under 18, you must immediately uninstall the extension.

    <br><br>
    <b>📌 Use of data</b><br>
    The collected data will be used exclusively in an <b>anonymous and aggregated form</b> for scientific research purposes, including academic publications and presentations.

    <br><br>
    <b>📌 Data storage and protection</b><br>
    Data are collected anonymously and stored on an encrypted, password-protected storage device for a period of <b>15 years</b>, in accordance with research regulations.

    <br><br>
    <b>📌 Participants’ rights</b><br>
    This study complies with the General Data Protection Regulation (GDPR).  
    Due to the anonymous nature of the data, the rights of access, rectification, and deletion cannot be exercised after data collection.

    <br><br>
    <b>📩 Contact</b><br>
    For any questions regarding the project or data collection, you may contact:<br>
    <b>ABOU LTAIF Jamil – jamil.abou-ltaif@inria.fr</b>

    <br><br>
    </div>
    `,
    consentQuestion: "Do you agree to participate in this study?",
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
    q3Options: ["-- Select --","Comedy & Entertainment","Fashion & Lifestyle","Movies & Animation","Science & Technology","Gaming","Sports","Prefer not to say"],
    q4: "4. Your age group?",
    q4Options: ["-- Select --","18-25","26-35","36 and above","Prefer not to say"],
    q5: "5. Do you often interact with Shorts?",
    q5Options: ["-- Select --","Like or dislike","Comment on videos","Share with others","All of the above","I usually just watch without engaging","Prefer not to say"],
  },
  fr: {
    consentTitle: "🔒 Information et Consentement à la Participation",
    consentText: `
    <div style="text-align: left;">

    <b>⛓️‍💥 IDENTIFICATION DU PROJET</b><br><br>

    <b>📌 Initiative du projet</b><br>
    Cette expérimentation est initiée par le <b>Centre Inria d’Université Côte d’Azur (Sophia Antipolis)</b>.

    <br><br>
    <b>📌 Responsable du projet</b><br>
    <b>GIROIRE Frédéric</b> – Directeur de recherche CNRS.

    <br><br>
    <b>📌 Autres scientifiques impliqués</b><br>
    - <b>MOULIÉRAC Joanna</b> – Maître de conférences, Université Côte d’Azur (équipe-projet COATI).<br>
    - <b>TURLETTI Thierry</b> – Directeur de recherche Inria (équipe-projet DIANA).<br>
    - <b>BARAKAT Chadi</b> – Directeur de recherche Inria (équipe-projet DIANA).<br>
    - <b>ABOU LTAIF Jamil</b> – Doctorant, Centre Inria d’Université Côte d’Azur (équipe-projet COATI).

    <br><br>
    <b>📌 Équipes-projet et lieu de l’expérimentation</b><br>
    Projet mené par les <b>équipes-projet communes COATI et DIANA</b>, rattachées au <b>Centre Inria d’Université Côte d’Azur</b>, situé au : <i>2004 route des Lucioles, 06902 Sophia Antipolis, France</i>.

    <br><br>
    <b>📌 Nom du projet</b><br>
    SWiPE X

    <br><br>
    <b>📌 Avis éthique</b><br>
    Ce projet a reçu un <b>avis favorable du Comité Opérationnel d’Évaluation des Risques Légaux et Éthiques (COERLE) d’Inria</b>.

    <br><br>
    <b>📌 Participation volontaire</b><br>
    Votre participation à ce projet est <b>entièrement volontaire</b>.  
    Après avoir pris connaissance de « l’Avis sur la collecte de données » ci-dessous, votre acceptation de ce formulaire vaut consentement libre, éclairé et sans contrainte.  
    <br>
    Si des informations nécessaires à votre prise de décision vous manquent, vous pouvez contacter la personne référente indiquée ci-dessous.

    <br><br>
    <hr>

    <b>🔐 AVIS SUR LA COLLECTE DE DONNÉES</b><br><br>

    <b>📌 Objet de la collecte</b><br>
    Cette collecte de données vise à analyser les interactions des utilisateurs avec les vidéos courtes afin d’améliorer la conception et les performances des plateformes de vidéos courtes.

    <br><br>
    <b>📌 Données collectées</b><br>
    L’extension enregistre :
    <ul style="padding-left: 25px; margin-top:5px; margin-bottom:5px;">
      <li>Les interactions avec les vidéos Shorts (lecture, pause, reprise, saut, swipe, j’aime/pas j’aime, partage, arrêt, re-visionnage)</li>
      <li>Les caractéristiques des vidéos (identifiant, chaîne, catégorie, durée, résolution, temps de visionnage)</li>
      <li>Les indicateurs de qualité de service (temps de démarrage, interruptions)</li>
    </ul>

    <br>
    <b>📌 Conditions de participation</b><br>
    La participation est réservée aux personnes âgées de <b>18 ans ou plus</b>.  
    Les personnes mineures doivent désinstaller l’extension.

    <br><br>
    <b>📌 Utilisation des données</b><br>
    Les données seront exploitées uniquement sous forme <b>anonymisée et agrégée</b> à des fins de recherche scientifique, de publications et de présentations académiques.

    <br><br>
    <b>📌 Conservation et protection des données</b><br>
    Les données sont collectées de manière anonyme et stockées sur un support chiffré et protégé par mot de passe pendant <b>15 ans</b>, conformément aux exigences réglementaires en matière de recherche.

    <br><br>
    <b>📌 Droits des participants</b><br>
    Cette étude est conforme au RGPD.  
    En raison de l’anonymisation des données, les droits d’accès, de rectification et de suppression ne peuvent pas être exercés après la collecte.

    <br><br>
    <b>📩 Contact</b><br>
    Pour toute question relative au projet ou à la collecte des données, vous pouvez contacter :  
    <b>ABOU LTAIF Jamil – jamil.abou-ltaif@inria.fr</b>

    <br><br>
    </div>
    `,
    consentQuestion: "Acceptez-vous de participer à cette étude ?",
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
    q3Options: ["-- Sélectionner --","Comédie & Divertissement","Mode & Style de vie","Films & Animation","Science & Technologie","Jeux vidéo","Sports","Je préfère ne pas répondre"],
    q4: "4. Votre tranche d'âge ?",
    q4Options: ["-- Sélectionner --","18-25","26-35","36 ans et plus","Je préfère ne pas répondre"],
    q5: "5. Interagissez-vous souvent avec les Shorts ?",
    q5Options: ["-- Sélectionner --","Aimer ou ne pas aimer","Commenter les vidéos","Partager avec d'autres","Toutes les réponses ci-dessus","Je regarde généralement sans interagir","Je préfère ne pas répondre"],
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
  popup.style.cssText = `
    position: fixed;
    inset: 0;
    margin: auto;
    width: min(95vw, 980px);
    height: min(90vh, 900px);
    background: #fff;
    border: 2px solid #444;
    border-radius: 14px;
    box-shadow: 0 6px 30px rgba(0,0,0,0.35);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
    font-size: clamp(14px, 1.1vw, 17px);
  `;

  popup.innerHTML = `
    <!-- TITLE -->
    <h2 style="
      margin: 10px 0 5px 0;
      font-size: 24px;
      text-align: center;
    ">
      ${t.consentTitle}
    </h2>

    <!-- LANGUAGE -->
    <div style="text-align:center; margin-bottom:15px;">
      <p style="margin:8px 0;">
        Select language / Choisir la langue
      </p>
      <select id="lang-select" style="
        padding:6px 10px;
        font-size: 0.9em;
        width: auto;
      ">
        <option value="en" ${selectedLang==="en"?"selected":""}>English</option>
        <option value="fr" ${selectedLang==="fr"?"selected":""}>Français</option>
      </select>
    </div>

    <!-- SCROLLABLE TEXT -->
    <div id="consent-content" style="
      flex: 1;
      overflow-y: auto;
      padding: 20px 35px;
      margin: 10px 20px;
      border: 1px solid #ddd;
      text-align: left;
      line-height: 1.55;
    ">
      ${t.consentText}
    </div>

    <!-- QUESTION -->
    <p style="
      text-align: center;
      font-weight: bold;
      margin: 15px 0 5px 0;
    ">
      ${t.consentQuestion}
    </p>

    <!-- BUTTONS -->
    <div style="
      text-align: center;
      margin-bottom: 15px;
    ">
      <button id="consent-yes" style="
        margin: 8px 12px;
        padding: 10px 26px;
        cursor: pointer;
        font-size: 1em;
      ">
        ${t.yes}
      </button>

      <button id="consent-no" style="
        margin: 8px 12px;
        padding: 10px 26px;
        cursor: pointer;
        font-size: 1em;
      ">
        ${t.no}
      </button>
    </div>
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
    <button id="survey-submit" style="padding:10px 20px; cursor:pointer;">${t.submit}</button>
  `;

  document.body.appendChild(popup);

  const submitBtn = document.getElementById("survey-submit");

  //  Define the handler first
  const handleSurveySubmit = () => {
    submitBtn.disabled = true;

    const answers = ["q1","q2","q3","q4","q5"].reduce((acc,key)=>{
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

    fetch(`${API_URL}/api/surveys`, {
      method: "POST",
      headers: { "Content-Type": "application/json","x-api-key": API_KEY },
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
  if (consent !== "yes") return;

  // Add user/session info
  eventData.sessionId = sessionId;
  eventData.userId = userId;

  // Send the event to background script (NOT directly to gateway)
  chrome.runtime.sendMessage({ type: "event", data: eventData });
  console.log("[DEBUG] Event sent to background", eventData);
}



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
  if (window._attachActionEventsInstalled) return;
  window._attachActionEventsInstalled = true;

  // Match must start with or exactly be "dislike", not just contain "like"
  const isDislike = (btn) =>
    btn?.matches &&
    (
      btn.matches('button[aria-label^="Dislike" i]') ||
      btn.matches('button[aria-label*="dislike" i]')
    );

  const isLike = (btn) =>
    btn?.matches &&
    !isDislike(btn) && // ensure not a dislike
    (
      btn.matches('button[aria-label^="Like" i]') ||
      btn.matches('button[aria-label*="like this video" i]')
    );

  const isShare = (btn) =>
    btn?.matches &&
    (
      btn.matches('button[aria-label*="share" i]') ||
      /share/i.test(btn.getAttribute('aria-label') || '') ||
      /share/i.test(btn.textContent || '')
    );

  const emit = (type) => {
    if (typeof queueEvent !== 'function') return;
    queueEvent({
      type,
      videoId: typeof getVideoId === 'function' ? getVideoId() : undefined,
      src: typeof currentVideo !== 'undefined' ? currentVideo?.src : undefined,
    });
  };

  const attachToContainer = (container) => {
    if (!container || container._reelHooksAttached) return;
    container._reelHooksAttached = true;

    container.addEventListener(
      'click',
      (ev) => {
        const btn = ev.target.closest?.('button');
        if (!btn || !container.contains(btn)) return;

        if (isDislike(btn)) {
          emit('video-dislike');
        } else if (isLike(btn)) {
          emit('video-like');
        } else if (isShare(btn)) {
          emit('video-share');
        }
      },
      true
    );
  };

  const tryAttachImmediate = () => {
    const container = document.querySelector('#button-bar');
    if (container) attachToContainer(container);
  };
  tryAttachImmediate();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches?.('#button-bar')) {
          attachToContainer(node);
        } else {
          const found = node.querySelector?.('#button-bar');
          if (found) attachToContainer(found);
        }
      }
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });
}


// =================  STATS ========================
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

  // check every few seconds for subtle UI changes
  setInterval(checkViewport, 5000);
}

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
      
      // Log initial
      saveEvent({
        type: "video-resolution",
        videoId: currentVideoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        extra: {
          current: `${currentWidth}x${currentHeight}`,
          max: maxRes,
          viewport: getVideoViewport(video),
        },
      });

      allowChanges = true;
      lastWidth = currentWidth;
      lastHeight = currentHeight;

      // Periodic resolution tracking
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

// ============= START-UP DELAY & STALLS ================
function attachStallAndStartupTracking(video) {
  if (video._stallStartupHooked) return;
  video._stallStartupHooked = true;

  //const videoId = getVideoId();

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
          videoId: getVideoId(),
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
          videoId:getVideoId(),
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
// ================== OBSERVE VIDEO CHANGES ==================
let eventQueue = [];
let isSaving = false;

async function processQueue() {
  if (isSaving || eventQueue.length === 0) return;
  isSaving = true;

  const event = eventQueue.shift();
  try {
    await saveEvent(event); // assume returns Promise or wrap it
  } catch (err) {
    console.error("Failed to save event:", err);
  } finally {
    isSaving = false;
    // small delay to maintain timestamp order
    setTimeout(processQueue, 50);
  }
}

function queueEvent(evt) {
  evt.timestamp = new Date().toISOString();
  eventQueue.push(evt);
  processQueue();
}

const observer = new MutationObserver(() => {
  const video = document.querySelector("video");
  if (!video) return;

  if (!video._resolutionHooked) {
    video._resolutionHooked = true;
    attachStallAndStartupTracking(video);
    const videoId = getVideoId();
    trackVideoResolution(video, videoId);
    trackViewportChanges(video);
  }

  // === Detect new video ===
  if (video.src && video.src !== lastSrc) {
    const videoId = getVideoId();

    // --- Stop previous video if any ---
    if (currentVideo && startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
      const duration = prevDuration || currentVideo.duration || 0;
      const percent = duration
        ? Math.min((watchedTime / duration) * 100, 100).toFixed(1)
        : "0";

      queueEvent({
        type: "video-stopped",
        videoId: getVideoId(),
        src: currentVideo.src,
        watchedTime: watchedTime.toFixed(2),
        duration: duration.toFixed(2),
        percent,
      });

      if (duration > 0) {
        setTimeout(() => {
          updateStats(watchedTime, parseFloat(percent), duration);
        }, 100);
      }
    }

    // --- Transition event ---
    if (lastSrc) {
      queueEvent({
        type: "swiped-to-new-video",
        videoId,
        src: video.src,
        extra: { previous: lastSrc },
      });
    }

    // --- Start new video ---
    currentVideo = video;
    lastSrc = video.src;
    startTime = Date.now();
    watchedTime = 0;
    prevDuration = video.duration || 0;
    hasPlayed = false;

    // queueEvent({
    //   type: "video-start",
    //   videoId,
    //   src: video.src,
    // });

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
}, 100);
