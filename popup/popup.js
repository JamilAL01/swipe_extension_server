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
        const ctx = document.getElementById('watch-history-chart')?.getContext?.('2d');
        if (ctx) {
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

      // ================== WATCHED vs WASTED TIME ==================
      if (history.length > 0) {
        let totalAvailableSec = 0;
        let totalWatchedSec = 0;

        history.forEach(v => {
          if (!v.duration || !v.percentWatched) return;
          totalAvailableSec += v.duration;
          totalWatchedSec += v.duration * (v.percentWatched / 100);
        });

        const wastedSec = Math.max(totalAvailableSec - totalWatchedSec, 0);
        document.getElementById('watched-time').textContent = `${Math.round(totalWatchedSec)} s`;
        document.getElementById('wasted-time').textContent = `${Math.round(wastedSec)} s`;

        const ctxPie = document.getElementById('data-pie-chart')?.getContext?.('2d');
        if (ctxPie) {
          new Chart(ctxPie, {
            type: 'pie',
            data: {
              labels: ['Watched Time', 'Wasted Time'],
              datasets: [{
                data: [totalWatchedSec, wastedSec],
                backgroundColor: ['#4CAF50', '#E74C3C'],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)} s` } }
              }
            }
          });
        }
      }

      // ================== CO₂ EMISSIONS PIE ==================
      if (history.length > 0) {
        let totalWatchedMB = 0;
        let totalWastedMB = 0;

        history.forEach(v => {
          if (!v.duration || !v.percentWatched || !v.currentBitrate) return;
          // bitrate (bits/s) → MB/s
          const bitrateMBps = v.currentBitrate / (8 * 1024 * 1024);
          const totalDataMB = v.duration * bitrateMBps;
          const watchedMB = totalDataMB * (v.percentWatched / 100);
          const wastedMB = totalDataMB - watchedMB;
          totalWatchedMB += watchedMB;
          totalWastedMB += wastedMB;
        });

        // Convert MB → grams CO₂ (approx. 0.055 g per MB streamed)
        const co2Factor = 0.055;
        const co2Watched = totalWatchedMB * co2Factor;
        const co2Wasted = totalWastedMB * co2Factor;

        const ctxCO2 = document.getElementById('co2-pie-chart')?.getContext?.('2d');
        if (ctxCO2) {
          new Chart(ctxCO2, {
            type: 'pie',
            data: {
              labels: ['Watched CO₂', 'Wasted CO₂'],
              datasets: [{
                data: [co2Watched, co2Wasted],
                backgroundColor: ['#10B981', '#F87171'],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(2)} g`
                  }
                }
              }
            }
          });
        }

        // Update text below pie
        const watchedEl = document.getElementById('co2-watched');
        const wastedEl = document.getElementById('co2-wasted');
        if (watchedEl && wastedEl) {
          watchedEl.textContent = `Watched: ${co2Watched.toFixed(2)} g`;
          wastedEl.textContent = `Wasted: ${co2Wasted.toFixed(2)} g`;
        }
      }
    }
  );

  // ================== RESET ==================
  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => location.reload());
  });
});
