document.addEventListener('DOMContentLoaded', () => {
  // Load stats
  chrome.storage.local.get(['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'watchHistory'], (data) => {
    const videos = data.videosWatched || 0;
    const totalTimeSec = data.totalWatchedTime || 0;
    const avgPercent = data.avgPercentWatched || 0;
    const history = data.watchHistory || [];

    document.getElementById('videos-count').textContent = videos;
    document.getElementById('watch-time').textContent = `${Math.floor(totalTimeSec / 60)} min`;
    document.getElementById('avg-percent').textContent = `${Math.round(avgPercent)}%`;

    // Chart rendering
    if (history.length > 0 && typeof Chart !== 'undefined') {
      const ctx = document.getElementById('watch-history-chart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: history.map(h => h.label),
          datasets: [{
            label: 'Watch time (min)',
            data: history.map(h => h.minutes),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          }]
        },
        options: {
          responsive: true,
          animation: { duration: 800 },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Minutes' }
            }
          }
        }
      });
    } else {
      console.log("[SwipeExtension] No watch history to display in chart.");
    }
  });

  // Reset button handler
  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      console.log("[SwipeExtension] Stats cleared manually");
      location.reload();
    });
  });
});
