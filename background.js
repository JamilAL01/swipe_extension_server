// Save a session_id when extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ session_id: crypto.randomUUID() });
});

// Function to POST event to backend
async function postEvent(event) {
  try {
    await fetch("http://138.96.49.105:4000/v1/events", {   
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error(" postEvent failed:", err);
  }
}

// Listen for events from content.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "LOG_EVENT") {
    chrome.storage.local.get("session_id", ({ session_id }) => {
      postEvent({ session_id, ...msg.payload });
    });
  }
});

// background.js
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log("[SwipeExtension] ✅ Stats automatically reset on new browser session");
  });
});

