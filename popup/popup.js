// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025, SWiPE X / COATI-DIANA

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(
    ['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'],
    (data) => {
      const videos = data.videosWatched || 0;
      const totalTimeSec = data.totalWatchedTime || 0;
      const avgPercent = data.avgPercentWatched || 0;
      const history = data.videoHistory || [];
      const lazyButton = document.getElementById("lazy-toggle");
      const micStatus = document.getElementById("mic-status");
      const emoji = document.getElementById("lazy-emoji");

      document.getElementById('videos-count').textContent = videos;
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

      // Initialize Lazy Mode button
      chrome.storage.local.get("lazyMode", (data) => {
        const active = data.lazyMode || false;
        updateUI(active);
      });

      lazyButton.addEventListener("click", () => {
        chrome.storage.local.get("lazyMode", (data) => {
          const newState = !data.lazyMode;

          chrome.storage.local.set({ lazyMode: newState });

          updateUI(newState);

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { lazyMode: newState });
          });

          // 🔥 SHOW ONLY WHEN ENABLING
          if (newState) {
            showLazyModeModal();
          }
        });
      });

      function updateUI(active) {
        lazyButton.style.background = active ? "#ef4444" : "#ffa950";

        if (active) {
      
          lazyButton.textContent = "Disable Lazy Mode";
          micStatus.style.display = "block";

          // existing mic message
          micStatus.textContent = "🎤 The mic is yours";

          emoji.textContent = "🦥";
          emoji.classList.remove("sleepy");
          emoji.classList.add("glow");
          emoji.classList.add("bounce");

        } else {
          lazyButton.textContent = "Enable Lazy Mode";
          micStatus.style.display = "none";

          emoji.textContent = "🦥";
          emoji.classList.remove("glow");
          emoji.classList.remove("bounce");
        }
      }

      function showLazyModeModal() {
        const modal = document.getElementById("lazy-info-modal");
        modal.style.display = "flex";
      }

      function closeLazyModeModal() {
        const modal = document.getElementById("lazy-info-modal");
        modal.style.display = "none";
      }

      document
        .getElementById("close-lazy-modal")
        .addEventListener("click", closeLazyModeModal);

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
        document.getElementById('watched-time').textContent = `${Math.round(totalWatchedSec)} s`;
        document.getElementById('wasted-time').textContent = `${Math.round(wastedSec)} s`;
        document.getElementById('watch-time').textContent = `${Math.round(totalWatchedSec / 60)} min`;

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

      // ================== EXPORT CSV ==================
      const exportBtn = document.getElementById("export-csv");

      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          chrome.storage.local.get(["videoHistory"], (data) => {
            const history = data.videoHistory || [];

            if (!history.length) {
              alert("No data available to export.");
              return;
            }

            const headers = [
              "Video",
              "Timestamp",
              "Duration",
              "Percent Watched",
              "Watch Time"
            ];

            const rows = history.map((v, index) => [
              `Video ${index + 1}`,
              v.timestamp || "",
              v.duration || 0,
              v.percentWatched || 0,
              v.watchedTime = (v.duration * (v.percentWatched / 100)) || 0
            ]);

            const csvContent = [
              headers.join(","),
              ...rows.map(r =>
                r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
              )
            ].join("\n");

            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;"
            });

            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;

            // ================== FIXED FILE NAME ==================
            chrome.storage.local.get(["swipeUserId"], (res) => {
            const shortUserId = (res.swipeUserId || "unknown")
              .toString()
              .slice(0, 8);

            const now = new Date();

            a.download =
              `swipex-data-${shortUserId}-${
                now.getFullYear()
              }-${
                String(now.getMonth() + 1).padStart(2, "0")
              }-${
                String(now.getDate()).padStart(2, "0")
              }.csv`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
          });
        });
      }
      function updateLazyUI(active) {
        lazyButton.textContent = active ? "Disable Lazy Mode" : "Enable Lazy Mode ";
        lazyButton.style.background = active ? "#ef4444" : "#fda980";
        lazyButton.style.color = "#fff";
        lazyButton.style.transform = active ? "scale(1.05)" : "scale(1)";
      }
    }
  );
});

