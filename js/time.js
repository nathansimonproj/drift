function parseTimeStrToToday(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // If the chosen time is more than 12h in the future, assume it's yesterday.
  if (d.getTime() - Date.now() > 12 * 3600 * 1000) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Formats a Date as "HH:MM" for pre-filling a <input type="time"> field.
function toTimeInputValue(d) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function targetBedtimeDate() {
  const [h, m] = STATE.settings.targetBedtime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // If bedtime already passed today, target tonight's same time tomorrow.
  if (d.getTime() < Date.now() - 2 * 3600 * 1000) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}
