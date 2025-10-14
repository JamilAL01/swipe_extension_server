document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videos = data.videosWatched || 0;
      const totalTimeSec = data.totalWatchedTime || 0;
      const avgPercent = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];

      // ================== BASIC STATS ==================
      document.getElementById('videos-count').textContent = videos;
      document.getElementById('watch-time').textContent = `${Math.floor(totalTimeSec / 60)} min`;
      document.getElementById('avg-percent').textContent = `${Math.round(avgPercent)}%`;

      // ================== WATCH HISTORY CHART ==================
      if (history.length > 0 && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('watch-history-chart').getContext('2d');

        const percents = history.map(h => h.percentWatched);

        // Simple moving average (window = 5)
        const movingAvg = percents.map((val, i, arr) => {
          const start = Math.max(0, i - 4);
          const window = arr.slice(start, i + 1);
          return window.reduce((sum, v) => sum + v, 0) / window.length;
        });

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: history.map((_, i) => i + 1),
            datasets: [
              {
                label: '% Watched',
                data: percents,
                borderColor: 'steelblue',
                backgroundColor: 'rgba(54,162,235,0.2)',
                fill: true,
                tension: 0.2,
                pointRadius: 5
              },
              {
                label: 'Moving Avg (5)',
                data: movingAvg,
                borderColor: 'orange',
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            animation: { duration: 800 },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Watch %' }
              },
              x: {
                title: { display: true, text: 'Last Videos' }
              }
            },
            plugins: {
              tooltip: { mode: 'index', intersect: false },
              legend: { display: true }
            }
          }
        });
      }

      // ================== DATA WATCHED / WASTED ==================
      if (history.length > 0) {
        let totalDataMB = 0;
        let watchedDataMB = 0;

        history.forEach(v => {
          if (!v.duration || !v.bitrate) return;
          const totalMB = (v.bitrate * v.duration) / (8 * 1e6); // bits → MB
          const watchedMB = totalMB * (v.percentWatched / 100);
          totalDataMB += totalMB;
          watchedDataMB += watchedMB;
        });

        const wastedDataMB = Math.max(totalDataMB - watchedDataMB, 0);

        // Update UI
        document.getElementById('data-watched').textContent = `${watchedDataMB.toFixed(1)} MB`;
        document.getElementById('data-wasted').textContent = `${wastedDataMB.toFixed(1)} MB`;

        // Pie Chart
        const ctxPie = document.getElementById('data-pie-chart').getContext('2d');
        new Chart(ctxPie, {
          type: 'pie',
          data: {
            labels: ['Watched Data', 'Wasted Data'],
            datasets: [{
              data: [watchedDataMB, wastedDataMB],
              backgroundColor: ['#4CAF50', '#E74C3C'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)} MB`
                }
              }
            }
          }
        });
      }
    }
  );

  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => location.reload());
  });
});
