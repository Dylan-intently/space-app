// ============================================
// Picture of the Day — fetch + save/download/share
// ============================================
const SAVE_KEY = 'orbit_saved_apod';

function getSaved() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; }
  catch (e) { return []; }
}
function setSaved(list) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(list));
}

let current = null;

async function loadApod() {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    current = data;
    renderApod(data);
  } catch (e) {
    document.getElementById('media-wrap').innerHTML =
      `<div class="state-msg" style="padding:60px 20px;">Couldn't load today's picture — check your NASA API key in js/config.js.</div>`;
  }
}

function renderApod(data) {
  const mediaWrap = document.getElementById('media-wrap');
  const isVideo = data.media_type === 'video';
  const savedList = getSaved();
  const alreadySaved = savedList.some(s => s.date === data.date);

  mediaWrap.innerHTML = `
    ${isVideo
      ? `<iframe src="${data.url}" style="width:100%; aspect-ratio:16/9; border:0;" allowfullscreen></iframe>`
      : `<img src="${data.hdurl || data.url}" alt="${data.title}">`
    }
    <button class="save-btn ${alreadySaved ? 'saved' : ''}" id="save-toggle">${alreadySaved ? '♥' : '♡'}</button>
  `;

  document.getElementById('apod-date').textContent = data.date;
  document.getElementById('apod-title').textContent = data.title;
  document.getElementById('apod-explanation').textContent = data.explanation;

  document.getElementById('save-toggle').addEventListener('click', toggleSave);
}

function toggleSave() {
  const btn = document.getElementById('save-toggle');
  let list = getSaved();
  const exists = list.some(s => s.date === current.date);
  if (exists) {
    list = list.filter(s => s.date !== current.date);
    btn.classList.remove('saved');
    btn.textContent = '♡';
  } else {
    list.unshift({ date: current.date, title: current.title, url: current.hdurl || current.url, media_type: current.media_type });
    btn.classList.add('saved');
    btn.textContent = '♥';
  }
  setSaved(list);
  renderSavedGrid();
}

function renderSavedGrid() {
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('saved-empty');
  const list = getSaved();
  grid.innerHTML = '';
  if (list.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.forEach(item => {
    const img = document.createElement('img');
    img.src = item.media_type === 'video' ? 'https://placehold.co/400x400/1a1a24/9a9ba8?text=Video' : item.url;
    img.alt = item.title;
    img.title = item.title;
    grid.appendChild(img);
  });
}

document.getElementById('btn-download').addEventListener('click', () => {
  if (!current) return;
  const link = document.createElement('a');
  link.href = current.hdurl || current.url;
  link.download = `${current.date}-${current.title.replace(/\s+/g, '-')}.jpg`;
  link.target = '_blank';
  link.click();
});

document.getElementById('btn-share').addEventListener('click', async () => {
  if (!current) return;
  const shareData = { title: current.title, text: current.title, url: current.hdurl || current.url };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(shareData.url);
    alert('Link copied to clipboard');
  }
});

document.getElementById('tab-today').addEventListener('click', () => {
  document.getElementById('tab-today').classList.add('active');
  document.getElementById('tab-saved').classList.remove('active');
  document.getElementById('view-today').classList.remove('hidden');
  document.getElementById('view-saved').classList.add('hidden');
});
document.getElementById('tab-saved').addEventListener('click', () => {
  document.getElementById('tab-saved').classList.add('active');
  document.getElementById('tab-today').classList.remove('active');
  document.getElementById('view-saved').classList.remove('hidden');
  document.getElementById('view-today').classList.add('hidden');
  renderSavedGrid();
});

if (window.location.hash === '#saved') {
  document.getElementById('tab-saved').click();
}

loadApod();
renderSavedGrid();
