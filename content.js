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
      This extension collects your video interaction events 
      (<b>play, pause, jumps, watch time</b>, etc.) for research purposes.<br>
      A random user ID will be stored locally to recognize you across sessions.
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


// ------------------ SURVEY (STEP 1) ------------------
const SURVEY_KEY = "swipeSurveyCompleted";       // set to "yes" when answered
const SURVEY_ANSWERS_KEY = "swipeSurveyAnswers"; // optional local backup
const SURVEY_ENDPOINT = "https://swipe-extension-server-2.onrender.com/api/surveys";

// Call this to show survey (only shows if not already present)
function showSurveyPopup() {
  if (document.getElementById("swipe-survey-popup")) return;
  if (localStorage.getItem(SURVEY_KEY) === "yes") return; // already answered

  const popup = document.createElement("div");
  popup.id = "swipe-survey-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.width = "600px";
  popup.style.maxHeight = "80vh";
  popup.style.overflowY = "auto";
  popup.style.padding = "20px";
  popup.style.background = "white";
  popup.style.border = "2px solid #444";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 6px 30px rgba(0,0,0,0.35)";
  popup.style.zIndex = "100000";
  popup.style.fontSize = "15px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.textAlign = "left";

  popup.innerHTML = `
    <h2 style="margin-top:0; font-size:20px; text-align:center;">📋 Quick Questions</h2>
    <p style="text-align:center; margin-top:0.2rem; margin-bottom:1rem;">Please answer these 6 quick, general questions. Your answers help research. (Required)</p>

    <form id="swipe-survey-form">
      <label>1) How often do you watch Shorts?</label><br>
      <select name="q1" required style="width:100%; margin-bottom:10px;">
        <option value="">-- pick one --</option>
        <option value="daily">Daily</option>
        <option value="several_times_week">Several times / week</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="rarely">Rarely</option>
      </select>

      <label>2) Primary device you watch on:</label><br>
      <select name="q2" required style="width:100%; margin-bottom:10px;">
        <option value="">-- pick one --</option>
        <option value="mobile">Mobile phone</option>
        <option value="desktop">Desktop / Laptop</option>
        <option value="tablet">Tablet</option>
        <option value="other">Other</option>
      </select>

      <label>3) What content do you prefer? (one or two words)</label><br>
      <input name="q3" required style="width:100%; margin-bottom:10px;" placeholder="e.g. comedy, reviews, music" />

      <label>4) Age range:</label><br>
      <select name="q4" required style="width:100%; margin-bottom:10px;">
        <option value="">-- pick one --</option>
        <option value="under_18">Under 18</option>
        <option value="18_24">18-24</option>
        <option value="25_34">25-34</option>
        <option value="35_44">35-44</option>
        <option value="45_plus">45+</option>
        <option value="prefer_not">Prefer not to say</option>
      </select>

      <label>5) Do you follow creators you like?</label><br>
      <select name="q5" required style="width:100%; margin-bottom:10px;">
        <option value="">-- pick one --</option>
        <option value="yes">Yes</option>
        <option value="sometimes">Sometimes</option>
        <option value="no">No</option>
      </select>

      <label>6) Any other comments? (optional)</label><br>
      <textarea name="q6" rows="3" style="width:100%; margin-bottom:12px;" placeholder="Optional free text"></textarea>

      <div style="text-align:center; margin-top:8px;">
        <button type="button" id="swipe-survey-submit" style="margin-right:12px; padding:10px 18px; font-size:15px; cursor:pointer;">Submit</button>
        <button type="button" id="swipe-survey-cancel" style="padding:10px 18px; font-size:15px; cursor:pointer;">Cancel</button>
      </div>
      <p id="swipe-survey-msg" style="color:#a00; text-align:center; margin-top:8px; display:none;"></p>
    </form>
  `;

  document.body.appendChild(popup);

  // Cancel: just close but don't mark completed (user must answer later)
  document.getElementById("swipe-survey-cancel").onclick = () => {
    popup.remove();
    console.log("[SwipeExtension] Survey cancelled (user can be asked later).");
  };

  document.getElementById("swipe-survey-submit").onclick = async () => {
    const form = document.getElementById("swipe-survey-form");
    const fd = new FormData(form);
    // required fields
    const required = ["q1","q2","q3","q4","q5"];
    for (let k of required) {
      if (!fd.get(k) || fd.get(k).trim() === "") {
        const msg = document.getElementById("swipe-survey-msg");
        msg.textContent = "Please answer all required questions (1-5).";
        msg.style.display = "block";
        return;
      }
    }

    // gather answers
    const answers = {
      q1: fd.get("q1"),
      q2: fd.get("q2"),
      q3: fd.get("q3"),
      q4: fd.get("q4"),
      q5: fd.get("q5"),
      q6: fd.get("q6") || ""
    };

    const payload = {
      userId: userId || null,
      sessionId: sessionId || null,
      answers,
      timestamp: new Date().toISOString()
    };

    // mark completed locally immediately to avoid duplicate prompts
    localStorage.setItem(SURVEY_KEY, "yes");
    localStorage.setItem(SURVEY_ANSWERS_KEY, JSON.stringify(payload)); // backup

    // Only send to server if consented to tracking
    const consentChoice = localStorage.getItem("swipeConsent");
    if (consentChoice === "yes") {
      try {
        const res = await fetch(SURVEY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          console.error("[SwipeExtension] Survey save error", await res.text());
          // we still keep local backup; you can implement retry on server side
        } else {
          console.log("[SwipeExtension] Survey saved to server ✅");
        }
      } catch (err) {
        console.error("[SwipeExtension] Survey fetch error", err);
      }
    } else {
      console.log("[SwipeExtension] Survey saved locally (user hasn't consented to server).");
    }

    // remove popup
    popup.remove();
    console.log("[SwipeExtension] Survey completed:", answers);
  };
}

