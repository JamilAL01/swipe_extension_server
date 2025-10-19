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

      
      // === Persistent Session Timer ===
      function initializeSessionTimer() {
        const storedStart = localStorage.getItem('sessionStart');
        let sessionStart = storedStart ? Number(storedStart) : Date.now();

        // if it didn't exist, save the current time
        if (!storedStart) {
          localStorage.setItem('sessionStart', sessionStart);
        }

        function updateSessionTimer() {
          const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
          const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
          const secs = String(elapsed % 60).padStart(2, '0');
          document.getElementById('session-time').textContent = `${mins}:${secs}`;
          document.getElementById('footer-session').textContent = `${Math.floor(elapsed / 60)}m`;
        }

        setInterval(updateSessionTimer, 1000);
        updateSessionTimer();
      }

      initializeSessionTimer();

      // === Example: progress bar demo ===
      let totalWatchMinutes = 0;
      setInterval(() => {
        totalWatchMinutes = (totalWatchMinutes + 1) % 100;
        document.getElementById('progress-fill').style.width = `${totalWatchMinutes}%`;
        document.getElementById('progress-label').textContent = `${totalWatchMinutes} min watched today`;
      }, 2000);

      // === Animate value updates ===
      function flashUpdate(el) {
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 400);
      }

      // === Theme Toggle ===
      const toggleBtn = document.getElementById('theme-toggle');
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
      });

      // === Reset Stats + Timer ===
      document.getElementById('reset-stats').addEventListener('click', () => {
        localStorage.removeItem('sessionStart');
        location.reload();
      });

      chrome.storage.local.get('sessionStart', (data) => {
      let sessionStart = data.sessionStart || Date.now();
      if (!data.sessionStart) chrome.storage.local.set({ sessionStart });

      setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        document.getElementById('session-time').textContent = `${mins}:${secs}`;
        document.getElementById('footer-session').textContent = `${Math.floor(elapsed / 60)}m`;
      }, 1000);
    });




      // ================== WATCH HISTORY CHART ==================
      if (history.length > 0 && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('watch-history-chart').getContext('2d');
        const percents = history.map(h => h.percentWatched);

        // moving average window = 5
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

        const ctxPie = document.getElementById('data-pie-chart').getContext('2d');
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

      // // ================== DATA USAGE (MB) ==================
      // if (history.length > 0) {
      //   let totalWatchedMB = 0;
      //   let totalWastedMB = 0;

      //   history.forEach(v => {
      //     if (!v.duration || !v.percentWatched || !v.currentBitrate) return;

      //     // bitrate (bits/s) → MB/s
      //     const bitrateMBps = v.currentBitrate / (8 * 1024 * 1024);
      //     const totalDataMB = v.duration * bitrateMBps;
      //     const watchedMB = totalDataMB * (v.percentWatched / 100);
      //     const wastedMB = totalDataMB - watchedMB;

      //     totalWatchedMB += watchedMB;
      //     totalWastedMB += wastedMB;
      //   });

      //   totalWatchedMB = totalWatchedMB.toFixed(2);
      //   totalWastedMB = totalWastedMB.toFixed(2);
      //   const total = parseFloat(totalWatchedMB) + parseFloat(totalWastedMB);
      //   const usagePercent = total > 0 ? (100 * totalWatchedMB / total).toFixed(1) : 0;

      //   const watchedEl = document.getElementById('watchedMB');
      //   const wastedEl = document.getElementById('wastedMB');
      //   const barEl = document.getElementById('data-bar');
      //   if (watchedEl && wastedEl && barEl) {
      //     watchedEl.textContent = totalWatchedMB;
      //     wastedEl.textContent = totalWastedMB;
      //     barEl.style.width = `${usagePercent}%`;
      //   }

      //   chrome.storage.local.set({
      //     watchedMB: totalWatchedMB,
      //     wastedMB: totalWastedMB,
      //     dataUsagePercent: usagePercent
      //   });
      // }
    }
  );

  document.getElementById('reset-stats').addEventListener('click', () => {
    chrome.storage.local.clear(() => location.reload());
  });
});
