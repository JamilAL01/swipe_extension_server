// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025, SWiPE X / COATI-DIANA

console.log("[SwipeExtension] TikTok content script injected ✅");
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
    q1: "1. How often do you watch Shorts?",
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
    q1: "1. À quelle fréquence regardez-vous les Shorts ?",
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
let selectedLang =
  localStorage.getItem("swipeLang") ||
  (navigator.language.startsWith("fr") ? "fr" : "en");

let consent = null;
let userId = null;
let sessionId = crypto.randomUUID();

window._swipeUserId = null;
window._swipeSessionId = sessionId;

chrome.storage.local.get(
  "swipeUserId",
  ({ swipeUserId }) => {
    const legacyUserId =
      localStorage.getItem("swipeUserId");

    // Prefer the ID shared by the extension.
    userId =
      swipeUserId ||
      legacyUserId ||
      crypto.randomUUID();

    // Synchronize both storage locations.
    chrome.storage.local.set({
      swipeUserId: userId
    });

    localStorage.setItem(
      "swipeUserId",
      userId
    );

    window._swipeUserId = userId;

    // Start tracking if TikTok is already loaded.
    if (document.body) {
      handleVideoChange();
    }
  }
);

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
    localStorage.setItem("swipeConsent", "yes");
    chrome.storage.local.set({ swipeConsent: "yes" });

    consent = "yes";
    handleVideoChange();
    popup.remove();
    window._swipeConsentDismissedAt = performance.now();
    showSurveyPopup();
  };


  document.getElementById("consent-no").onclick = () => {
    localStorage.setItem("swipeConsent", "no");
    chrome.storage.local.set({ swipeConsent: "no" });

    consent = "no";
    popup.remove();
  };
}

// ================== SERVICE - YOUR VOICE --> YOUR CONTROL ==================

// SWiPE X Content Script
let recognition;
let isLazyModeActive = false;
let commandCooldown = false;

let lastActionTime = 0;
let autoNextInterval = null;
let handledVideoId = null;
let voiceCommandTriggered = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.lazyMode !== undefined) {
    isLazyModeActive = msg.lazyMode;

    if (isLazyModeActive) initRecognition();
    else stopRecognition();
  }
});


function isSwipeCommand(text) {
  const SWIPE = new Set([
    "swipe",
    "skip",
    "next",
    "nekst",
    "neckst",
    "nex",
    "go next"
  ]);

  return SWIPE.has(text);
}

function isXCommand(text) {
  const X = new Set([
    "x",
    "ex",
    "eks",
    "iks",
    "reject",
    "remove"
    // "dont recommend",
    // "not recommend"
  ]);

  return X.has(text);
}

function triggerCommand(action, label) {
  commandCooldown = true;
  lastActionTime = Date.now(); // user acted

  action();
  updateLastCommandUI(label);

  setTimeout(() => {
    commandCooldown = false;
  }, 700);
}


function initRecognition() {
  if (recognition) return;

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    if (!isLazyModeActive || commandCooldown) return;

    let transcript =
      event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ");

    console.log("Heard:", transcript);

    // SAFE PHONETIC MATCHING
    if (isSwipeCommand(transcript)) {
      triggerCommand(swipeVideo, "Swiped");
    }

    if (isXCommand(transcript)) {
      triggerCommand(markNotRecommended, "Not Recommended");
    }
  };

  recognition.onend = () => {
    if (isLazyModeActive) recognition.start();
  };

  lastActionTime = Date.now();
  recognition.start();
  startAutoNextWatcher();
}


function stopRecognition() {
  if (recognition) {
    recognition.onresult = null;
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }

  if (autoNextInterval) {
    clearInterval(autoNextInterval);
    autoNextInterval = null;
  }

  console.log("SWiPE X stopped");
}

function startAutoNextWatcher() {
  if (autoNextInterval) return;

  autoNextInterval = setInterval(() => {
    if (!isLazyModeActive) return;

    const video = getActiveVideo();
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const videoId = getVideoId(video);

    // New video: reset the timer and state.
    if (videoId !== handledVideoId) {
      handledVideoId = videoId;
      lastActionTime = Date.now();
      return;
    }

    const progress = video.currentTime / video.duration;
    const idleTime = Date.now() - lastActionTime;

    if (progress >= 0.98 && idleTime >= 3000) {
      console.log("SWiPE X TikTok: Auto-next at end");

      lastActionTime = Date.now();
      voiceCommandTriggered = true;
      swipeVideo();
    }
  }, 1000);
}

