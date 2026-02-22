document.addEventListener('DOMContentLoaded', function () {
  initDashboard();
});

function initDashboard() {
  initFirebaseRealtimeListeners();
}

function initFirebaseRealtimeListeners() {
  if (!window.firebase || !firebase.apps || !firebase.apps.length) {
    console.error('Firebase not initialized. Check FIREBASE_CONFIG in firebase-config.js');
    setConnectionStatus('OFFLINE', 'Firebase not initialized');
    return;
  }

  const db = firebase.database();

   //New part
     const OFFLINE_TIMEOUT = 15; // seconds

  db.ref('/status').on('value', (snapshot) => {
    const status = snapshot.val();
    const el = document.getElementById('esp32-status');
    if (!el) return;

    if (!status || !status.last_seen) {
      setOffline(el, 'NO DATA');
      return;
    }
    // Restart counter
if (status.restart_count != null) {
  setText('restartText', status.restart_count);
}

    const now = Math.floor(Date.now() / 1000);
    const diff = now - status.last_seen;

    if (diff <= OFFLINE_TIMEOUT) {
      el.textContent = 'ESP32: ONLINE';
      el.className =
        'px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-green-900';
    } else {
      setOffline(el, formatDuration(diff));
    }

    el.title =
      'Last seen: ' +
      new Date(status.last_seen * 1000).toLocaleString();
  });



  // Firebase connection status
  db.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
      setConnectionStatus('ONLINE', 'Connected to Firebase');
    } else {
      setConnectionStatus('OFFLINE', 'Disconnected from Firebase');
    }
  });

  // ENVIRONMENT DATA
  db.ref('environment').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const aqi = toNumber(data.air_quality);
    const temp = toNumber(data.temperature);
    const humidity = toNumber(data.humidity);

    setText('aqiText', aqi === null ? '--' : String(aqi));
    setText('tempText', temp === null ? '--' : String(temp));
    setText('humidityText', humidity === null ? '--' : String(humidity));

    updateAqiBadge(aqi);
    updateHealthRecommendations(aqi);

    if (window.aqiGauge && aqi !== null) {

  window.aqiGauge.updateSeries([aqi]);

  let color = "#22c55e"; // default green

  if (aqi <= 50) color = "#22c55e";          // Good
  else if (aqi <= 100) color = "#eab308";    // Moderate
  else if (aqi <= 200) color = "#ef4444";    // Unhealthy
  else color = "#a855f7";                    // Hazardous

  window.aqiGauge.updateOptions({
    colors: [color]
  });
}
    if (window.tempGauge && temp !== null) {

  window.tempGauge.updateSeries([temp]);

  let color = "#3b82f6"; // cold (blue)

  if (temp < 20) color = "#3b82f6";          // Cold
  else if (temp < 30) color = "#22c55e";     // Normal
  else if (temp < 40) color = "#f97316";     // Warm
  else color = "#ef4444";                    // Hot

  window.tempGauge.updateOptions({
    colors: [color]
  });
}
    if (window.humidityGauge && humidity !== null) {

  window.humidityGauge.updateSeries([humidity]);

  let color = "#3b82f6"; // low humidity (blue)

  if (humidity < 30) color = "#3b82f6";      // Dry
  else if (humidity <= 70) color = "#22c55e";// Comfortable
  else color = "#f97316";                    // Humid

  window.humidityGauge.updateOptions({
    colors: [color]
  });
}

    updateChartsWithLatest(aqi, temp, humidity);
    updateCurrentTime();
  });

  // SOLAR DATA (optional)
  db.ref('solar').on('value', (snapshot) => {

  const solar = snapshot.val();
  if (!solar) return;

  const servo = toNumber(solar.servo_angle);

  setText('servoText', servo);

  if (window.servoGauge && servo !== null)
      window.servoGauge.updateSeries([servo]);

  // Direction logic
  let direction = "Center";

  if (servo < 70) direction = "East";
  else if (servo > 110) direction = "West";

  document.getElementById("solarDirection").innerText = direction;

  // Alignment status
  document.getElementById("solarStatus").innerText =
      "Tracking Active";

});
}

function setupEventListeners() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      const icon = this.querySelector('i');
      if (icon) icon.classList.add('animate-spin');

      setTimeout(() => {
        if (icon) icon.classList.remove('animate-spin');
        updateCurrentTime();
      }, 600);
    });
  }
}

// Browser online/offline (internet connection)
function setupOnlineOfflineListeners() {
  window.addEventListener('online', () => {
    setConnectionStatus('ONLINE', 'Internet connected');
  });

  window.addEventListener('offline', () => {
    setConnectionStatus('OFFLINE', 'No internet connection');
  });

  if (navigator.onLine === false) {
    setConnectionStatus('OFFLINE', 'No internet connection');
  }
}

// Updates the badge at top
function setConnectionStatus(state, reason) {
  const el = document.getElementById('connection-status');
  if (!el) return;

  if (state === 'ONLINE') {
    el.textContent = 'ONLINE';
    el.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-green-900';
  } else {
    el.textContent = 'OFFLINE';
    el.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-red-900';
  }

  el.title = reason || '';
}

function updateCurrentTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    timeElement.textContent = 'Last updated: ' + now.toLocaleDateString('en-US', options);
  }
}

