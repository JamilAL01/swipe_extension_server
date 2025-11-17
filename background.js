// Save a session_id when extension starts
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ session_id: crypto.randomUUID() });
});

const GATEWAY_URL = "https://swipex.inria.fr"; 
const API_KEY = "205aeeaf6a910355d142789b7ff53b2b5219120edb6f43b724aa3d2e473836bd";

// Function to send event to gateway
async function postEvent(event) {
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify(event),
    });

    console.log("[DEBUG] Response status:", res.status);

    let data;
    try { data = await res.json(); } 
    catch { data = "<not JSON>"; }

    console.log("[Event sent ✅]", data);

  } catch (err) {
    console.error("[Event error ❌]", err);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "event") {
    postEvent(msg.data);
  }
});

// Listen for events from content.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "LOG_EVENT") {
    chrome.storage.local.get("session_id", ({ session_id }) => {
      postEvent({ session_id, ...msg.payload });
    });
  }
});

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

// send notification
const UPDATE_CHECK_INTERVAL_HOURS = 6;
const VERSION_URL = 'https://raw.githubusercontent.com/JamilAL01/swipe_extension_server/main/version.json';
const CURRENT_VERSION = chrome.runtime.getManifest().version;

// Compare semantic versions
function isNewerVersion(latest, current) {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
}

async function checkForUpdates() {
  try {
    const res = await fetch(VERSION_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Cannot fetch version.json');
    const info = await res.json();

    if (isNewerVersion(info.latest, CURRENT_VERSION)) {
      console.log(`[Update Checker] New version ${info.latest} available (current ${CURRENT_VERSION})`);

      // Save info for popup or dashboard (optional)
      chrome.storage.local.set({ updateInfo: info, updateAvailable: true });

      // Show Chrome notification
      chrome.notifications.create('update_available', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon-1.png'),
        title: 'New Version Available!',
        message: info.message || `A new version (${info.latest}) is available.`,
        priority: 2
      });


      // Handle click → open GitHub release
      chrome.notifications.onClicked.addListener((id) => {
        if (id === 'update_available') {
          chrome.tabs.create({ url: info.changelog || 'https://raw.githubusercontent.com/JamilAL01/swipe_extension_server' });
          chrome.notifications.clear(id);
        }
      });
    } else {
      console.log('[Update Checker] You are on the latest version.');
    }
  } catch (err) {
    console.error('[Update Checker] Error:', err);
  }
}

// Run once on startup or install
chrome.runtime.onInstalled.addListener(checkForUpdates);
chrome.runtime.onStartup.addListener(checkForUpdates);

// Periodic check (every few hours)
setInterval(checkForUpdates, 1000 * 60 * 60 * UPDATE_CHECK_INTERVAL_HOURS);
