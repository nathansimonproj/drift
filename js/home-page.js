let whatIfEvents = [];
let whatIfMode = false;

function getActiveEvents() {
  return whatIfMode ? STATE.events.concat(whatIfEvents) : STATE.events;
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/pages/login.html';
}

function renderAll() {
  renderEventsList();
  renderForecast();
}

function setMode(mode) {
  whatIfMode = mode === 'whatif';
  document.getElementById('btn-actual').classList.toggle('active', !whatIfMode);
  document.getElementById('btn-whatif').classList.toggle('active', whatIfMode);
  renderAll();
}

// Hypothetical events reset on reload since they're only ever kept in memory
// (never passed to save()), so there's no separate "clear" affordance needed.
function addWhatIfEvent(type, amount, timeStr) {
  const time = timeStr ? parseTimeStrToToday(timeStr) : new Date();
  whatIfEvents.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    amount,
    time,
  });
  whatIfEvents.sort((a, b) => a.time - b.time);
  renderAll();
}

function deleteWhatIfEvent(id) {
  whatIfEvents = whatIfEvents.filter((e) => e.id !== id);
  renderAll();
}

// Routes an add to whichever view is currently selected: the real log while
// in Actual mode, the hypothetical list while in What If mode.
function addEventModeAware(type, amount, timeStr) {
  if (whatIfMode) {
    addWhatIfEvent(type, amount, timeStr);
  } else {
    addEvent(type, amount, timeStr);
  }
}

function setupForm() {
  const typeSel = document.getElementById('form-type');
  typeSel.addEventListener('change', updateAmountField);

  document.getElementById('form-add').addEventListener('click', () => {
    const type = typeSel.value;
    const amountEl = document.getElementById('form-amount');
    let amount = amountEl.value;
    if (TYPES[type].amountKind === 'number') {
      amount = parseFloat(amount);
      if (isNaN(amount) || amount < 0) {
        amountEl.focus();
        return;
      }
    }
    const time = document.getElementById('form-time').value || null;
    addEventModeAware(type, amount, time);
  });
}

async function init() {
  await load();
  renderQuickAdd(addEventModeAware);
  renderTypeSelect();
  setupForm();
  renderAll();
  setInterval(renderForecast, 60 * 1000);
}

init();
