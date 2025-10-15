// Save a session_id when extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ session_id: crypto.randomUUID() });
});

// Function to POST event to backend
async function postEvent(event) {
  try {
    await fetch("https://swipe-extension-server-2.onrender.com:4000/v1/events", {   
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

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes("videoplayback")) {
      const size = details.responseHeaders
        ? parseInt(details.responseHeaders.find(h => h.name.toLowerCase() === 'content-length')?.value || 0)
        : 0;

      chrome.tabs.sendMessage(details.tabId, { type: 'segmentCompleted', size });
    }
  },
  { urls: ["*://*.youtube.com/videoplayback*"] },
  ["responseHeaders"]
);


// Track how many relevant tabs are open (e.g. YouTube)
let trackedTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    trackedTabs.add(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove the closed tab from the set
  trackedTabs.delete(tabId);

  // If no tracked tabs remain, reset stats
  if (trackedTabs.size === 0) {
    // chrome.storage.local.clear(() => {
    //   console.log("[SwipeExtension] Stats reset because all YouTube tabs were closed");
    // });
  }
});


