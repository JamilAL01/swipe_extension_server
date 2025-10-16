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

      // ================== WATCHED vs WASTED DATA (MB) ==================
      if (history.length > 0) {
        let totalWatchedMB = 0;
        let totalWastedMB = 0;

        history.forEach(v => {
          if (!v.extra || v.extra.watchedMB === undefined || v.extra.wastedMB === undefined) return;
          totalWatchedMB += v.extra.watchedMB;
          totalWastedMB += v.extra.wastedMB;
        });

        // Update UI text
        const watchedEl = document.getElementById('watched-time');
        const wastedEl = document.getElementById('wasted-time');
        if (watchedEl) watchedEl.textContent = `Watched: ${totalWatchedMB.toFixed(2)} MB`;
        if (wastedEl) wastedEl.textContent = `Wasted: ${totalWastedMB.toFixed(2)} MB`;


        // Draw SAME pie chart but for MB
        const ctxPie = document.getElementById('data-pie-chart').getContext('2d');
        new Chart(ctxPie, {
          type: 'pie',
          data: {
            labels: ['Watched Data', 'Wasted Data'],
            datasets: [{
              data: [totalWatchedMB, totalWastedMB],
              backgroundColor: ['#4CAF50', '#E74C3C'], // same green/red
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(2)} MB`
                }
              }
            }
          }
        });
      }
    }
  );

  // ================== RESET BUTTON ==================
  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => location.reload());
  });
});
