function renderQuickAdd(addFn) {
  renderQuickAddInto(
    document.getElementById("quick-add"),
    ["coffee", "energy_drink", "soda", "marijuana", "alcohol", "nap"],
    addFn
  );
}

// Shared by the log column's quick-add and the what-if panel's quick-add.
// Variant types (e.g. soda) look like a normal tile but open a popover of
// options on click instead of adding the default amount immediately.
function renderQuickAddInto(el, keys, addFn) {
  el.innerHTML = "";
  for (const key of keys) {
    const t = TYPES[key];
    el.appendChild(
      t.amountKind === "variant"
        ? makeQuickAddVariantTile(key, t, addFn)
        : makeQuickAddButton(key, t, addFn)
    );
  }
}

function makeQuickAddButton(key, t, addFn) {
  const btn = document.createElement("button");
  btn.innerHTML = `<span class="label">${t.quickLabel}</span><span class="meta">${t.quickMeta}</span>`;
  btn.addEventListener("click", () => addFn(key, t.defaultAmount, null));
  return btn;
}

function makeQuickAddVariantTile(key, t, addFn) {
  const wrap = document.createElement("div");
  wrap.className = "quick-add-popover-wrap";

  const btn = document.createElement("button");
  btn.innerHTML = `
    <span class="quick-add-text">
      <span class="label">${t.quickLabel}</span>
      <span class="meta">${t.quickMeta}</span>
    </span>
    <svg class="quick-add-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;

  const popover = document.createElement("div");
  popover.className = "quick-add-popover";
  for (const o of t.options) {
    const optBtn = document.createElement("button");
    optBtn.textContent = o.label;
    optBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      addFn(key, o.value, null);
      popover.classList.remove("open");
    });
    popover.appendChild(optBtn);
  }

  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const wasOpen = popover.classList.contains("open");
    closeAllQuickAddPopovers();
    if (!wasOpen) popover.classList.add("open");
  });

  wrap.appendChild(btn);
  wrap.appendChild(popover);
  return wrap;
}

function closeAllQuickAddPopovers() {
  document.querySelectorAll(".quick-add-popover.open").forEach((p) => p.classList.remove("open"));
}

document.addEventListener("click", closeAllQuickAddPopovers);

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
  } else if (t.amountKind === "variant") {
    replaceWithVariantSelect(amountInput, t.options, t.defaultAmount);
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

function replaceWithVariantSelect(el, options, def) {
  const sel = document.createElement("select");
  sel.id = "form-amount";
  for (const o of options) {
    const op = document.createElement("option");
    op.value = o.value;
    op.textContent = o.label;
    if (o.value === def) op.selected = true;
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

// Shared by the log list and the what-if list: resolves the display name and
// amount for a logged event. Variant types (e.g. soda) show the picked
// option's own label and mg instead of the generic type name.
function describeEvent(e) {
  const t = TYPES[e.type];
  if (!t) return null;
  if (t.amountKind === "variant") {
    const variant = t.options.find((o) => o.value === e.amount);
    return {
      name: variant ? variant.label : t.label,
      amountLabel: variant ? `${variant.mg} ${t.unit}` : e.amount,
    };
  }
  return {
    name: t.label,
    amountLabel: t.amountKind === "number" ? `${e.amount} ${t.unit}` : e.amount,
  };
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
    const d = describeEvent(e);
    if (!d) continue; // event type no longer in the active TYPES list
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="evt-time">${fmtTime(e.time)}</span>
      <span><span class="evt-name">${d.name}</span><span class="evt-meta">${d.amountLabel}</span></span>
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
  // A realistic mid-quarter UW day: morning coffee, late-afternoon Celsius,
  // a 90-min nap before evening study, a drink and a smoke session before bed.
  STATE.events = [
    make(8,   "coffee", 95),
    make(4,   "energy_drink", "celsius"),
    make(3,   "nap", 90),
    make(1.5, "marijuana", 10),
    make(0.5, "alcohol", 1),
  ];
  save();
  renderAll();
}

function renderBedtimeInput() {
  const el = document.getElementById("bedtime-input");
  el.value = STATE.settings.targetBedtime;
}
