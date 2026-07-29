function renderQuickAdd(addFn) {
  renderQuickAddInto(
    document.getElementById("quick-add"),
    ["coffee", "energy_drink", "soda", "marijuana", "alcohol", "nap", "nicotine"],
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
    if (!t) continue; // type commented out / no longer active
    el.appendChild(
      t.amountKind === "variant"
        ? makeQuickAddVariantTile(key, t, addFn)
        : makeQuickAddButton(key, t, addFn)
    );
  }
}

function makeQuickAddButton(key, t, addFn) {
  const btn = document.createElement("button");
  btn.innerHTML = `
    <span class="quick-add-text">
      <span class="label">${t.quickLabel}</span>
      <span class="meta">${t.quickMeta}</span>
    </span>
  `;
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

// Shared by the Custom Entry form and the edit modal, which each have their
// own type-select/amount-field pair distinguished by element id.
function populateTypeSelect(selectId) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = "";
  for (const [key, t] of Object.entries(TYPES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = t.label;
    sel.appendChild(opt);
  }
}

// What the amount field actually represents varies by type: a plain
// quantity, or a pick from a named list (brand, product, intensity, size).
// A type can override the generic per-amountKind label (e.g. nicotine's
// options are delivery methods, not brands) via its own `amountLabel`.
function amountFieldLabel(t) {
  if (t.amountLabel) return t.amountLabel;
  if (t.amountKind === "variant") return "Brand";
  if (t.amountKind === "intensity") return "Intensity";
  if (t.amountKind === "size") return "Size";
  return "Amount";
}

function rebuildAmountField(typeSelectId, amountFieldId) {
  const type = document.getElementById(typeSelectId).value;
  const amountInput = document.getElementById(amountFieldId);
  const t = TYPES[type];
  if (t.amountKind === "intensity") {
    replaceWithSelect(amountInput, INTENSITY_OPTS, t.defaultAmount, amountFieldId);
  } else if (t.amountKind === "size") {
    replaceWithSelect(amountInput, SIZE_OPTS, t.defaultAmount, amountFieldId);
  } else if (t.amountKind === "variant") {
    replaceWithVariantSelect(amountInput, t.options, t.defaultAmount, amountFieldId);
  } else {
    replaceWithNumber(amountInput, t.defaultAmount, t.unit, amountFieldId);
  }
}

function renderTypeSelect() {
  populateTypeSelect("form-type");
  updateAmountField();
}

function updateAmountField() {
  rebuildAmountField("form-type", "form-amount");
}

function replaceWithSelect(el, opts, def, id) {
  const sel = document.createElement("select");
  sel.id = id;
  for (const o of opts) {
    const op = document.createElement("option");
    op.value = o;
    op.textContent = o.charAt(0).toUpperCase() + o.slice(1);
    if (o === def) op.selected = true;
    sel.appendChild(op);
  }
  el.replaceWith(sel);
}

function replaceWithVariantSelect(el, options, def, id) {
  const sel = document.createElement("select");
  sel.id = id;
  for (const o of options) {
    const op = document.createElement("option");
    op.value = o.value;
    op.textContent = o.label;
    if (o.value === def) op.selected = true;
    sel.appendChild(op);
  }
  el.replaceWith(sel);
}

function replaceWithNumber(el, def, placeholder, id) {
  const input = document.createElement("input");
  input.type = "number";
  input.id = id;
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
  const now = Date.now();
  // What If mode reads/writes its own forked sandbox (see setMode()) — same
  // list UI, same edit/delete affordances, but nothing here touches the
  // real log until you switch back to Actual.
  const source = whatIfMode ? whatIfEvents : STATE.events;
  const today = source.filter((e) => e.time.getTime() > now - 24 * 3600 * 1000);

  if (today.length === 0) {
    ul.innerHTML = `<li class="empty-state">No events logged yet.</li>`;
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
      <span><button class="evt-edit" title="Edit">✎</button></span>
      <button class="evt-delete" title="Delete">×</button>
    `;
    li.querySelector(".evt-edit").addEventListener("click", () => openEditModal(e.id));
    li.querySelector(".evt-delete").addEventListener("click", () => deleteEventModeAware(e.id));
    ul.appendChild(li);
  }
}

function renderBedtimeInput() {
  const el = document.getElementById("bedtime-input");
  el.value = STATE.settings.targetBedtime;
}