// Popup Notification
function updateLastCommandUI(commandText) {
  chrome.runtime.sendMessage({ lastCommand: commandText });
}

// Helper Functions
function clickWithRetry(selector, retries = 5, delay = 300) {
  const el = document.querySelector(selector);
  if (el) {
    el.click();
    return true;
  } else if (retries > 0) {
    setTimeout(() => clickWithRetry(selector, retries - 1, delay), delay);
  } else {
    console.log("SWiPE X: Element not found:", selector);
  }
}

function handleVoiceCommand(text) {
  console.log("SWiPE X processing:", text);

  if (text.includes("swipe")) {
    voiceCommandTriggered = true; 
    swipeVideo();
    updateLastCommandUI("Swiped ➡️");
    return;
  }

  if (
    text.includes("x") ||
    text.includes("ex") ||
    text.includes("eks")
  ) {
    voiceCommandTriggered = true; //  mark as used
    markNotRecommended();
    updateLastCommandUI("Not Recommended ❌");
    return;
  }

  console.log("SWiPE X: No matching command");
}

// ----- Function: Swipe Video -----
function getScrollableParent(element) {
  let parent = element?.parentElement;

  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    const canScroll =
      /(auto|scroll)/.test(style.overflowY) &&
      parent.scrollHeight > parent.clientHeight;

    if (canScroll) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document.scrollingElement;
}

function swipeVideo() {
  console.log("SWiPE X TikTok: Triggering next video");

  const video = getActiveVideo();
  const card = getVideoCard(video);
  const scrollContainer = getScrollableParent(card || video);

  if (!scrollContainer) {
    console.log("SWiPE X TikTok: Scroll container not found");
    return;
  }

  const distance =
    scrollContainer === document.scrollingElement
      ? Math.max(window.innerHeight * 0.9, 500)
      : Math.max(scrollContainer.clientHeight * 0.9, 500);

  scrollContainer.scrollBy({
    top: distance,
    behavior: "smooth"
  });

  console.log("SWiPE X TikTok: Scrolled to next video");
}

// ----- Function: Mark Not Recommended -----
function markNotRecommended() {
  const video = getActiveVideo();
  const card = getVideoCard(video);

  const menuButton = card?.querySelector(
    '[data-key-interaction="video_more_menu"] button'
  );

  if (!menuButton) {
    console.log("SWiPE X TikTok: More menu not found");
    return;
  }

  menuButton.click();

  // TikTok renders the menu asynchronously.
  let attempts = 0;
  const maximumAttempts = 10;

  const findMenuOption = setInterval(() => {
    attempts++;

    const notInterestedButton = document.querySelector(
      '[data-e2e="more-menu-popover_not-interested"]'
    );

    if (!notInterestedButton) {
      if (attempts >= maximumAttempts) {
        clearInterval(findMenuOption);

        console.log(
          "SWiPE X TikTok: Not Interested option not found"
        );
      }

      return;
    }

    clearInterval(findMenuOption);
    notInterestedButton.click();

    const videoId = getVideoId(video);

    saveEvent({
      type: "video-not-interested",
      videoId,
      src: video?.currentSrc || video?.src,
      channelName: getChannelName(video)
    });

    chrome.storage.local.get(
      "notRecommendedVideos",
      (data) => {
        const list = data.notRecommendedVideos || [];

        list.push({
          id: videoId,
          platform: "tiktok",
          timestamp: Date.now()
        });

        chrome.storage.local.set({
          notRecommendedVideos: list
        });
      }
    );

    console.log(
      "SWiPE X TikTok: Marked video as Not Interested"
    );
  }, 100);
}

// // ================== SPA PROBLEM --> SOLUTION: AUTO RELOAD ==================

// function autoReloadShorts() {
//   const isShorts = window.location.pathname.startsWith("/shorts/");
//   const alreadyInShorts = sessionStorage.getItem("swipex-in-shorts");

//   // Entering Shorts for the first time
//   if (isShorts && !alreadyInShorts) {
//     console.log("SWiPE X: Entered Shorts → Reload once");

