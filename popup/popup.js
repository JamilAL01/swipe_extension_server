document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["videosWatched", "totalWatchedTime", "avgPercentWatched"],
    (data) => {
      document.getElementById("videosWatched").textContent =
        data.videosWatched || 0;
      document.getElementById("totalWatchedTime").textContent =
        data.totalWatchedTime ? data.totalWatchedTime.toFixed(2) : 0;
      document.getElementById("avgPercentWatched").textContent =
        data.avgPercentWatched ? data.avgPercentWatched.toFixed(1) + "%" : "0%";
    }
  );
});
