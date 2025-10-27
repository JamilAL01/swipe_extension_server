document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videos = data.videosWatched || 0;
      const totalTimeSec = data.totalWatchedTime || 0;
      const avgPercent = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];

      document.getElementById('videos-count').textContent = videos;
      document.getElementById('watch-time').textContent = `${Math.floor(totalTimeSec / 60)} min`;
      document.getElementById('avg-percent').textContent = `${Math.round(avgPercent)}%`;

      // ================== THEME COLORS ==================
      function getChartColors() {
        const isDark = document.body.classList.contains('dark');
        return {
          text: isDark ? '#ffffff' : '#000000',
          grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        };
      }

      // ================== THEME TOGGLE ==================
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          document.body.classList.toggle('dark');
          toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
          updateChartColors();
        });
      }

      // ================== RESET STATS ==================
      const resetBtn = document.getElementById('reset-stats');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          chrome.storage.local.clear(() => location.reload());
        });
      }

      let historyChart, pieChart;

      // ================== WATCH HISTORY CHART ==================
      if (history.length > 0 && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('watch-history-chart').getContext('2d');
        const percents = history.map(h => h.percentWatched);

        const movingAvg = percents.map((val, i, arr) => {
          const start = Math.max(0, i - 4);
          const window = arr.slice(start, i + 1);
          return window.reduce((sum, v) => sum + v, 0) / window.length;
        });

        const colors = getChartColors();

        historyChart = new Chart(ctx, {
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
                title: { display: true, text: 'Watch %', color: colors.text },
                ticks: { color: colors.text },
                grid: { color: colors.grid }
              },
              x: {
                title: { display: true, text: 'Video index', color: colors.text },
                ticks: { color: colors.text },
                grid: { color: colors.grid }
              }
            },
            plugins: {
              tooltip: { mode: 'index', intersect: false },
              legend: {
                display: true,
                labels: { color: colors.text }
              }
            }
          }
        });
      }

      // ================== WATCHED vs WASTED TIME PIE ==================
      if (history.length > 0) {
        let totalAvailableSec = 0;
        let totalWatchedSec = 0;

        history.forEach(v => {
          if (!v.duration || !v.percentWatched) return;
          totalAvailableSec += v.duration;
          totalWatchedSec += v.duration * (v.percentWatched / 100);
        });

        const wastedSec = Math.max(totalAvailableSec - totalWatchedSec, 0);
        document.getElementById('watched-time-sec').textContent = `${Math.round(totalWatchedSec)} s`;
        document.getElementById('wasted-time').textContent = `${Math.round(wastedSec)} s`;

        const ctxPie = document.getElementById('data-pie-chart').getContext('2d');
        const colors = getChartColors();

        pieChart = new Chart(ctxPie, {
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
              legend: {
                position: 'bottom',
                labels: { color: colors.text }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)} s`
                }
              }
            }
          }
        });
      }

      // ================== UPDATE CHART COLORS ON THEME CHANGE ==================
      function updateChartColors() {
        const colors = getChartColors();

        [historyChart, pieChart].forEach(chart => {
          if (!chart) return;
          if (chart.options.scales) {
            for (const axis in chart.options.scales) {
              chart.options.scales[axis].title.color = colors.text;
              chart.options.scales[axis].ticks.color = colors.text;
              chart.options.scales[axis].grid.color = colors.grid;
            }
          }
          if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = colors.text;
          }
          chart.update();
        });
      }
    }
  );
});
