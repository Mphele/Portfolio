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

// WakaTime day-of-week data (parsed from README, used as sparkline fallback)
let wakaWeekData = null; // { data: [mon,tue,...,sun], peakIdx, peakDay, peakVal }

// Render stats into the DOM
function renderStats() {
  document.getElementById('m-lang').textContent = liveStats.topLang;
  document.getElementById('m-day').textContent = liveStats.mostActiveDay;
  // Keep spark-peak in sync with most active day
  document.getElementById('spark-peak').textContent =
    'most active: ' + liveStats.mostActiveDay.toLowerCase();
}

// Parse the WakaTime README for language, most active day, and day-of-week commits
function parseWakaTimeReadme(text) {
  // Parse "I'm Most Productive on ___"
  const dayMatch = text.match(/Most Productive on (\w+)/i);
  if (dayMatch) liveStats.mostActiveDay = dayMatch[1];

  // Parse "I Mostly Code in ___" — just the language name, no percentage
  const langMatch = text.match(/Mostly Code in (\w[\w#+]*)/i);
  if (langMatch) liveStats.topLang = langMatch[1];

  // Parse day-of-week commit table
  // Format: "Monday                   226 commits         ███░░░   13.73 %"
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShort = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const counts = [];
  let foundAny = false;

  dayOrder.forEach(day => {
    const re = new RegExp(day + '\\s+(\\d+)\\s+commits', 'i');
    const m = text.match(re);
    if (m) {
      counts.push(parseInt(m[1], 10));
      foundAny = true;
    } else {
      counts.push(0);
    }
  });

  if (foundAny && counts.some(c => c > 0)) {
    let peakVal = 0, peakIdx = 0;
    counts.forEach((v, i) => {
      if (v > peakVal) { peakVal = v; peakIdx = i; }
    });
    wakaWeekData = {
      data: counts,
      labels: dayShort,
      peakIdx,
      peakDay: dayShort[peakIdx],
      peakVal,
    };
  }
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
      const totalMatch = svgText.match(/<text[^>]*>(\d+)<\/text>/);
      if (totalMatch) {
        liveStats.commits = parseInt(totalMatch[1], 10);
        return;
      }
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
  // Fetch README for language, most active day, and day-of-week commits
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

  // Now fetch sparkline data (after README is parsed so wakaWeekData is available)
  fetchSparkData();
}

// Kick off the fetch on page load
fetchGitHubStats();

// ===== Sparkline — real commits per day from GitHub Events API =====
const sparkCanvas = document.getElementById('spark');
const sparkCtx = sparkCanvas.getContext('2d');
const SHORT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
let sparkData = [0, 0, 0, 0, 0, 0, 0];
let dayLabels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
let peakIdx = 0;

// Build the last 7 days as date strings and labels
function getLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().slice(0, 10),
      label: SHORT_DAYS[d.getDay()],
    });
  }
  return days;
}

// Fetch sparkline data: try Events API, fall back to WakaTime day-of-week
async function fetchSparkData() {
  const last7 = getLast7Days();
  let usedRealData = false;

  try {
    let allEvents = [];
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100&page=${page}`
      );
      if (!res.ok) break;
      const events = await res.json();
      if (events.length === 0) break;
      allEvents = allEvents.concat(events);

      const oldest = new Date(events[events.length - 1].created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      if (oldest < cutoff) break;
    }

    // Count commits per day
    const countByDate = {};
    last7.forEach(d => { countByDate[d.dateStr] = 0; });

    allEvents.forEach(ev => {
      if (ev.type === 'PushEvent' && ev.payload && ev.payload.commits) {
        const evDate = ev.created_at.slice(0, 10);
        if (countByDate[evDate] !== undefined) {
          countByDate[evDate] += ev.payload.commits.length;
        }
      }
    });

    const realData = last7.map(d => countByDate[d.dateStr]);
    const totalReal = realData.reduce((a, b) => a + b, 0);

    if (totalReal > 0) {
      // We have real last-7-days data
      sparkData = realData;
      dayLabels = last7.map(d => d.label);
      usedRealData = true;
      document.getElementById('spark-label').textContent = 'commits · last 7 days';
    }
  } catch (err) {
    console.warn('Events API failed:', err);
  }

  // If no real data, fall back to WakaTime day-of-week distribution
  if (!usedRealData && wakaWeekData) {
    sparkData = wakaWeekData.data;
    dayLabels = wakaWeekData.labels;
    peakIdx = wakaWeekData.peakIdx;

    document.getElementById('spark-label').textContent = 'activity · by day';
    // spark-peak already set by renderStats

    drawSpark();
    return;
  }

  // Find peak for real data
  let maxVal = 0;
  peakIdx = 0;
  sparkData.forEach((v, i) => {
    if (v > maxVal) { maxVal = v; peakIdx = i; }
  });

  // spark-peak already set by renderStats
  document.getElementById('spark-label').textContent =
    usedRealData ? 'commits · last 7 days' : 'activity · by day';

  drawSpark();
}

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
  const max = Math.max(...sparkData, 1) * 1.15;
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
    sparkCtx.fillStyle = i === peakIdx ? '#f97316' : 'rgba(217, 119, 6, 0.4)';
    sparkCtx.beginPath();
    sparkCtx.arc(x, y, i === peakIdx ? 3 : 1.5, 0, Math.PI * 2);
    sparkCtx.fill();
  });

  sparkCtx.font = '9px JetBrains Mono';
  dayLabels.forEach((label, i) => {
    const x = i * stepX;
    sparkCtx.fillStyle = 'rgba(180, 170, 155, 0.85)';
    if (i === 0) {
      sparkCtx.textAlign = 'left';
    } else if (i === dayLabels.length - 1) {
      sparkCtx.textAlign = 'right';
    } else {
      sparkCtx.textAlign = 'center';
    }
    sparkCtx.fillText(label, x, h - 1);
  });
}

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
