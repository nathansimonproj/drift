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
  document.getElementById('whatif-panel').style.display = whatIfMode ? 'block' : 'none';
  renderForecast();
}

function addWhatIfEvent(type, amount, timeStr) {
  const time = timeStr ? parseTimeStrToToday(timeStr) : new Date();
  whatIfEvents.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    amount,
    time,
  });
  whatIfEvents.sort((a, b) => a.time - b.time);
  renderForecast();
  renderWhatIfEventsList();
}

function deleteWhatIfEvent(id) {
  whatIfEvents = whatIfEvents.filter(e => e.id !== id);
  renderForecast();
  renderWhatIfEventsList();
}

function clearWhatIf() {
  whatIfEvents = [];
  renderForecast();
  renderWhatIfEventsList();
}

// Amount field helpers (mirrors the log form logic for the what-if form)
function updateWhatIfAmountField() {
  const type = document.getElementById('whatif-type').value;
  const amountEl = document.getElementById('whatif-amount');
  const t = TYPES[type];
  let newEl;
  if (t.amountKind === 'intensity') {
    newEl = makeAmountSelect(INTENSITY_OPTS, t.defaultAmount);
  } else if (t.amountKind === 'size') {
    newEl = makeAmountSelect(SIZE_OPTS, t.defaultAmount);
  } else if (t.amountKind === 'variant') {
    newEl = makeVariantSelect(t.options, t.defaultAmount);
  } else {
    newEl = makeAmountNumber(t.defaultAmount, t.unit);
  }
  newEl.id = 'whatif-amount';
  amountEl.replaceWith(newEl);
}

function makeAmountSelect(opts, def) {
  const sel = document.createElement('select');
  for (const o of opts) {
    const op = document.createElement('option');
    op.value = o;
    op.textContent = o.charAt(0).toUpperCase() + o.slice(1);
    if (o === def) op.selected = true;
    sel.appendChild(op);
  }
  return sel;
}

function makeVariantSelect(options, def) {
  const sel = document.createElement('select');
  for (const o of options) {
    const op = document.createElement('option');
    op.value = o.value;
    op.textContent = o.label;
    if (o.value === def) op.selected = true;
    sel.appendChild(op);
  }
  return sel;
}

function makeAmountNumber(def, placeholder) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = def;
  input.min = 0;
  input.step = 'any';
  input.placeholder = `Amount (${placeholder})`;
  return input;
}

function renderWhatIfQuickAdd() {
  renderQuickAddInto(
    document.getElementById('whatif-quick-add'),
    ['coffee', 'energy_drink', 'soda', 'marijuana', 'nap', 'alcohol'],
    addWhatIfEvent
  );
}

function renderWhatIfTypeSelect() {
  const sel = document.getElementById('whatif-type');
  sel.innerHTML = '';
  for (const [key, t] of Object.entries(TYPES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = t.label;
    sel.appendChild(opt);
  }
  updateWhatIfAmountField();
}

function renderWhatIfEventsList() {
  const ul = document.getElementById('whatif-events-list');
  if (whatIfEvents.length === 0) {
    ul.innerHTML = '<li class="empty-state">No hypothetical events yet.</li>';
    return;
  }
  ul.innerHTML = '';
  for (const e of [...whatIfEvents].sort((a, b) => b.time - a.time)) {
    const d = describeEvent(e);
    if (!d) continue;
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="evt-time">${fmtTime(e.time)}</span>
      <span><span class="evt-name">${d.name}</span><span class="evt-meta">${d.amountLabel}</span></span>
      <span></span>
      <button class="evt-delete" title="Remove">×</button>
    `;
    li.querySelector('.evt-delete').addEventListener('click', () => deleteWhatIfEvent(e.id));
    ul.appendChild(li);
  }
}

function setupWhatIfForm() {
  renderWhatIfQuickAdd();
  renderWhatIfTypeSelect();
  document.getElementById('whatif-type').addEventListener('change', updateWhatIfAmountField);
  document.getElementById('whatif-add').addEventListener('click', () => {
    const type = document.getElementById('whatif-type').value;
    const amountEl = document.getElementById('whatif-amount');
    let amount = amountEl.value;
    if (TYPES[type].amountKind === 'number') {
      amount = parseFloat(amount);
      if (isNaN(amount) || amount < 0) { amountEl.focus(); return; }
    }
    const time = document.getElementById('whatif-time').value || null;
    addWhatIfEvent(type, amount, time);
  });
  renderWhatIfEventsList();
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
    addEvent(type, amount, time);
  });
}

function init() {
  load();
  renderQuickAdd();
  renderTypeSelect();
  setupForm();
  setupWhatIfForm();
  renderAll();
  setInterval(renderForecast, 60 * 1000);
}

init();
