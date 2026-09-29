const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  root.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeMeta.setAttribute('content', isDark ? '#0c0b09' : '#f4f0e8');
}

applyTheme(root.dataset.theme);

themeToggle.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
});

document.getElementById('year').textContent = new Date().getFullYear();

const projects = {
  limi: {
    label: 'Featured project · 2026',
    title: 'Limi',
    lede: 'An accessibility engine that transforms textbooks, study notes, university PDFs and videos into learning formats people can read, hear and see signed.',
    points: [
      'Supports 12 South African languages and South African Sign Language.',
      'Combines OCR ingestion, semantic structure recovery and synchronized native speech.',
      'Designed with an offline-first learner experience for constrained environments.'
    ],
    tags: ['OCR', 'Speech', 'SASL', 'Offline-first', 'API'],
    result: '🏆 Geekulcha Annual Hackathon 2026 · 1st place',
    image: 'img/limi-landing.png',
    alt: 'Limi landing page showing multilingual speech and South African Sign Language learning features',
    links: [{ label: 'View screenshot ↗', href: 'img/limi-landing.png' }]
  },
  doria: {
    label: 'Security tooling · 2026',
    title: 'Doria',
    lede: 'A zero-setup developer security tool that intercepts package installs and catches malicious, typosquatted and AI-hallucinated dependencies before they reach disk.',
    points: [
      'Uses a local forward proxy to protect the normal terminal workflow without package execution.',
      'Scores risk from registry metadata, install behaviour and package-name similarity.',
      'Adds package hashing to detect suspicious changes after an initially trusted release.'
    ],
    tags: ['Python', 'Node.js', 'XGBoost', 'Security'],
    result: '🏆 ITWeb Security Summit 2026 · 1st place',
    image: 'img/Doria landing page.png',
    alt: 'Doria software supply chain security landing page',
    links: [
      { label: 'GitHub ↗', href: 'https://github.com/doria-sec' },
      { label: 'Demo ↗', href: 'https://drive.google.com/file/d/16InuMLp-sxiTw1Z7twsWEOgx_MIhABZ2/view' }
    ]
  },
  uwatu: {
    label: 'Event-driven IoT · 2026',
    title: 'Uwatu',
    lede: 'An event-driven monitoring system that models normal livestock behaviour and surfaces unexplained changes that may signal illness, distress or a security threat.',
    points: [
      'Routes high-throughput IoT telemetry through a Go-based backend.',
      'Combines behavioural anomalies with live telecom network signals.',
      'Designed for fault-tolerant operation in low-bandwidth agricultural environments.'
    ],
    tags: ['Go', 'Python', 'FastAPI', 'IoT', 'Event-driven'],
    result: '',
    image: 'img/uwatu dashboard.jpg',
    alt: 'Uwatu livestock monitoring dashboard',
    links: [
      { label: 'GitHub ↗', href: 'https://github.com/Uwatu' },
      { label: 'Demo ↗', href: 'https://youtu.be/H6MImZOQ64Q' }
    ]
  },
  afya: {
    label: 'Accessible health AI · 2026',
    title: 'AfyaAI',
    lede: 'A multilingual, voice-first medical assistant that offers calm, actionable guidance and routes genuinely urgent cases to nearby clinics.',
    points: [
      'Runs translation, text-to-speech and AI inference concurrently through FastAPI.',
      'Uses severity guardrails and geolocation routing to avoid unnecessary escalation.',
      'Generates synchronized visemes for a speaking 3D guide with language fallbacks.'
    ],
    tags: ['Python', 'FastAPI', 'Llama 3.1', 'TTS', 'Geolocation'],
    result: '🏆 Mjanga AI Hackathon 2026 · Africa-wide 1st place',
    image: 'img/Afya home page.jpeg',
    alt: 'AfyaAI conversational medical assistant home page',
    links: [{ label: 'GitHub ↗', href: 'https://github.com/elviscgn/AfyaAI' }]
  },
  sieve: {
    label: 'Recruitment platform · 2026',
    title: 'Sieve',
    lede: 'An AI-assisted screening platform that parses candidate information and supports comparison without taking control away from recruiters.',
    points: [
      'Parses PDF resumes into structured candidate data.',
      'Generates role-specific evaluation rubrics from job descriptions.',
      'Streams candidate Q&A while allowing recruiters to override rankings and criteria.'
    ],
    tags: ['TypeScript', 'Node.js', 'MongoDB', 'SSE'],
    result: '',
    image: 'img/Sieve dashboard.jpeg',
    alt: 'Sieve candidate screening dashboard',
    links: [{ label: 'GitHub ↗', href: 'https://github.com/elviscgn/Sieve' }]
  }
};

