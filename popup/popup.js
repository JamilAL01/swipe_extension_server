document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videos = data.videosWatched || 0;
      const totalTimeSec = data.totalWatchedTime || 0;
      const avgPercent = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];

      // Update stats
      document.getElementById('videos-count').textContent = videos;
      document.getElementById('watch-time').textContent = `${Math.floor(totalTimeSec / 60)} min`;
      document.getElementById('avg-percent').textContent = `${Math.round(avgPercent)}%`;

      // --- Mini line chart: last 10 percentWatched ---
      if (history.length > 0 && typeof Chart !== 'undefined') {
        const last10 = history.slice(-10); // take last 10 videos
        const ctx = document.getElementById('percent-history-chart').getContext('2d');

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: last10.map((_, i) => i + 1), // simple 1..10 x-axis
            datasets: [{
              label: '% Watched',
              data: last10.map(h => h.percentWatched),
              fill: false,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.3,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            animation: { duration: 500 },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Percent Watched (%)' }
              },
              x: {
                title: { display: true, text: 'Last 10 Videos' }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }
  );

  // Reset button
  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => location.reload());
  });
});
