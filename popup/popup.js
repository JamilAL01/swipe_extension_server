document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videosWatched = data.videosWatched || 0;
      const totalWatchedTime = data.totalWatchedTime || 0;
      const avgPercentWatched = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];

      // 🧮 Update text stats
      document.getElementById('videos-count').textContent = videosWatched;
      document.getElementById('watch-time').textContent = `${Math.floor(totalWatchedTime / 60)} min`;
      document.getElementById('avg-percent').textContent = `${avgPercentWatched.toFixed(1)}%`;

      // 🎨 Build chart data (last N videos)
      const labels = history.map((_, i) => `#${i + 1}`);
      const times = history.map(v => Math.round(v.watchTime / 60)); // in minutes

      if (labels.length > 0) {
        const ctx = document.getElementById('watchChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Watch Time (min)',
              data: times,
              backgroundColor: '#4F46E5',
              borderRadius: 5
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.parsed.y} min`
                }
              }
            },
            scales: {
              x: { display: true },
              y: { beginAtZero: true }
            }
          }
        });
      }
    }
  );
});
