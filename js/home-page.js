let whatIfEvents = [];
let whatIfBedtime = null;
let whatIfMode = false;
let editingEventId = null;

// In What If mode, the forecast/list run entirely off the forked sandbox
// instead of the real log — see setMode() for where the fork happens.
function getActiveEvents() {
  return whatIfMode ? whatIfEvents : STATE.events;
}

function getActiveBedtime() {
  return whatIfMode ? whatIfBedtime : STATE.settings.targetBedtime;
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
  const enteringWhatIf = mode === 'whatif' && !whatIfMode;
  whatIfMode = mode === 'whatif';
  if (enteringWhatIf) {
    // Fork today's real events into an independent sandbox. Freely add,
    // edit, or delete anything in here — none of it touches the real log
    // or the server, and it's discarded (re-forked fresh) next time you
    // enter What If mode.
    whatIfEvents = STATE.events.map((e) => ({ ...e }));
    whatIfBedtime = STATE.settings.targetBedtime;
  }
  document.getElementById('btn-actual').classList.toggle('active', !whatIfMode);
  document.getElementById('btn-whatif').classList.toggle('active', whatIfMode);
  document.getElementById('hero-bedtime-label').classList.toggle('editable', whatIfMode);
  if (whatIfMode) {
    document.getElementById('hero-bedtime-input').value = whatIfBedtime;
  }
  renderAll();
}

function addWhatIfEventAt(type, amount, time) {
  whatIfEvents.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    amount,
    time,
  });
  whatIfEvents.sort((a, b) => a.time - b.time);
  renderAll();
}

function addWhatIfEvent(type, amount, timeStr) {
  const time = timeStr ? parseTimeStrToToday(timeStr) : new Date();
  addWhatIfEventAt(type, amount, time);
}

function updateWhatIfEvent(id, type, amount, timeStr) {
  const idx = whatIfEvents.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const time = timeStr ? parseTimeStrToToday(timeStr) : whatIfEvents[idx].time;
  whatIfEvents[idx] = { ...whatIfEvents[idx], type, amount, time };
  whatIfEvents.sort((a, b) => a.time - b.time);
  renderAll();
}

function deleteWhatIfEvent(id) {
  whatIfEvents = whatIfEvents.filter((e) => e.id !== id);
  renderAll();
}

// Routes an add to whichever view is currently selected: the real log while
// in Actual mode, the sandbox while in What If mode.
function addEventModeAware(type, amount, timeStr) {
  if (whatIfMode) {
    addWhatIfEvent(type, amount, timeStr);
  } else {
    addEvent(type, amount, timeStr);
  }
}

function deleteEventModeAware(id) {
  if (whatIfMode) {
    deleteWhatIfEvent(id);
  } else {
    deleteEvent(id);
  }
}

function setupBedtimeInput() {
  document.getElementById('hero-bedtime-input').addEventListener('change', (ev) => {
    whatIfBedtime = ev.target.value;
    renderForecast();
  });
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

function openEditModal(id) {
  const source = whatIfMode ? whatIfEvents : STATE.events;
  const event = source.find((e) => e.id === id);
  if (!event) return;
  editingEventId = id;

  document.getElementById('edit-form-type').value = event.type;
  updateEditAmountField();
  document.getElementById('edit-form-amount').value = event.amount;
  document.getElementById('edit-form-time').value = toTimeInputValue(event.time);

  document.getElementById('edit-modal-overlay').classList.add('open');
}

function closeEditModal() {
  editingEventId = null;
  document.getElementById('edit-modal-overlay').classList.remove('open');
}

function updateEditAmountField() {
  rebuildAmountField('edit-form-type', 'edit-form-amount');
  const type = document.getElementById('edit-form-type').value;
  document.getElementById('edit-form-amount-label').textContent = amountFieldLabel(TYPES[type]);
}

function saveEditModal() {
  if (!editingEventId) return;
  const type = document.getElementById('edit-form-type').value;
  const amountEl = document.getElementById('edit-form-amount');
  let amount = amountEl.value;
  if (TYPES[type].amountKind === 'number') {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount < 0) {
      amountEl.focus();
      return;
    }
  }
  const time = document.getElementById('edit-form-time').value || null;
  if (whatIfMode) {
    updateWhatIfEvent(editingEventId, type, amount, time);
  } else {
    updateEvent(editingEventId, type, amount, time);
  }
  closeEditModal();
}

function setupEditModal() {
  populateTypeSelect('edit-form-type');
  document.getElementById('edit-form-type').addEventListener('change', updateEditAmountField);
  document.getElementById('edit-form-save').addEventListener('click', saveEditModal);
  document.getElementById('edit-form-cancel').addEventListener('click', closeEditModal);

  const overlay = document.getElementById('edit-modal-overlay');
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeEditModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && overlay.classList.contains('open')) closeEditModal();
  });
}

async function init() {
  await load();
  renderQuickAdd(addEventModeAware);
  renderTypeSelect();
  setupForm();
  setupEditModal();
  setupBedtimeInput();
  renderAll();
  setInterval(renderForecast, 60 * 1000);
}

init();
