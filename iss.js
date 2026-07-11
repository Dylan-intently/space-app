// ============================================
// ISS globe, trajectory, telemetry, crew, near-earth objects
// ============================================

// ---------- Globe setup ----------
const globe = Globe()(document.getElementById('globeViz'))
  .backgroundColor('rgba(0,0,0,0)')
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .showAtmosphere(true)
  .atmosphereColor('#8b7cff')
  .atmosphereAltitude(0.18)
  .pointsData([])
  .pointLat('lat')
  .pointLng('lng')
  .pointColor(() => '#ff5c4d')
  .pointAltitude(0.02)
  .pointRadius(0.55)
  .pathsData([])
  .pathPoints('coords')
  .pathPointLat(p => p[0])
  .pathPointLng(p => p[1])
  .pathColor(() => ['rgba(139,124,255,0.9)', 'rgba(78,161,255,0.1)'])
  .pathDashLength(0.01)
  .pathDashGap(0.004)
  .pathDashAnimateTime(6000)
  .pathStroke(1.6);

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.4;
globe.pointOfView({ altitude: 2.4 });

window.addEventListener('resize', () => {
  globe.width(document.getElementById('globeViz').clientWidth);
  globe.height(document.getElementById('globeViz').clientHeight);
});
setTimeout(() => window.dispatchEvent(new Event('resize')), 200);

// ---------- Live telemetry ----------
async function updateTelemetry() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const d = await res.json();
    document.getElementById('t-lat').textContent = d.latitude.toFixed(2) + '°';
    document.getElementById('t-lon').textContent = d.longitude.toFixed(2) + '°';
    document.getElementById('t-alt').textContent = d.altitude.toFixed(1) + ' km';
    document.getElementById('t-vel').textContent = Math.round(d.velocity) + ' km/h';

    globe.pointsData([{ lat: d.latitude, lng: d.longitude }]);
    globe.pointOfView({ lat: d.latitude, lng: d.longitude, altitude: 2.2 }, 1200);
  } catch (e) {
    // silent — keep last known values on screen
  }
}

// ---------- Trajectory: sample past + future positions along the orbit ----------
async function loadTrajectory() {
  const now = Math.floor(Date.now() / 1000);
  const stepSeconds = 8 * 60; // 8 minute steps
  const stepsEachSide = 9;    // ~72 min each direction (under one 92min orbit)
  const timestamps = [];
  for (let i = -stepsEachSide; i <= stepsEachSide; i++) {
    timestamps.push(now + i * stepSeconds);
  }

  try {
    const results = await Promise.all(
      timestamps.map(ts =>
        fetch(`https://api.wheretheiss.at/v1/satellites/25544?timestamp=${ts}`).then(r => r.json())
      )
    );
    const coords = results.map(r => [r.latitude, r.longitude]);
    globe.pathsData([{ coords }]);
  } catch (e) {
    // trajectory is a nice-to-have; fail quietly
  }
}

updateTelemetry();
loadTrajectory();
setInterval(updateTelemetry, 8000);
setInterval(loadTrajectory, 5 * 60 * 1000);

// ---------- Crew currently in orbit ----------
async function loadCrew() {
  const row = document.getElementById('astro-row');
  try {
    const res = await fetch('http://api.open-notify.org/astros.json');
    const data = await res.json();
    document.getElementById('astro-count').textContent = `${data.number} aboard`;
    row.innerHTML = data.people.map(p => `
      <div class="astro-chip">${p.name}<div class="craft">${p.craft}</div></div>
    `).join('');
  } catch (e) {
    row.innerHTML = `<div class="state-msg">Crew roster unavailable right now.</div>`;
  }
}
loadCrew();

// ---------- Near-Earth objects (today) ----------
async function loadNeo() {
  const list = document.getElementById('neo-list');
  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    const objects = data.near_earth_objects[today] || [];
    objects.sort((a, b) =>
      parseFloat(a.close_approach_data[0].miss_distance.kilometers) -
      parseFloat(b.close_approach_data[0].miss_distance.kilometers)
    );

    if (objects.length === 0) {
      list.innerHTML = `<div class="state-msg">No tracked close approaches today.</div>`;
      return;
    }

    list.innerHTML = objects.map(o => {
      const approach = o.close_approach_data[0];
      const distKm = Math.round(parseFloat(approach.miss_distance.kilometers)).toLocaleString();
      const speedKph = Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)).toLocaleString();
      const diameter = Math.round(o.estimated_diameter.meters.estimated_diameter_max);
      const hazardous = o.is_potentially_hazardous_asteroid;
      return `
        <div class="neo-card">
          <div>
            <div class="name">${o.name.replace(/[()]/g, '')}</div>
            <div class="sub">~${diameter}m · ${speedKph} km/h</div>
            <div class="hazard ${hazardous ? 'watch' : 'safe'}" style="margin-top:6px; display:inline-block;">${hazardous ? 'Monitored' : 'Routine'}</div>
          </div>
          <div class="dist">
            <div class="num">${distKm}</div>
            <div class="unit">km miss dist.</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div class="state-msg">Couldn't load near-Earth data — check your NASA API key in js/config.js.</div>`;
  }
}
loadNeo();
