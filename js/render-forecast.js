let chart = null;

function fmtHourLabel(d) {
  const h = d.getHours() % 12 || 12;
  const ampm = d.getHours() < 12 ? "am" : "pm";
  return `${h}${ampm}`;
}

function renderForecast() {
  const events = typeof getActiveEvents === 'function' ? getActiveEvents() : STATE.events;
  const bedtime = targetBedtimeDate(typeof getActiveBedtime === 'function' ? getActiveBedtime() : undefined);
  const result = scoreAt(events, bedtime);
  const interp = interpret(result.score, result.byType);

  const heroEl = document.getElementById("hero-score");
  heroEl.textContent = Math.round(result.score);
  heroEl.className = `score ${interp.klass}`;

  document.getElementById("hero-interpretation").textContent = interp.word;
  document.getElementById("hero-feel").textContent = interp.feel;
  document.getElementById("hero-bedtime-text").textContent = fmtTime(bedtime);

  renderBreakdown(result.byType);
  renderChart(bedtime, events);
}

function renderBreakdown(byType) {
  const el = document.getElementById("breakdown");
  el.innerHTML = "";

  const categories = categoryCosts(byType).sort((a, b) => b.cost - a.cost);

  for (const { label, cost } of categories) {
    const item = document.createElement("div");
    item.className = "item";
    const klass = cost === 0 ? "zero" : cost < 5 ? "low" : cost < 12 ? "high" : "very-high";
    item.innerHTML = `
      <div class="name">${label}</div>
      <div class="cost ${klass}">−${cost.toFixed(1)}</div>
    `;
    el.appendChild(item);
  }
}

function renderChart(bedtime, events) {
  const ctx = document.getElementById("decay-chart").getContext("2d");
  const now = new Date();
  const end = new Date(bedtime.getTime() + 2 * 3600 * 1000);

  const points = [];
  const labels = [];
  const byTypeAtIndex = [];
  const stepMin = 15;
  for (let t = now.getTime(); t <= end.getTime(); t += stepMin * 60 * 1000) {
    const at = new Date(t);
    const r = scoreAt(events, at);
    points.push(r.score);
    labels.push(fmtTime(at));
    byTypeAtIndex.push(r.byType);
  }

  const bedtimeIdx = Math.round(
    (bedtime.getTime() - now.getTime()) / (stepMin * 60 * 1000)
  );

  // Whole-hour tick marks, independent of the 15-min sample grid: find the
  // sample nearest each hour boundary and give it a clean "H:00" label
  // rather than trusting whatever off-hour timestamp that sample landed on.
  const hourLabelByIndex = new Map();
  const hourCursor = new Date(now);
  hourCursor.setMinutes(0, 0, 0);
  hourCursor.setTime(hourCursor.getTime() + 3600 * 1000);
  while (hourCursor.getTime() <= end.getTime()) {
    const idx = Math.round((hourCursor.getTime() - now.getTime()) / (stepMin * 60 * 1000));
    if (idx >= 0 && idx < points.length) {
      hourLabelByIndex.set(idx, fmtHourLabel(hourCursor));
    }
    hourCursor.setTime(hourCursor.getTime() + 3600 * 1000);
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Forecast",
        data: points,
        borderColor: "#e0e0e0",
        backgroundColor: "rgba(224, 224, 224, 0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const config = {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e1e1e",
          titleColor: "#f0f0f0",
          bodyColor: "#999999",
          borderColor: "#2e2e2e",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `Score: ${Math.round(ctx.parsed.y)}`,
            afterLabel: (ctx) =>
              categoryCosts(byTypeAtIndex[ctx.dataIndex] || {})
                .filter(({ cost }) => cost > 0)
                .map(({ label, cost }) => `${label}: −${cost.toFixed(1)}`),
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#555555", stepSize: 25 },
          grid: { color: "rgba(255,255,255,0.04)" },
        },
        x: {
          afterBuildTicks: (axis) => {
            axis.ticks = [...hourLabelByIndex.keys()].map((value) => ({ value }));
          },
          ticks: {
            color: "#555555",
            callback: (value) => hourLabelByIndex.get(value) ?? "",
          },
          grid: { display: false },
        },
      },
      animation: { duration: 250 },
    },
  };

  const bedtimePlugin = {
    id: "bedtimeLine",
    afterDraw(chart) {
      const x = chart.scales.x.getPixelForValue(bedtimeIdx);
      const top = chart.chartArea.top;
      const bottom = chart.chartArea.bottom;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(240,240,240,0.3)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.fillStyle = "#999999";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(`bed ${fmtTime(bedtime)}`, x + 6, top + 12);
      ctx.restore();
    },
  };

  if (chart) chart.destroy();
  chart = new Chart(ctx, { ...config, plugins: [bedtimePlugin] });
}
