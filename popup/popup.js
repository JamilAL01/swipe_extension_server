document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videos = data.videosWatched || 0;
      const totalTimeSec = data.totalWatchedTime || 0;
      const avgPercent = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];

      // ---- Basic stats ----
      document.getElementById('videos-count').textContent = videos;
      document.getElementById('watch-time').textContent = `${Math.floor(totalTimeSec / 60)} min`;
      document.getElementById('avg-percent').textContent = `${Math.round(avgPercent)}%`;

      // ---- Energy and data computations ----
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
      const totalGB = totalDataMB / 1024;
      const co2g = totalGB * 40; // ~40 g CO₂ per GB

      // ---- Display ----
      document.getElementById('data-downloaded').textContent =
        totalDataMB > 1 ? `${totalDataMB.toFixed(1)} MB` : `${(totalDataMB * 1024).toFixed(1)} KB`;
      document.getElementById('data-wasted').textContent =
        wastedDataMB > 1 ? `${wastedDataMB.toFixed(1)} MB` : `${(wastedDataMB * 1024).toFixed(1)} KB`;
      document.getElementById('co2').textContent = `${co2g.toFixed(2)} g CO₂`;

      // ---- Pie chart: Watched vs Wasted ----
      if (typeof Chart !== 'undefined' && totalDataMB > 0) {
        const ctxPie = document.getElementById('data-pie-chart').getContext('2d');
        new Chart(ctxPie, {
          type: 'pie',
          data: {
            labels: ['Watched Data', 'Wasted Data'],
            datasets: [{
              data: [watchedDataMB, wastedDataMB],
              backgroundColor: ['#4CAF50', '#E74C3C'], // green vs red
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    return `${context.label}: ${value.toFixed(1)} MB`;
                  }
                }
              }
            }
          }
        });
      }

      // ---- Watch % Line Chart ----
      if (history.length > 0 && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('watch-history-chart').getContext('2d');
        const percents = history.map(h => h.percentWatched);
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
              y: { beginAtZero: true, max: 100, title: { display: true, text: 'Watch %' } },
              x: { title: { display: true, text: 'Last Videos' } }
            },
            plugins: {
              tooltip: { mode: 'index', intersect: false },
              legend: { display: true }
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
