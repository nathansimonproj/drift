const STATE = {
  events: [],
  settings: {
    targetBedtime: "01:00",
    name: "",
    sex: "",
    height: "",
    heightUnit: "cm",
    weight: "",
    weightUnit: "kg",
  },
};

const KEY = "drift-v1";

// Settings still live in localStorage (kept in sync with /profile by
// profile-page.js). Events are server-backed so they follow you across
// devices instead of being stuck on whichever browser logged them.
function save() {
  localStorage.setItem(KEY, JSON.stringify(STATE.settings));
}

async function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) STATE.settings = { ...STATE.settings, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Could not load saved settings", err);
  }

  try {
    const res = await fetch("/events");
    if (res.ok) {
      const rows = await res.json();
      STATE.events = rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: coerceAmount(r.type, r.amount),
        time: new Date(r.occurred_at),
      }));
    }
  } catch (err) {
    console.warn("Could not load events from server", err);
  }
}

function coerceAmount(type, amount) {
  const t = TYPES[type];
  return t && t.amountKind === "number" ? parseFloat(amount) : amount;
}

// Keep only events from the last 30 hours so the timeline stays sensible.
function pruneOldEvents() {
  const cutoff = Date.now() - 30 * 3600 * 1000;
  STATE.events = STATE.events.filter((e) => e.time.getTime() > cutoff);
}

async function addEventAt(type, amount, time) {
  const event = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    amount,
    time,
  };
  STATE.events.push(event);
  STATE.events.sort((a, b) => a.time - b.time);
  renderAll();

  try {
    await fetch("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id, type, amount, time: time.toISOString() }),
    });
  } catch (err) {
    console.warn("Could not save event to server", err);
  }
}

function addEvent(type, amount, timeStr) {
  const time = timeStr ? parseTimeStrToToday(timeStr) : new Date();
  return addEventAt(type, amount, time);
}

async function deleteEvent(id) {
  STATE.events = STATE.events.filter((e) => e.id !== id);
  renderAll();

  try {
    await fetch(`/events/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Could not delete event on server", err);
  }
}