//     sessionStorage.setItem("swipex-in-shorts", "true");
//     location.reload();
//   }

//   // If we leave Shorts, reset the flag
//   if (!isShorts && alreadyInShorts) {
//     sessionStorage.removeItem("swipex-in-shorts");
//   }
// }

// document.addEventListener("yt-navigate-finish", autoReloadShorts);


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
      console.warn(
        "[SwipeExtension] Survey submission delayed — user/session not initialized"
      );

      submitBtn.disabled = false;
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
        answers: {
          ...answers,
          platform: "tiktok"
        },
        screen_size: screenInfo,
        device_type: deviceType,
        timestamp: new Date().toISOString()
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Survey save failed");

        console.log("[SwipeExtension] Survey saved ✅", answers);
        localStorage.setItem("surveyDone", "true");
        popup.remove();
      })
      .catch(err => {
        console.error("[SwipeExtension] Survey error ❌", err);
        submitBtn.disabled = false;
      });
      
  };

  //  Clear any previous handlers and attach only once
  submitBtn.onclick = null;
  submitBtn.addEventListener("click", handleSurveySubmit);
}

// ================== CONSENT CHECK ==================
chrome.storage.local.get("swipeConsent", ({ swipeConsent }) => {
  // Migrate consent from an older YouTube installation.
  const legacyConsent = localStorage.getItem("swipeConsent");

  consent = swipeConsent ?? legacyConsent;

  if (swipeConsent == null && legacyConsent !== null) {
    chrome.storage.local.set({ swipeConsent: legacyConsent });
  }

  if (!consent) {
    showConsentPopup();
  } else if (consent === "yes") {
    showSurveyPopup();
    handleVideoChange();
  }
});
// ================== USER & SESSION SETUP ==================
let currentVideo = null;
let lastSrc = null;
let startTime = null;
let lastKnownBitrate = null;
let watchedTime = 0;
let prevDuration = 0;
let hasPlayed = false; 
let lastUrl = window.location.href;

// ================== HELPER FUNCTIONS ==================
function getVideoId(video = currentVideo) {
  const player =
    video?.closest('[id^="xgwrapper-"]') ||
    document.querySelector(
      '[id^="xgwrapper-"][tt-tag*="_active"]'
    );

  if (!player) return null;

  const match = player.id.match(
    /^xgwrapper-\d+-(\d+)$/
  );

  return match ? match[1] : null;
}

function saveEvent(eventData) {
  if (consent !== "yes") return;

  eventData.sessionId = sessionId;
  eventData.userId = userId;
  eventData.channelName =
    eventData.channelName ||
    getChannelName(currentVideo);

  eventData.extra = {
    ...(eventData.extra || {}),
    platform: "tiktok"
  };

  chrome.runtime.sendMessage({
    type: "event",
    data: eventData
  });

  console.log("[DEBUG] Event sent to background", eventData);
}


function getActiveVideo() {
  const activePlayer = document.querySelector(
    '[id^="xgwrapper-"][tt-tag*="_active"]'
  );

  return activePlayer?.querySelector("video") || null;
}

