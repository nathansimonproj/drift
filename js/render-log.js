function renderQuickAdd() {
  const el = document.getElementById("quick-add");
  el.innerHTML = "";
  for (const key of ["coffee", "energy_drink", "marijuana", "nap", "alcohol"]) {
    const t = TYPES[key];
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="label">${t.quickLabel}</span><span class="meta">${t.quickMeta}</span>`;
    btn.addEventListener("click", () => addEvent(key, t.defaultAmount, null));
    el.appendChild(btn);
  }
}

function renderTypeSelect() {
  const sel = document.getElementById("form-type");
  sel.innerHTML = "";
  for (const [key, t] of Object.entries(TYPES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = t.label;
    sel.appendChild(opt);
  }
  updateAmountField();
}

function updateAmountField() {
  const type = document.getElementById("form-type").value;
  const amountInput = document.getElementById("form-amount");
  const t = TYPES[type];
  if (t.amountKind === "intensity") {
    replaceWithSelect(amountInput, INTENSITY_OPTS, t.defaultAmount);
  } else if (t.amountKind === "size") {
    replaceWithSelect(amountInput, SIZE_OPTS, t.defaultAmount);
  } else {
    replaceWithNumber(amountInput, t.defaultAmount, t.unit);
  }
}

function replaceWithSelect(el, opts, def) {
  const sel = document.createElement("select");
  sel.id = "form-amount";
  for (const o of opts) {
    const op = document.createElement("option");
    op.value = o;
    op.textContent = o.charAt(0).toUpperCase() + o.slice(1);
    if (o === def) op.selected = true;
    sel.appendChild(op);
  }
  el.replaceWith(sel);
}

function replaceWithNumber(el, def, placeholder) {
  const input = document.createElement("input");
  input.type = "number";
  input.id = "form-amount";
  input.value = def;
  input.min = 0;
  input.step = "any";
  input.placeholder = `Amount (${placeholder})`;
  el.replaceWith(input);
}

function renderEventsList() {
  const ul = document.getElementById("events-list");
  pruneOldEvents();
  const today = STATE.events.filter((e) => {
    const now = Date.now();
    const t = e.time.getTime();
    return t > now - 24 * 3600 * 1000;
  });

  if (today.length === 0) {
    ul.innerHTML = `<li class="empty-state">No events logged yet. <span class="sample-link" id="load-sample">Load a sample day</span> to see how the forecast works.</li>`;
    const link = document.getElementById("load-sample");
    if (link) link.addEventListener("click", loadSampleDay);
    return;
  }

  ul.innerHTML = "";
  for (const e of today) {
    const li = document.createElement("li");
    const t = TYPES[e.type];
    const amountLabel =
      t.amountKind === "number" ? `${e.amount} ${t.unit}` : e.amount;
    li.innerHTML = `
      <span class="evt-time">${fmtTime(e.time)}</span>
      <span><span class="evt-name">${t.label}</span><span class="evt-meta">${amountLabel}</span></span>
      <span></span>
      <button class="evt-delete" data-id="${e.id}" title="Delete">×</button>
    `;
    li.querySelector(".evt-delete").addEventListener("click", () =>
      deleteEvent(e.id)
    );
    ul.appendChild(li);
  }
}

function loadSampleDay() {
  const now = new Date();
  const make = (hoursAgo, type, amount) => {
    const d = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      type,
      amount,
      time: d,
    };
  };
  // A realistic mid-quarter UW day: morning Adderall, late-afternoon Celsius,
  // a 90-min nap before evening study, late dinner, screens until bedtime.
  STATE.events = [
    make(11, "stimulant", "medium"),
    make(8,  "coffee", 95),
    make(6,  "meal", "medium"),
    make(4,  "energy_drink", 200),
    make(3,  "nap", 90),
    make(1.5, "meal", "heavy"),
    make(0.5, "screen", 60),
  ];
  save();
  renderAll();
}

function renderBedtimeInput() {
  const el = document.getElementById("bedtime-input");
  el.value = STATE.settings.targetBedtime;
}
