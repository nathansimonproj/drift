let chart = null;

function renderForecast() {
  const bedtime = targetBedtimeDate();
  const result = scoreAt(STATE.events, bedtime);
  const interp = interpret(result.score);

  const heroEl = document.getElementById("hero-score");
  heroEl.textContent = Math.round(result.score);
  heroEl.className = `score ${interp.klass}`;

  document.getElementById("hero-interpretation").textContent = interp.word;
  document.getElementById("hero-bedtime").textContent =
    `Target bedtime ${fmtTime(bedtime)}`;

  renderBreakdown(result.byType);
  renderChart(bedtime);
}

function renderBreakdown(byType) {
  const el = document.getElementById("breakdown");
  el.innerHTML = "";

  const entries = Object.keys(TYPES).map((type) => ({
    type,
    cost: byType[type] || 0,
  }));

  entries.sort((a, b) => b.cost - a.cost);

  for (const { type, cost } of entries) {
    const item = document.createElement("div");
    item.className = "item";
    const klass =
      cost === 0 ? "zero" : cost < 5 ? "low" : cost < 12 ? "high" : "very-high";
    item.innerHTML = `
      <div class="name">${TYPES[type].label}</div>
      <div class="cost ${klass}">−${cost.toFixed(1)}</div>
    `;
    el.appendChild(item);
  }
}

function renderChart(bedtime) {
  const ctx = document.getElementById("decay-chart").getContext("2d");
  const now = new Date();
  const end = new Date(bedtime.getTime() + 2 * 3600 * 1000);

  const points = [];
  const labels = [];
  const stepMin = 15;
  for (let t = now.getTime(); t <= end.getTime(); t += stepMin * 60 * 1000) {
    const at = new Date(t);
    const r = scoreAt(STATE.events, at);
    points.push(r.score);
    labels.push(fmtTime(at));
  }

  const bedtimeIdx = Math.round(
    (bedtime.getTime() - now.getTime()) / (stepMin * 60 * 1000)
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Forecast",
        data: points,
        borderColor: "#e8a854",
        backgroundColor: "rgba(232, 168, 84, 0.12)",
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
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1c2238",
          titleColor: "#e8e9ed",
          bodyColor: "#8b91a8",
          borderColor: "#262c44",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `Score: ${Math.round(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#5c6377", stepSize: 25 },
          grid: { color: "rgba(255,255,255,0.04)" },
        },
        x: {
          ticks: {
            color: "#5c6377",
            maxTicksLimit: 8,
            autoSkip: true,
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
      ctx.strokeStyle = "rgba(232,232,237,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.fillStyle = "#8b91a8";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(`bed ${fmtTime(bedtime)}`, x + 6, top + 12);
      ctx.restore();
    },
  };

  if (chart) chart.destroy();
  chart = new Chart(ctx, { ...config, plugins: [bedtimePlugin] });
}
