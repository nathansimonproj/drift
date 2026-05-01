async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/pages/login.html';
}

// Needed because state.js calls renderAll() after addEvent/deleteEvent.
function renderAll() {
  renderForecast();
}

function init() {
  load();
  renderForecast();
  setInterval(renderForecast, 60 * 1000);
}

init();
