document.addEventListener('DOMContentLoaded', () => {
  const videosCountEl = document.getElementById('videos-count');
  const watchTimeEl = document.getElementById('watch-time');
  const avgPercentEl = document.getElementById('avg-percent');
  const resetBtn = document.getElementById('reset-btn');
  let chartInstance = null;

  // Load and render stats
  function renderStats() {
    chrome.storage.local.get(
      ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
      (data) => {
        const videosWatched = data.videosWatched || 0;
        const totalWatchedTime = data.totalWatchedTime || 0;
        const avgPercentWatched = data.avgPercentWatched || 0;
        const history = data.videoHistory || [];

        // Update metrics
        videosCountEl.textContent = videosWatched;
        watchTimeEl.textContent = `${Math.floor(totalWatchedTime / 60)} min`;
        avgPercentEl.textContent = `${avgPercentWatched.toFixed(1)}%`;

        // Render bar chart
        const ctx = document.getElementById('watchChart').getContext('2d');

        // Destroy previous chart if exists
        if (chartInstance) {
          chartInstance.destroy();
        }

        if (history.length === 0) return;

        const labels = history.map((_, i) => `#${i + 1}`);
        const times = history.map(v => Math.round(v.watchTime / 60));

        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Watch Time (min)',
              data: times,
              backgroundColor: '#4F46E5',
              borderRadius: 4
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
            animation: {
              duration: 800,
              easing: 'easeOutCubic'
            },
            scales: {
              x: {
                ticks: { color: '#374151' }
              },
              y: {
                beginAtZero: true,
                ticks: { color: '#374151' }
              }
            }
          }
        });
      }
    );
  }

  // Reset stats
  resetBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      renderStats();
    });
  });

  renderStats();
});
