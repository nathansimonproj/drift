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

function save() {
  const serializable = {
    events: STATE.events.map((e) => ({ ...e, time: e.time.toISOString() })),
    settings: STATE.settings,
  };
  localStorage.setItem(KEY, JSON.stringify(serializable));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    STATE.events = (parsed.events || []).map((e) => ({
      ...e,
      time: new Date(e.time),
    }));
    STATE.settings = { ...STATE.settings, ...(parsed.settings || {}) };
  } catch (err) {
    console.warn("Could not load saved state", err);
  }
}

// Keep only events from the last 30 hours so the timeline stays sensible.
function pruneOldEvents() {
  const cutoff = Date.now() - 30 * 3600 * 1000;
  STATE.events = STATE.events.filter((e) => e.time.getTime() > cutoff);
}

function addEvent(type, amount, timeStr) {
  const time = timeStr ? parseTimeStrToToday(timeStr) : new Date();
  STATE.events.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    amount,
    time,
  });
  STATE.events.sort((a, b) => a.time - b.time);
  save();
  renderAll();
}

function deleteEvent(id) {
  STATE.events = STATE.events.filter((e) => e.id !== id);
  save();
  renderAll();
}
