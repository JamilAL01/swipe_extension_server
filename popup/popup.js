document.addEventListener('DOMContentLoaded', () => {
  const statsDiv = document.getElementById('stats');

  chrome.storage.local.get({stats: {}}, ({stats}) => {
    if (Object.keys(stats).length === 0) {
      statsDiv.textContent = "No stats collected yet.";
      return;
    }

    for (const [videoId, data] of Object.entries(stats)) {
      const div = document.createElement('div');
      div.innerHTML = `
        <b>Video ID:</b> ${videoId} <br>
        <b>Events:</b> ${data.count} <br>
        <b>Watched time:</b> ${data.watchedTime.toFixed(2)}s <br>
        <b>Resolutions:</b> ${data.resolutions.map(r => r.current + " / " + r.max).join(", ")} <br><hr>
      `;
      statsDiv.appendChild(div);
    }
  });
});
