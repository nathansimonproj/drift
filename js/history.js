let calendarMonth = new Date();
let selectedDayKey = null;

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Always 6 full weeks (42 cells) so the grid includes the padding days from
// the previous/next month needed to fill out the first and last rows.
function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

function eventDayKeys() {
  const keys = new Set();
  for (const e of STATE.events) keys.add(dayKey(e.time));
  return keys;
}

function eventsOnDay(key) {
  return STATE.events.filter((e) => dayKey(e.time) === key).sort((a, b) => a.time - b.time);
}

// Reconstructs that night's bedtime using the *current* target-bedtime
// setting projected onto the historical date — Drift doesn't keep a history
// of bedtime-setting changes, so this is an approximation, same as the
// live forecast's single global setting.
function bedtimeForDayKey(key) {
  const d = dayKeyToDate(key);
  const [h, m] = (STATE.settings.targetBedtime || "22:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  // A midnight/early-morning bedtime (e.g. 00:00, 1:00) belongs to the night
  // of `key`, which in absolute time falls on the *next* calendar date —
  // mirrors targetBedtimeDate()'s same-day-vs-next-day rollover for "today",
  // generalized to an arbitrary day since there's no "now" to compare against.
  // Without this, events logged during the day land after this timestamp,
  // read as h < 0 by every DECAY curve, and score 100 no matter what was logged.
  if (h < 12) d.setDate(d.getDate() + 1);
  return d;
}

function renderMonthLabel() {
  document.getElementById("cal-month-label").textContent =
    calendarMonth.toLocaleDateString([], { month: "long", year: "numeric" });
}

function renderCalendarGrid() {
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  for (const w of ["su", "mo", "tu", "we", "th", "fr", "sa"]) {
    const el = document.createElement("div");
    el.className = "cal-weekday";
    el.textContent = w;
    grid.appendChild(el);
  }

  const todayKey = dayKey(new Date());
  const eventKeys = eventDayKeys();
  const month = calendarMonth.getMonth();

  for (const d of buildMonthGrid(calendarMonth)) {
    const key = dayKey(d);
    const btn = document.createElement("button");
    btn.className = "cal-day";
    btn.textContent = d.getDate();
    if (d.getMonth() !== month) btn.classList.add("cal-day-outside");
    if (key === todayKey) btn.classList.add("cal-day-today");
    if (eventKeys.has(key)) btn.classList.add("cal-day-has-events");
    if (key === selectedDayKey) btn.classList.add("cal-day-selected");

    // dayKey's zero-padded "YYYY-MM-DD" format sorts lexicographically the
    // same as chronologically, so this comparison works as a date compare.
    if (key > todayKey) {
      btn.classList.add("cal-day-disabled");
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => selectDay(key));
    }
    grid.appendChild(btn);
  }
}

function renderCalendar() {
  renderMonthLabel();
  renderCalendarGrid();
  document.getElementById("cal-next").disabled = isSameMonth(calendarMonth, new Date());
}

function renderDayDetail(key) {
  const el = document.getElementById("calendar-day-detail");
  const bedtime = bedtimeForDayKey(key);
  const dayEvents = eventsOnDay(key);
  const result = scoreAt(eventsNear(STATE.events, bedtime), bedtime);
  const interp = interpret(result.score, result.byType);
  const categories = categoryCosts(result.byType).sort((a, b) => b.cost - a.cost);

  const eventsHtml = dayEvents.length
    ? dayEvents
        .map((e) => {
          const d = describeEvent(e);
          if (!d) return "";
          return `
            <li>
              <span class="evt-time">${fmtTime(e.time)}</span>
              <span><span class="evt-name">${d.name}</span><span class="evt-meta">${d.amountLabel}</span></span>
            </li>
          `;
        })
        .join("")
    : `<li class="empty-state">No events logged.</li>`;

  const breakdownHtml = categories
    .map(({ label, cost }) => {
      const klass = cost === 0 ? "zero" : cost < 5 ? "low" : cost < 12 ? "high" : "very-high";
      return `
        <div class="item">
          <div class="name">${label}</div>
          <div class="cost ${klass}">−${cost.toFixed(1)}</div>
        </div>
      `;
    })
    .join("");

  el.innerHTML = `
    <div class="cal-detail-date">${fmtDayLabel(dayKeyToDate(key))}</div>
    <div class="cal-detail-score">
      <div class="score ${interp.klass}">${Math.round(result.score)}</div>
      <div class="cal-detail-interp">
        <div class="word">${interp.word}</div>
        <div class="feel">${interp.feel}</div>
      </div>
    </div>
    <div class="breakdown cal-detail-breakdown">${breakdownHtml}</div>
    <ul class="events-list cal-detail-events">${eventsHtml}</ul>
  `;
}

function selectDay(key) {
  selectedDayKey = key;
  renderCalendarGrid();
  renderDayDetail(key);
}

function calPrevMonth() {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
}

function calNextMonth() {
  if (isSameMonth(calendarMonth, new Date())) return;
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
}

function openCalendar() {
  calendarMonth = new Date();
  calendarMonth.setDate(1);
  selectedDayKey = dayKey(new Date());
  renderCalendar();
  renderDayDetail(selectedDayKey);
  document.getElementById("calendar-modal-overlay").classList.add("open");
}

function closeCalendar() {
  document.getElementById("calendar-modal-overlay").classList.remove("open");
}

function setupCalendar() {
  document.getElementById("calendar-trigger").addEventListener("click", openCalendar);
  document.getElementById("calendar-close").addEventListener("click", closeCalendar);
  document.getElementById("cal-prev").addEventListener("click", calPrevMonth);
  document.getElementById("cal-next").addEventListener("click", calNextMonth);

  const overlay = document.getElementById("calendar-modal-overlay");
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) closeCalendar();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && overlay.classList.contains("open")) closeCalendar();
  });
}
