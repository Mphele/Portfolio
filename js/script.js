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

// ===== GitHub Stats — fetch real data from profile README + Streak Stats =====
const GITHUB_USER = 'Mphele';

// Defaults (used while loading or if fetch fails)
let liveStats = {
  commits: '—',
  topLang: 'Python',
  mostActiveDay: 'Saturday',
};

// Render stats into the DOM
function renderStats() {
  document.getElementById('m-commits').textContent = liveStats.commits;
  document.getElementById('m-lang').textContent = liveStats.topLang;
  document.getElementById('m-day').textContent = liveStats.mostActiveDay;
}

// Parse the WakaTime README for language and most active day only
function parseWakaTimeReadme(text) {
  // Parse "I'm Most Productive on ___"
  const dayMatch = text.match(/Most Productive on (\w+)/i);
  if (dayMatch) liveStats.mostActiveDay = dayMatch[1];

  // Parse "I Mostly Code in ___" — just the language name, no percentage
  const langMatch = text.match(/Mostly Code in (\w[\w#+]*)/i);
  if (langMatch) liveStats.topLang = langMatch[1];
}

// Fetch real total contributions from GitHub Streak Stats SVG
async function fetchStreakStats() {
  try {
    const res = await fetch(
      `https://streak-stats.demolab.com/?user=${GITHUB_USER}&hide_border=true&type=svg`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const svgText = await res.text();
      // The SVG contains the total contributions as text, e.g. "615"
      // It appears in a <text> element after "Total Contributions"
      const totalMatch = svgText.match(/<text[^>]*>(\d+)<\/text>/);
      if (totalMatch) {
        liveStats.commits = parseInt(totalMatch[1], 10);
        return;
      }
      // Alternative: look for the number near "Total Contributions"
      const altMatch = svgText.match(/(\d+)\s*<\/text>\s*[\s\S]*?Total Contributions/i);
      if (altMatch) {
        liveStats.commits = parseInt(altMatch[1], 10);
        return;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch streak stats:', err);
  }
}

// Main fetch function
async function fetchGitHubStats() {
  // Fetch README for language and most active day
  try {
    const readmeRes = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/main/README.md`,
      { cache: 'no-store' }
    );
    if (readmeRes.ok) {
      const readmeText = await readmeRes.text();
      parseWakaTimeReadme(readmeText);
    }
  } catch (err) {
    console.warn('Failed to fetch GitHub README:', err);
  }

  // Fetch real commit count from streak stats
  await fetchStreakStats();

  // If streak stats failed, try GitHub Events API as fallback
  if (liveStats.commits === '—') {
    try {
      const eventsRes = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`
      );
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        let pushCommits = 0;
        events.forEach(ev => {
          if (ev.type === 'PushEvent' && ev.payload && ev.payload.commits) {
            pushCommits += ev.payload.commits.length;
          }
        });
        if (pushCommits > 0) liveStats.commits = pushCommits;
      }
    } catch (err) {
      console.warn('Failed to fetch GitHub events:', err);
    }
  }

  // Final fallback
  if (liveStats.commits === '—') liveStats.commits = 615;

  renderStats();
}

// Kick off the fetch on page load
fetchGitHubStats();

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
  ['feat', '(afya): stream gemini triage responses'],
  ['feat', '(sieve): fastapi api skeleton'],
  ['docs', 'api contract for /v1/livestock/events'],
  ['feat', '(doria): cross-ref npm registry for typos'],
  ['fix', '(afya): handle gemini rate limits gracefully'],
  ['test', '(uwatu): mqtt payload parsing edge cases'],
  ['feat', '(sieve): recruiter feedback endpoint'],
  ['refactor', '(doria): extract scanner into rust module'],
  ['chore', 'dockerize afya for deployment'],
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