const projectTabs = [...document.querySelectorAll('.project-tab')];
const featured = {
  label: document.getElementById('featured-label'),
  title: document.getElementById('featured-title'),
  lede: document.getElementById('featured-lede'),
  points: document.getElementById('featured-points'),
  tags: document.getElementById('featured-tags'),
  result: document.getElementById('featured-result'),
  links: document.getElementById('featured-links'),
  image: document.getElementById('featured-image')
};

function selectProject(key, moveFocus = false) {
  const project = projects[key];
  if (!project) return;
  projectTabs.forEach(tab => {
    const active = tab.dataset.project === key;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  featured.image.style.opacity = '0';
  window.setTimeout(() => {
    featured.label.textContent = project.label;
    featured.title.textContent = project.title;
    featured.lede.textContent = project.lede;
    featured.points.replaceChildren(...project.points.map(text => {
      const item = document.createElement('li'); item.textContent = text; return item;
    }));
    featured.tags.replaceChildren(...project.tags.map(text => {
      const tag = document.createElement('span'); tag.textContent = text; return tag;
    }));
    featured.result.textContent = project.result;
    featured.result.hidden = !project.result;
    featured.links.replaceChildren(...project.links.map(link => {
      const anchor = document.createElement('a');
      anchor.textContent = link.label; anchor.href = link.href; anchor.target = '_blank'; anchor.rel = 'noreferrer'; return anchor;
    }));
    featured.image.onload = () => { featured.image.style.opacity = '1'; };
    featured.image.src = project.image;
    featured.image.alt = project.alt;
    if (featured.image.complete) featured.image.style.opacity = '1';
  }, 120);
}

projectTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProject(tab.dataset.project));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = projectTabs[(index + direction + projectTabs.length) % projectTabs.length];
    selectProject(next.dataset.project, true);
  });
});

const wins = {
  geekulcha: {
    rank: '1st place',
    title: 'Geekulcha Annual Hackathon 2026',
    copy: 'Built Limi during Geekulcha’s annual hackathon: a multilingual accessibility engine that converts learning content into structured text, synchronized native speech and 3D South African Sign Language. The team won first place.',
    image: 'img/geekulcha-2026-win.jpg',
    alt: 'Limi team receiving the first-place cheque at the Geekulcha Annual Hackathon 2026',
    caption: 'Limi team · Geekulcha Annual Hackathon · 27 September 2026'
  },
  itweb: {
    rank: '1st place',
    title: 'ITWeb Security Summit Hackathon 2026',
    copy: 'Built Doria in 24 hours to defend AI-assisted development from slopsquatting and malicious software packages. The tool evaluates package metadata and install risk before code reaches disk, earning first place at the ITWeb Security Summit Hackathon.',
    image: 'img/itweb-2026-win.jpg',
    alt: 'Doria team receiving the national first-place award at the ITWeb Security Summit Hackathon',
    caption: 'Doria team · ITWeb Security Summit · Sandton Convention Centre'
  },
  mjanga: {
    rank: 'Africa-wide · 1st place',
    title: 'Mjanga AI Hackathon 2026',
    copy: 'Built AfyaAI to make urgent health guidance more accessible across languages and low-connectivity environments. Its FastAPI backend coordinates translation, voice guidance, AI severity assessment and clinic routing, winning first place across the continental competition.',
    image: 'img/Afya home page.jpeg',
    alt: 'AfyaAI multilingual medical assistant interface',
    caption: 'AfyaAI · winning build at the Mjanga AI Hackathon'
  }
};

const winTabs = [...document.querySelectorAll('.win-tab')];
const winView = {
  image: document.getElementById('win-image'), caption: document.getElementById('win-caption'),
  rank: document.getElementById('win-rank'), title: document.getElementById('win-title'), copy: document.getElementById('win-copy')
};

function selectWin(key, moveFocus = false) {
  const win = wins[key];
  if (!win) return;
  winTabs.forEach(tab => {
    const active = tab.dataset.win === key;
    tab.classList.toggle('current', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  winView.image.style.opacity = '0';
  window.setTimeout(() => {
    winView.rank.textContent = win.rank;
    winView.title.textContent = win.title;
    winView.copy.textContent = win.copy;
    winView.caption.textContent = win.caption;
    winView.image.onload = () => { winView.image.style.opacity = '1'; };
    winView.image.src = win.image;
    winView.image.alt = win.alt;
    if (winView.image.complete) winView.image.style.opacity = '1';
  }, 120);
}

winTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectWin(tab.dataset.win));
  tab.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const next = winTabs[(index + direction + winTabs.length) % winTabs.length];
    selectWin(next.dataset.win, true);
  });
});