// show survey automatically if user already consented and hasn't answered
if (localStorage.getItem("swipeConsent") === "yes" && localStorage.getItem(SURVEY_KEY) !== "yes") {
  // small timeout so it doesn't fight initial DOM construction
  setTimeout(showSurveyPopup, 500);
}

// when user clicks consent yes (if you set consent in code), also trigger survey
// (this assumes your consent-yes handler sets localStorage already)
const origConsentYesBtn = document.getElementById("consent-yes");
if (origConsentYesBtn) {
  origConsentYesBtn.addEventListener("click", () => {
    // If they just consented, show survey (if not answered)
    setTimeout(() => {
      if (localStorage.getItem(SURVEY_KEY) !== "yes") showSurveyPopup();
    }, 250);
  });
}

// -------------- Make MutationObserver ignore survey popup (update your existing check) --------------
// In your MutationObserver callback, replace the popup-ignore check with something like this:
function mutationIsOnlyOurPopups(mutations) {
  const popupIds = ["swipe-consent-popup", "swipe-survey-popup"];
  return mutations.every((m) => {
    if (!m.target || m.target.nodeType !== 1) return false;
    return popupIds.some(id => m.target.closest && m.target.closest(`#${id}`));
  });
}
// then at top of your observer callback:
if (document.getElementById("swipe-consent-popup") || document.getElementById("swipe-survey-popup")) {
  if (mutationIsOnlyOurPopups(mutations)) return;
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
  // Block tracking until user explicitly consents
  if (consent !== "yes") {
    console.log("[SwipeExtension] Tracking disabled or waiting for GDPR consent ❌");
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
    .then((res) => {
      if (res.ok) console.log("[SwipeExtension] Sent to server ✅");
      else console.error("[SwipeExtension] Server error ❌", res.statusText);
    })
    .catch((err) => console.error("[SwipeExtension] Fetch error ❌", err));
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


  let justEnded = false; // flag for natural completion

  video.addEventListener("timeupdate", () => {
    if (prevDuration && video.currentTime >= prevDuration - 0.5) {
      justEnded = true; // mark as ending soon
    }
  });

  video.addEventListener("ended", () => {
    if (startTime) watchedTime += (Date.now() - startTime) / 1000;
    startTime = null;
    watchedTime = 0;
    // we no longer log video-ended, just flag the rewatch
  });

  video.addEventListener("seeked", () => {
    const videoId = getVideoId();

    // ✅ handle autoplay/manual restart after natural end
    if (justEnded && Math.floor(video.currentTime) === 0) {
      saveEvent({
        type: "video-watched-100",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
        watchedTime: prevDuration.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: 100,
      });
      saveEvent({
        type: "video-rewatch",
        videoId,
        src: video.src,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SwipeExtension] ✅ Autoplay rewatch detected for ${videoId}`);
      justEnded = false; // consume flag
      return; // ⛔ prevent video-jump
    }

    // normal seek/jump
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
 // Like, Dislike and Share Buttons
function attachActionEvents() {
  const likeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(1) button'); 
  const dislikeBtn = document.querySelector('ytd-toggle-button-renderer:nth-of-type(2) button');
  const shareBtn = document.querySelector('ytd-button-renderer[button-renderer][is-icon-button] button, #share-button button');

  if (likeBtn && !likeBtn._hooked) {
    likeBtn._hooked = true;
    likeBtn.addEventListener("click", () => {
      const videoId = getVideoId();
      saveEvent({
        type: "video-like",
        videoId,
        src: currentVideo ? currentVideo.src : null,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SwipeExtension] 👍 Like event for ${videoId}`);
    });
  }

  if (dislikeBtn && !dislikeBtn._hooked) {
    dislikeBtn._hooked = true;
    dislikeBtn.addEventListener("click", () => {
      const videoId = getVideoId();
      saveEvent({
        type: "video-dislike",
        videoId,
        src: currentVideo ? currentVideo.src : null,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SwipeExtension] 👎 Dislike event for ${videoId}`);
    });
  }

  if (shareBtn && !shareBtn._hooked) {
    shareBtn._hooked = true;
    shareBtn.addEventListener("click", () => {
      const videoId = getVideoId();
      saveEvent({
        type: "video-share",
        videoId,
        src: currentVideo ? currentVideo.src : null,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SwipeExtension] 🔗 Share event for ${videoId}`);
    });
  }
}



// ================== OBSERVE VIDEO CHANGES ==================
const observer = new MutationObserver((mutations) => {
  const video = document.querySelector("video");
  if (video && video.src !== lastSrc) {
    const videoId = getVideoId();   // ✅ always fetch fresh ID here

    // Save the stop event for the previous video
    if (currentVideo && startTime) {
      watchedTime += (Date.now() - startTime) / 1000;
      saveEvent({
        type: "video-stopped",
        videoId: getVideoId(), // ⚠️ this was wrong before
        src: currentVideo.src,
        timestamp: new Date().toISOString(),
        watchedTime: watchedTime.toFixed(2),
        duration: prevDuration.toFixed(2),
        percent: prevDuration ? Math.min((watchedTime / prevDuration) * 100, 100).toFixed(1) : 0,
      });
    }

    // Log the swipe event
    if (lastSrc) {
      saveEvent({
        type: "swiped-to-new-video",
        videoId,   // ✅ new correct ID
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
observer.observe(document.body, { childList: true, subtree: true });


// ================== RE-HOOK ON URL CHANGE ==================
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const video = document.querySelector("video");
    if (video) attachVideoEvents(video);
  }
}, 100);

// also hook buttons on DOM changes
setInterval(() => {
  attachActionEvents();
}, 1000);

