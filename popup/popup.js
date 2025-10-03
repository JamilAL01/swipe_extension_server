document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['stats'], (data) => {
    const stats = data.stats || {
      totalVideos: 0,
      totalWatchTime: 0, // in seconds
      totalWatchPercent: 0,
      totalWatchEntries: 0
    };

    document.getElementById('videos-count').textContent = stats.totalVideos;

    const minutes = Math.floor(stats.totalWatchTime / 60);
    document.getElementById('watch-time').textContent = `${minutes} min`;

    const avgPercent = stats.totalWatchEntries > 0
      ? Math.round(stats.totalWatchPercent / stats.totalWatchEntries)
      : 0;
    document.getElementById('avg-percent').textContent = `${avgPercent}%`;
  });
});