function updateAqiBadge(aqi) {
  const badge = document.getElementById('aqiBadge');
  if (!badge) return;

  if (aqi === null) {
    badge.textContent = '--';
    badge.className = 'px-2 py-1 bg-gray-600 text-gray-100 text-xs font-medium rounded';
    return;
  }

  if (aqi < 50) {
    badge.textContent = 'Good';
    badge.className = 'px-2 py-1 bg-green-500 text-green-900 text-xs font-medium rounded';
  } else if (aqi < 100) {
    badge.textContent = 'Moderate';
    badge.className = 'px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-medium rounded';
  } else {
    badge.textContent = 'Unhealthy';
    badge.className = 'px-2 py-1 bg-red-500 text-red-900 text-xs font-medium rounded';
  }
}

/**
 * Health Recommendations based on AQI
 */
function updateHealthRecommendations(aqi) {
  const categoryEl = document.getElementById('aqiCategory');
  const tipsEl = document.getElementById('healthTips');
  const badgeEl = document.getElementById('healthBadge');

  if (!categoryEl || !tipsEl || !badgeEl) return;

  tipsEl.innerHTML = '';

  if (aqi === null) {
    categoryEl.textContent = '--';
    badgeEl.textContent = '--';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-200';
    addTip(tipsEl, 'Waiting for AQI data...');
    return;
  }

  if (aqi <= 50) {
    categoryEl.textContent = 'Good';
    badgeEl.textContent = 'SAFE';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-green-900';
    addTip(tipsEl, 'Enjoy outdoor activities normally.');
    addTip(tipsEl, 'Good time for walking/jogging.');
    addTip(tipsEl, 'Open windows for ventilation if comfortable.');
  } else if (aqi <= 100) {
    categoryEl.textContent = 'Moderate';
    badgeEl.textContent = 'CAUTION';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-yellow-900';
    addTip(tipsEl, 'Most people can continue outdoor activities.');
    addTip(tipsEl, 'Sensitive individuals: reduce prolonged outdoor exertion.');
    addTip(tipsEl, 'If irritation occurs, take breaks indoors.');
  } else if (aqi <= 150) {
    categoryEl.textContent = 'Unhealthy for Sensitive Groups';
    badgeEl.textContent = 'LIMIT';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-orange-900';
    addTip(tipsEl, 'Children/elderly/asthma/heart patients: limit outdoor time.');
    addTip(tipsEl, 'Wear a well-fitted N95/KN95 mask if going outside.');
    addTip(tipsEl, 'Keep windows closed during peak pollution hours.');
  } else if (aqi <= 200) {
    categoryEl.textContent = 'Unhealthy';
    badgeEl.textContent = 'AVOID';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-red-900';
    addTip(tipsEl, 'Avoid outdoor exercise; stay indoors as much as possible.');
    addTip(tipsEl, 'Use an air purifier if available.');
    addTip(tipsEl, 'N95/KN95 recommended if you must go out.');
  } else if (aqi <= 300) {
    categoryEl.textContent = 'Very Unhealthy';
    badgeEl.textContent = 'ALERT';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-purple-900';
    addTip(tipsEl, 'Stay indoors; keep activity levels low.');
    addTip(tipsEl, 'Close windows/doors; avoid indoor smoke/fumes.');
    addTip(tipsEl, 'Seek medical help if breathing issues occur.');
  } else {
    categoryEl.textContent = 'Hazardous';
    badgeEl.textContent = 'DANGER';
    badgeEl.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-rose-600 text-rose-100';
    addTip(tipsEl, 'Avoid going outside unless absolutely necessary.');
    addTip(tipsEl, 'Strict N95/KN95 + minimize exposure time if you go out.');
    addTip(tipsEl, 'High-risk groups should follow medical advice strictly.');
  }
}

function addTip(listEl, text) {
  const li = document.createElement('li');
  li.textContent = text;
  listEl.appendChild(li);
}

function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateChartsWithLatest(aqi, temp, humidity) {
  // AQI rolling
  if (window.aqiTrendChart && aqi !== null) {
    const series = window.aqiTrendChart.w.globals.series[0] || [];
    const current = series.slice(-6);
    const next = [...current, aqi];
    window.aqiTrendChart.updateSeries([{ name: 'AQI', data: next }], true);
  }

  // Temp/Humidity rolling
  if (window.tempHumidityChart) {
    const s0 = (window.tempHumidityChart.w?.globals?.series?.[0] || []).slice(-7);
    const s1 = (window.tempHumidityChart.w?.globals?.series?.[1] || []).slice(-7);

    const nextT = [...s0, temp ?? (s0[s0.length - 1] ?? 0)];
    const nextH = [...s1, humidity ?? (s1[s1.length - 1] ?? 0)];

    window.tempHumidityChart.updateSeries(
      [
        { name: 'Temperature', type: 'line', data: nextT },
        { name: 'Humidity', type: 'area', data: nextH }
      ],
      true
    );
  }
}
// ================= HELPERS =================

function setOffline(el, timeText) {
  el.textContent = `ESP32: OFFLINE (${timeText})`;
  el.className =
    'px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-red-900';
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;

  return remainingMin
    ? `${hours} hr ${remainingMin} min`
    : `${hours} hr`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '--';
}
