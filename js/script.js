// ===== Cursor glow =====
const glow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
  document.documentElement.style.setProperty('--mx', e.clientX + 'px');
  document.documentElement.style.setProperty('--my', e.clientY + 'px');
});
document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });

// ===== Clock =====
function pad(n) { return String(n).padStart(2, '0'); }
function tickClock() {
  const d = new Date();
  document.getElementById('dash-clock').textContent =
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} utc`;
}
setInterval(tickClock, 1000);
tickClock();

// ===== Metric updates =====
const metrics = { commits: 47 };

function updateMetrics() {
  metrics.commits += Math.random() > 0.6 ? 1 : 0;
  const pyPct = (72 + Math.random() * 4).toFixed(0);
  document.getElementById('m-commits').textContent = metrics.commits;
  document.getElementById('m-lang').innerHTML = `Python <small>${pyPct}%</small>`;
}
setInterval(updateMetrics, 3000);

// ===== Sparkline — commits per day, Saturday peaks =====
const sparkCanvas = document.getElementById('spark');
const sparkCtx = sparkCanvas.getContext('2d');
const dayLabels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
let sparkData = [8, 14, 6, 4, 9, 23, 11];

function drawSpark() {
  const dpr = window.devicePixelRatio || 1;
  const w = sparkCanvas.clientWidth;
  const h = sparkCanvas.clientHeight;
  if (w === 0) return;
  sparkCanvas.width = w * dpr;
  sparkCanvas.height = h * dpr;
  sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sparkCtx.clearRect(0, 0, w, h);

  const min = 0;
  const max = Math.max(...sparkData) * 1.15;
  const range = max - min || 1;
  const stepX = w / (sparkData.length - 1);

  sparkCtx.strokeStyle = 'rgba(74, 70, 63, 0.5)';
  sparkCtx.lineWidth = 1;
  sparkCtx.setLineDash([2, 3]);
  sparkCtx.beginPath();
  sparkCtx.moveTo(0, h - 1);
  sparkCtx.lineTo(w, h - 1);
  sparkCtx.stroke();
  sparkCtx.setLineDash([]);

  sparkCtx.beginPath();
  sparkData.forEach((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 12) - 6;
    if (i === 0) sparkCtx.moveTo(x, y);
    else sparkCtx.lineTo(x, y);
  });
  sparkCtx.lineTo(w, h);
  sparkCtx.lineTo(0, h);
  sparkCtx.closePath();
  const grad = sparkCtx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(217, 119, 6, 0.22)');
  grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
  sparkCtx.fillStyle = grad;
  sparkCtx.fill();

  sparkCtx.beginPath();
  sparkData.forEach((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 12) - 6;
    if (i === 0) sparkCtx.moveTo(x, y);
    else sparkCtx.lineTo(x, y);
  });
  sparkCtx.strokeStyle = '#d97706';
  sparkCtx.lineWidth = 1.5;
  sparkCtx.stroke();

  sparkData.forEach((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 12) - 6;
    sparkCtx.fillStyle = i === 5 ? '#f97316' : 'rgba(217, 119, 6, 0.4)';
    sparkCtx.beginPath();
    sparkCtx.arc(x, y, i === 5 ? 3 : 1.5, 0, Math.PI * 2);
    sparkCtx.fill();
  });

  sparkCtx.fillStyle = 'rgba(74, 70, 63, 0.8)';
  sparkCtx.font = '9px JetBrains Mono';
  sparkCtx.textAlign = 'center';
  dayLabels.forEach((label, i) => {
    const x = i * stepX;
    sparkCtx.fillText(label, x, h - 1);
  });
}

window.addEventListener('load', drawSpark);
window.addEventListener('resize', drawSpark);

// ===== Git log stream =====
const commitMessages = [
  ['feat', '(doria): flag hallucinated package imports'],
  ['fix', '(uwatu): mqtt reconnect under packet loss'],
  ['feat', '(afyaai): stream gemini triage responses'],
  ['feat', '(sieve): fastapi api skeleton'],
  ['docs', 'api contract for /v1/livestock/events'],
  ['feat', '(doria): cross-ref npm registry for typos'],
  ['fix', '(afyaai): handle gemini rate limits gracefully'],
  ['test', '(uwatu): mqtt payload parsing edge cases'],
  ['feat', '(sieve): recruiter feedback endpoint'],
  ['refactor', '(doria): extract scanner into rust module'],
  ['chore', 'dockerize afyaai for deployment'],
  ['fix', '(uwatu): timezone offset in telemetry'],
  ['feat', '(uwatu): add sms alert pipeline'],
  ['docs', 'update openapi spec for /v1/triage'],
  ['perf', '(doria): batch registry lookups'],
  ['feat', '(sieve): jwt auth filter chain'],
];

const logsEl = document.getElementById('logs');
const maxLogs = 7;

function genHash() {
  return Math.random().toString(16).substr(2, 6);
}

function addLog() {
  const [type, msg] = commitMessages[Math.floor(Math.random() * commitMessages.length)];
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="hash">${genHash()}</span><span class="type">${type}</span><span class="msg">${msg}</span>`;
  logsEl.insertBefore(line, logsEl.firstChild);
  while (logsEl.children.length > maxLogs) {
    logsEl.removeChild(logsEl.lastChild);
  }
}

for (let i = 0; i < maxLogs; i++) addLog();
function scheduleNextLog() {
  setTimeout(() => { addLog(); scheduleNextLog(); }, 800 + Math.random() * 1000);
}
scheduleNextLog();

// ===== Work row expand =====
document.querySelectorAll('.work-row[data-detail]').forEach(row => {
  row.addEventListener('click', () => row.classList.toggle('open'));
});
