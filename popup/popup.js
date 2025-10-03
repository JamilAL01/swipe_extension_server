document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched'],
    (data) => {
      const videosWatched = data.videosWatched || 0;
      const totalWatchedTime = data.totalWatchedTime || 0;
      const avgPercentWatched = data.avgPercentWatched || 0;

      document.getElementById('videos-count').textContent = videosWatched;

      const minutes = Math.floor(totalWatchedTime / 60);
      document.getElementById('watch-time').textContent = `${minutes} min`;

      document.getElementById('avg-percent').textContent = `${avgPercentWatched.toFixed(1)}%`;
    }
  );
});
