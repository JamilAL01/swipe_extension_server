// popup.js
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['videosWatched', 'totalWatchedTime', 'avgPercentWatched', 'videoHistory'], (data) => {
    const videosWatched = data.videosWatched || 0;
    const totalWatchedTime = data.totalWatchedTime || 0;
    const avgPercentWatched = data.avgPercentWatched || 0;

    document.getElementById('videos-count').textContent = videosWatched;
    document.getElementById('watch-time').textContent = `${Math.floor(totalWatchedTime / 60)} min`;
    document.getElementById('avg-percent').textContent = `${avgPercentWatched.toFixed(1)}%`;

    // Draw chart
    const ctx = document.getElementById('watchChart').getContext('2d');
    const history = data.videoHistory || [];
    const labels = history.map((v, i) => `#${i + 1}`);
    const times = history.map(v => Math.round(v.watchTime / 60)); // in minutes

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Watch Time (min)',
          data: times,
          backgroundColor: '#4F46E5'
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { display: true },
          y: { beginAtZero: true }
        }
      }
    });
  });
});
