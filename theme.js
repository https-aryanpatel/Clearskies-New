/**
 * theme.js — Light / Dark theme toggle for ClearSkies
 * Handles: theme persistence (localStorage), light-mode sky background
 * with animated clouds & sun, and dark-mode Three.js star canvas.
 */
(function () {
  'use strict';

  /* ─── 1.  Apply saved theme immediately (before paint) ────────────────── */
  var saved = localStorage.getItem('clearskies-theme') || 'dark';
  if (saved === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  /* ─── 2.  Inject CSS ───────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    /* ── Light-theme body / background ── */
    'html.light-theme body {',
    '  background: linear-gradient(180deg,#87ceeb 0%,#b0d9f5 45%,#ddeeff 100%) !important;',
    '  color: #1e293b !important;',
    '}',

    /* ── Hide Three.js star canvas in light mode ── */
    'html.light-theme #bg-canvas { display:none !important; }',

    /* ── Light sky background container ── */
    '#light-bg {',
    '  position:fixed; top:0; left:0; width:100%; height:100%;',
    '  z-index:-1; overflow:hidden; pointer-events:none;',
    '  display:none;',
    '  background:linear-gradient(180deg,#87ceeb 0%,#b0d9f5 45%,#ddeeff 100%);',
    '}',
    'html.light-theme #light-bg { display:block; }',

    /* ── Sun ── */
    '#light-bg .sky-sun {',
    '  position:absolute; top:8%; right:12%;',
    '  width:90px; height:90px; border-radius:50%;',
    '  background:radial-gradient(circle at 40% 40%,#fff7a1 0%,#ffe033 40%,#ffb300 75%,#ff8c00 100%);',
    '  box-shadow:0 0 0 18px rgba(255,200,0,.18),0 0 0 36px rgba(255,200,0,.10),0 0 60px rgba(255,180,0,.5);',
    '  animation:sun-pulse 5s ease-in-out infinite;',
    '}',
    '@keyframes sun-pulse {',
    '  0%,100%{box-shadow:0 0 0 18px rgba(255,200,0,.18),0 0 0 36px rgba(255,200,0,.10),0 0 60px rgba(255,180,0,.5);transform:scale(1);}',
    '  50%{box-shadow:0 0 0 24px rgba(255,200,0,.22),0 0 0 48px rgba(255,200,0,.12),0 0 90px rgba(255,180,0,.65);transform:scale(1.04);}',
    '}',

    /* ── Cloud base shape ── */
    '#light-bg .sky-cloud {',
    '  position:absolute; background:white;',
    '  border-radius:50px; opacity:.88;',
    '  animation-timing-function:linear; animation-iteration-count:infinite;',
    '}',
    '#light-bg .sky-cloud::before,',
    '#light-bg .sky-cloud::after {',
    '  content:""; position:absolute; background:white; border-radius:50%;',
    '}',
    /* cloud bumps */
    '#light-bg .sky-cloud::before { width:55%; height:180%; top:-70%; left:15%; }',
    '#light-bg .sky-cloud::after  { width:40%; height:140%; top:-55%; right:18%; }',

    /* ── Individual clouds (size + position + speed) ── */
    '#light-bg .c1{width:220px;height:60px;top:12%;animation:cloud-ltr 50s -10s linear infinite;}',
    '#light-bg .c2{width:160px;height:48px;top:22%;animation:cloud-rtl 38s -5s  linear infinite;}',
    '#light-bg .c3{width:280px;height:70px;top:33%;animation:cloud-ltr 62s -20s linear infinite;}',
    '#light-bg .c4{width:130px;height:40px;top:18%;animation:cloud-ltr 44s -30s linear infinite;}',
    '#light-bg .c5{width:200px;height:55px;top:42%;animation:cloud-rtl 55s -15s linear infinite;}',
    '#light-bg .c6{width:170px;height:50px;top:28%;animation:cloud-ltr 48s -25s linear infinite;}',
    '#light-bg .c7{width:240px;height:65px;top:8%; animation:cloud-rtl 65s -40s linear infinite;}',
    '#light-bg .c8{width:100px;height:32px;top:50%;animation:cloud-ltr 36s -8s  linear infinite;}',

    /* ── Scroll directions ── */
    '@keyframes cloud-ltr { 0%{transform:translateX(-160%)} 100%{transform:translateX(110vw)} }',
    '@keyframes cloud-rtl { 0%{transform:translateX(110vw)} 100%{transform:translateX(-160%)} }',

    /* ── Glass panels ── */
    'html.light-theme .glass-panel {',
    '  background:rgba(255,255,255,.55) !important;',
    '  border-color:rgba(180,220,255,.55) !important;',
    '}',

    /* ── Navbar ── */
    'html.light-theme #navbar {',
    '  background:rgba(255,255,255,.30) !important;',
    '  border-color:rgba(255,255,255,.55) !important;',
    '}',
    'html.light-theme #navbar.bg-black\\/50 {',
    '  background:rgba(255,255,255,.55) !important;',
    '}',
    /* Nav links & logo text in light mode */
    'html.light-theme #navbar .text-white,',
    'html.light-theme #navbar span { color:#1e293b !important; }',
    'html.light-theme #navbar a:not(.text-emerald-400) { color:#475569 !important; }',

    /* ── Mobile menu ── */
    'html.light-theme #mobile-menu {',
    '  background:rgba(240,250,255,.98) !important;',
    '  border-color:rgba(180,215,240,.55) !important;',
    '}',
    'html.light-theme #mobile-menu .text-white,',
    'html.light-theme #mobile-menu span { color:#1e293b !important; }',
    'html.light-theme #mobile-menu a:not(.text-emerald-400) { color:#475569 !important; }',
    'html.light-theme #mobile-menu .border-gray-700\\/50 { border-color:rgba(180,215,240,.5) !important; }',
    'html.light-theme #mobile-menu .hover\\:bg-gray-800\\/50:hover { background:rgba(180,215,240,.35) !important; }',
    'html.light-theme #mobile-menu .bg-gray-800\\/50 { background:rgba(200,230,255,.4) !important; }',
    'html.light-theme #mobile-menu .text-gray-300,',
    'html.light-theme #mobile-menu .text-gray-400 { color:#64748b !important; }',

    /* ── Content text overrides ── */
    'html.light-theme .text-white { color:#1e293b !important; }',
    'html.light-theme .text-gray-100 { color:#1e293b !important; }',
    'html.light-theme .text-gray-200 { color:#334155 !important; }',
    'html.light-theme .text-gray-300 { color:#475569 !important; }',
    'html.light-theme .text-gray-400 { color:#64748b !important; }',

    /* ── Card / panel backgrounds ── */
    'html.light-theme .bg-gray-800\\/50 { background:rgba(200,225,245,.45) !important; }',
    'html.light-theme .bg-gray-800 { background:rgba(210,230,250,.6) !important; }',
    'html.light-theme .bg-gray-900 { background:rgba(220,235,255,.7) !important; }',

    /* ── Theme toggle button always visible ── */
    '.theme-toggle-btn {',
    '  display:inline-flex; align-items:center; justify-content:center;',
    '  min-width:40px; min-height:40px; touch-action:manipulation;',
    '}',
    '.theme-toggle-btn .icon-sun { display:none; }',
    '.theme-toggle-btn .icon-moon { display:block; }',
    'html.light-theme .theme-toggle-btn .icon-sun { display:block; }',
    'html.light-theme .theme-toggle-btn .icon-moon { display:none; }',
  ].join('\n');
  document.head.appendChild(style);

  /* ─── 3.  Create the light-mode sky background ─────────────────────────── */
  function createLightBg() {
    if (document.getElementById('light-bg')) return;
    var bg = document.createElement('div');
    bg.id = 'light-bg';
    /* Sun */
    var sun = document.createElement('div');
    sun.className = 'sky-sun';
    bg.appendChild(sun);
    /* Clouds */
    for (var i = 1; i <= 8; i++) {
      var c = document.createElement('div');
      c.className = 'sky-cloud c' + i;
      bg.appendChild(c);
    }
    document.body.appendChild(bg);
  }

  /* ─── 4.  Toggle handler ───────────────────────────────────────────────── */
  function applyTheme(isLight) {
    var canvas = document.getElementById('bg-canvas');
    if (isLight) {
      createLightBg();
      document.getElementById('light-bg').style.display = 'block';
      if (canvas) canvas.style.display = 'none';
    } else {
      var lb = document.getElementById('light-bg');
      if (lb) lb.style.display = 'none';
      if (canvas) canvas.style.display = 'block';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var isLight = document.documentElement.classList.contains('light-theme');
    applyTheme(isLight);

    /* Event delegation — works for buttons added anywhere */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-toggle-btn');
      if (!btn) return;
      var nowLight = document.documentElement.classList.toggle('light-theme');
      localStorage.setItem('clearskies-theme', nowLight ? 'light' : 'dark');
      applyTheme(nowLight);
    });
  });
}());