function getVideoCard(video = getActiveVideo()) {
  if (!video) return null;

  let parent = video.parentElement;

  while (parent && parent !== document.body) {
    const hasVideoOverlay = parent.querySelector(
      '[data-key-interaction="video_card"]'
    );

    const hasActionBar = parent.querySelector(
      '[data-key-interaction="action_like"]'
    );

    if (hasVideoOverlay || hasActionBar) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

function getChannelName(video = getActiveVideo()) {
  const card = getVideoCard(video);
  if (!card) return null;

  const creatorLink =
    card.querySelector(
      'a[data-e2e="video-author-avatar"][href^="/@"]'
    ) ||
    card.querySelector('a[href^="/@"]');

  if (!creatorLink) return null;

  const href = creatorLink.getAttribute("href");
  const match = href?.match(/^\/@([^/?#]+)/);

  return match
    ? `@${decodeURIComponent(match[1])}`
    : creatorLink.textContent?.trim() || null;
}

function isCurrentVideo(video) {
  return (
    video === currentVideo &&
    getVideoId(video) === currentVideoId
  );
}

// ================== VIDEO EVENT HOOK ==================
function attachVideoEvents(video) {
  if (!video || video._hooked) return;
  video._hooked = true;
  

  console.log("SWiPE X: Hooked video");

  video.addEventListener("loadedmetadata", () => {
    prevDuration = video.duration;

    // RESET FOR NEW VIDEO
    video._lazyHandled = false;

    chrome.storage.local.get("lazyMode", (data) => {
      if (!data.lazyMode) return;

      console.log("SWiPE X: Lazy mode active → full watch enabled");

      // reset per video
      video._lazyHandled = false;
      voiceCommandTriggered = false;
      watchedTime = 0;
    });
  });

  // ================== FULL WATCH END LOGIC ==================
  video.addEventListener("ended", () => {
    if (video._lazyHandled) return;
    video._lazyHandled = true;

    const videoId = getVideoId(video);

    if (startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
    }

    startTime = null;

    if (prevDuration) {
      saveEvent({
        type: "video-watched-100",
        videoId,
        src: video.currentSrc || video.src,
        timestamp: new Date().toISOString(),
        watchedTime: prevDuration.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: 100
      });
    }

    // ================== VOICE CONTROL ==================
    chrome.storage.local.get("lazyMode", (data) => {
      if (!data.lazyMode) return;

      // If voice already handled → do nothing
      if (voiceCommandTriggered) {
        voiceCommandTriggered = false;
        return;
      }

      console.log("SWiPE X: Auto swipe after full watch");
      swipeVideo();
    });
  });

  // ================== EVENTS ==================
  video.addEventListener("play", () => {
    if (!isCurrentVideo(video)) return;
    trackCommentPlaybackStarted(video);

    if (video._swipeIgnoreNextPlay) {
      video._swipeIgnoreNextPlay = false;
      startTime = Date.now();
      return;
    }
    
    setTimeout(() => {
      const videoId = getVideoId(video);

      if (!video._swipeHasPlayed) {
        saveEvent({
          type: "video-start",
          videoId,
          src: video.currentSrc || video.src,
          timestamp: new Date().toISOString()
        });

        video._swipeHasPlayed = true;
        hasPlayed = true;
      } else {
        saveEvent({
          type: "video-resume",
          videoId,
          src: video.currentSrc || video.src,
          timestamp: new Date().toISOString()
        });
      }
    }, 100);

    startTime = Date.now();
  });

  video.addEventListener("pause", () => {
    if (!isCurrentVideo(video)) return;

    trackCommentPlaybackStopped(video);

    if (startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
    }

    startTime = null;

    const videoId = getVideoId(video);

    const watchPercent = prevDuration
      ? Math.min((watchedTime / prevDuration) * 100, 100)
      : 0;

    saveEvent({
      type: "video-paused",
      videoId,
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      watchedTime: watchedTime.toFixed(2),
      duration: prevDuration.toFixed(2),
      percent: watchPercent.toFixed(1)
    });
  });

  video.addEventListener("seeked", () => {
    if (!isCurrentVideo(video)) return;

    const timeSinceVideoChange =
      Date.now() - (video._swipeActivatedAt || 0);

    // TikTok automatically changes currentTime while loading a new video.
    if (timeSinceVideoChange < 1000) return;

    const videoId = getVideoId(video);

    if (Math.abs(video.currentTime) < 0.01) return;

    saveEvent({
      type: "video-jump",
      videoId,
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      extra: {
        jumpTo: video.currentTime.toFixed(2)
      }
    });
  });
}

// ================== LIKE / UNLIKE / SHARE ==================
let commentSession = null;

function openCommentSession(video) {
  const videoId = getVideoId(video);

  if (
    commentSession &&
    commentSession.videoId === videoId
  ) {
    return;
  }

  if (commentSession) {
    closeCommentSession("reopened");
  }

  commentSession = {
    video,
    videoId,
    channelName: getChannelName(video),
    openedAt: performance.now(),
    videoWasPlayingAtOpen: !video.paused,
    playingStartedAt: video.paused
      ? null
      : performance.now(),
    playedMilliseconds: 0
  };

  queueEvent({
    type: "video-comment-opened",
    videoId,
    src: video.currentSrc || video.src,
    channelName: commentSession.channelName
  });
}

function trackCommentPlaybackStarted(video) {
  if (
    !commentSession ||
    commentSession.video !== video ||
    commentSession.playingStartedAt !== null
  ) {
    return;
  }

  commentSession.playingStartedAt =
    performance.now();
}

function trackCommentPlaybackStopped(video) {
  if (
    !commentSession ||
    commentSession.video !== video ||
    commentSession.playingStartedAt === null
  ) {
    return;
  }

  commentSession.playedMilliseconds +=
    performance.now() -
    commentSession.playingStartedAt;

  commentSession.playingStartedAt = null;
}

function closeCommentSession(reason) {
  if (!commentSession) return;

  const session = commentSession;
  commentSession = null;

  if (session.playingStartedAt !== null) {
    session.playedMilliseconds +=
      performance.now() -
      session.playingStartedAt;
  }

  queueEvent({
    type: "video-comment-closed",
    videoId: session.videoId,
    src:
      session.video.currentSrc ||
      session.video.src,
    channelName: session.channelName,
    extra: {
      commentsOpenDuration:
        (
          (performance.now() - session.openedAt) /
          1000
        ).toFixed(2),
      videoPlayedDuringComments:
        (
          session.playedMilliseconds / 1000
        ).toFixed(2),
      videoWasPlayingAtOpen:
        session.videoWasPlayingAtOpen,
      videoWasPlayingAtClose:
        !session.video.paused,
      closeReason: reason
    }
  });
}

function attachActionEvents() {
  if (window._attachActionEventsInstalled) return;
  window._attachActionEventsInstalled = true;

  document.addEventListener(
    "click",
    (event) => {
      const action = event.target.closest(
        '[data-key-interaction="action_like"], ' +
        '[data-key-interaction="action_comment"], ' +
        '[data-key-interaction="action_share"], ' +
        '[data-key-interaction="comment_close"]'
      );

      if (!action) return;

      const interaction = action.getAttribute(
        "data-key-interaction"
      );

      // Close comments immediately.
      if (interaction === "comment_close") {
        closeCommentSession("panel-closed");
        return;
      }

      const video = currentVideo;
      if (!video) return;

      // Let TikTok finish updating the interface.
      setTimeout(() => {
        if (interaction === "action_comment") {
          openCommentSession(video);
          return;
        }

        if (interaction === "action_like") {
          const isLiked =
            action.getAttribute("aria-pressed") ===
            "true";

          queueEvent({
            type: isLiked
              ? "video-like"
              : "video-unlike",
            videoId: getVideoId(video),
            src:
              video.currentSrc ||
              video.src
          });

          return;
        }

        if (interaction === "action_share") {
          queueEvent({
            type: "video-share",
            videoId: getVideoId(video),
            src:
              video.currentSrc ||
              video.src
          });
        }
      }, 50);
    },
    true
  );
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
      videoId: getVideoId(video),
      src: video.currentSrc || video.src,
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
    currentVideoId = getVideoId(video);
    checkViewport();
  });

  // Detect window resizes or fullscreen changes
  window.addEventListener("resize", checkViewport);
  document.addEventListener("fullscreenchange", checkViewport);

  // check every few seconds for subtle UI changes
  setInterval(checkViewport, 5000);
}

// ================== VIDEO RESOLUTION ======================
function getMaxResolutionAndBitrate(video = currentVideo) {
  if (!video) return null;

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) return null;

  return {
    maxRes: `${width}x${height}`,
    bitrate: null
  };
}

// ================== VIDEO RESOLUTION TRACKING ======================
function trackVideoResolution(video) {
  if (!video || video._resolutionTrackingStarted) return;
  video._resolutionTrackingStarted = true;

  let lastWidth = 0;
  let lastHeight = 0;
  let resolutionInterval = null;

  const checkResolution = (initial = false) => {
    if (!isCurrentVideo(video)) return;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    const changed =
      width !== lastWidth ||
      height !== lastHeight;

    if (!initial && !changed) return;

    const videoId = getVideoId(video);
    if (!videoId) return;

    saveEvent({
      type: initial
        ? "video-resolution"
        : "video-resolution-change",
      videoId,
      src: video.currentSrc || video.src,
      timestamp: new Date().toISOString(),
      extra: {
        width,
        height,
        current: `${width}x${height}`,
        max: `${width}x${height}`,
        bitrate: null,
        viewport: getVideoViewport(video)
      }
    });

    lastWidth = width;
    lastHeight = height;
  };

  const startTracking = () => {
    checkResolution(true);

    if (!resolutionInterval) {
      resolutionInterval = setInterval(() => {
        if (video.readyState >= 1) {
          checkResolution(false);
        }
      }, 2000);
    }
  };

  const cleanup = () => {
    if (resolutionInterval) {
      clearInterval(resolutionInterval);
      resolutionInterval = null;
    }
  };

  video.addEventListener("loadedmetadata", startTracking);
  video.addEventListener("resize", () => checkResolution(false));
  video.addEventListener("ended", cleanup);

  // Metadata may have loaded before this function was attached.
  if (video.readyState >= 1) {
    startTracking();
  }
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
          videoId: getVideoId(video),
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
          videoId:getVideoId(video),
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
let currentVideoId = null;

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

function handleVideoChange() {
  if (!userId || consent !== "yes") return;

  const activePlayer = document.querySelector(
    '[id^="xgwrapper-"][tt-tag*="_active"]'
  );

  const video = activePlayer?.querySelector("video");
  if (!video) return;

  const videoId = getVideoId(video);
  if (!videoId) return;

  if (
    commentSession &&
    (
      commentSession.video !== video ||
      commentSession.videoId !== videoId
    )
  ) {
    closeCommentSession("video-change");
  }


  // Nothing changed.
  if (videoId === currentVideoId) return;

  // Record the previous video stopping.
  if (currentVideo && currentVideoId) {
    if (startTime) {
      watchedTime +=
        (Date.now() - startTime) / 1000;

      startTime = null; 
    }
          
    const duration =
      prevDuration || currentVideo.duration || 0;

    const percent = duration
      ? Math.min(
          (watchedTime / duration) * 100,
          100
        ).toFixed(1)
      : "0";

    queueEvent({
      type: "video-stopped",
      videoId: currentVideoId,
      src:
        currentVideo.currentSrc ||
        currentVideo.src,
      watchedTime: watchedTime.toFixed(2),
      duration: duration.toFixed(2),
      percent
    });

    if (duration > 0) {
      const finalWatchedTime = watchedTime;
      const finalPercent = parseFloat(percent);

      setTimeout(() => {
        updateStats(
          finalWatchedTime,
          finalPercent,
          duration
        );
      }, 100);
    }
  }

  // Record movement to another TikTok video.
  if (currentVideoId) {
    queueEvent({
      type: "swiped-to-new-video",
      videoId,
      src: video.currentSrc || video.src,
      channelName: getChannelName(video),
      extra: {
        previousVideoId: currentVideoId
      }
    });
  }

  // Store the new active video.
  currentVideo = video;
  currentVideoId = videoId;
  video._swipeActivatedAt = Date.now();
  lastSrc = video.currentSrc || video.src;
  watchedTime = 0;
  prevDuration = video.duration || 0;
  hasPlayed = false;
  video._swipeHasPlayed = false;

  // Attach tracking once to each video element.
  if (!video._resolutionHooked) {
    video._resolutionHooked = true;

    attachStallAndStartupTracking(video);
    trackVideoResolution(video);
    trackViewportChanges(video);
    attachVideoEvents(video);
  }

  // This listener is installed only once on document.
  attachActionEvents();

  if (!video.paused) {
    startTime = Date.now();
    video._swipeHasPlayed = true;
    video._swipeIgnoreNextPlay = true;
    hasPlayed = true;

    queueEvent({
      type: "video-start",
      videoId,
      src: video.currentSrc || video.src
    });

    setTimeout(() => {
      video._swipeIgnoreNextPlay = false;
    }, 500);
  } else {
    startTime = null;
  }
  
}

const observer =
  new MutationObserver(handleVideoChange);

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["tt-tag"]
});

// Handle a video already present when the script loads.
handleVideoChange();

// ================== KEEP ACTIVE VIDEO PLAYING ==================
setInterval(() => {
  const activePlayer = document.querySelector(
    '[id^="xgwrapper-"][tt-tag*="_active"]'
  );

  const video = activePlayer?.querySelector("video");

  if (!video) return;

  chrome.storage.local.get("lazyMode", (data) => {
    if (!data.lazyMode) return;

    if (video.currentTime < 0.5 && !video.paused) {
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
    }
  });
}, 2000);


