// ============================================
// Mars rover photo swipe stack
// ============================================
const stackEl = document.getElementById('stack');
const loadingMsg = document.getElementById('loading-msg');
const progressLine = document.getElementById('progress-line');

let photos = [];
let index = 0; // current top-of-stack index into `photos`

async function fetchRover(rover) {
  const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${NASA_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    return (data.latest_photos || []).map(p => ({
      img: p.img_src,
      rover: p.rover.name,
      cam: p.camera.full_name,
      date: p.earth_date
    }));
  } catch (e) {
    return [];
  }
}

async function init() {
  const [curiosity, perseverance] = await Promise.all([
    fetchRover('curiosity'),
    fetchRover('perseverance')
  ]);
  // interleave the two rovers so the feed alternates rather than blocks
  const merged = [];
  const max = Math.max(curiosity.length, perseverance.length);
  for (let i = 0; i < max; i++) {
    if (curiosity[i]) merged.push(curiosity[i]);
    if (perseverance[i]) merged.push(perseverance[i]);
  }
  photos = merged;

  loadingMsg.remove();

  if (photos.length === 0) {
    stackEl.innerHTML = `<div class="state-msg" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; text-align:center; padding:0 30px;">
      No transmissions right now — check your NASA API key in js/config.js, or try again shortly.
    </div>`;
    return;
  }

  renderStack();
}

function makeCard(photo) {
  const card = document.createElement('div');
  card.className = 'card-photo';
  card.innerHTML = `
    <img src="${photo.img}" alt="Mars surface photo from ${photo.rover}" loading="lazy">
    <div class="stamp next">NEXT</div>
    <div class="stamp back">BACK</div>
    <div class="meta">
      <div class="rover">${photo.rover}</div>
      <div class="cam">${photo.cam} · ${photo.date}</div>
    </div>
  `;
  return card;
}

function renderStack() {
  stackEl.querySelectorAll('.card-photo').forEach(c => c.remove());
  progressLine.textContent = `${index + 1} / ${photos.length}`;

  // render a couple of cards behind the top one for depth
  for (let depth = 2; depth >= 0; depth--) {
    const i = index + depth;
    if (i >= photos.length) continue;
    const card = makeCard(photos[i]);
    card.style.transform = `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`;
    card.style.zIndex = 10 - depth;
    if (depth > 0) card.style.pointerEvents = 'none';
    stackEl.appendChild(card);
    if (depth === 0) attachDrag(card);
  }
}

function attachDrag(card) {
  let startX = 0, startY = 0, dx = 0, dragging = false;
  const nextStamp = card.querySelector('.stamp.next');
  const backStamp = card.querySelector('.stamp.back');

  function onDown(x, y) {
    dragging = true;
    startX = x; startY = y;
    card.style.transition = 'none';
  }
  function onMove(x, y) {
    if (!dragging) return;
    dx = x - startX;
    const rot = dx / 20;
    card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
    const progress = Math.min(Math.abs(dx) / 100, 1);
    if (dx < 0) { nextStamp.style.opacity = progress; backStamp.style.opacity = 0; }
    else { backStamp.style.opacity = progress; nextStamp.style.opacity = 0; }
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    card.style.transition = '';
    const threshold = 90;
    if (dx <= -threshold) {
      swipe('next', card);
    } else if (dx >= threshold) {
      swipe('back', card);
    } else {
      card.style.transform = '';
      nextStamp.style.opacity = 0;
      backStamp.style.opacity = 0;
    }
    dx = 0;
  }

  card.addEventListener('touchstart', e => onDown(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  card.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  card.addEventListener('touchend', onUp);

  card.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);
}

function swipe(direction, card) {
  if (direction === 'next') {
    if (index >= photos.length - 1) { snapBack(card); return; }
    card.style.transform = `translateX(-140%) rotate(-18deg)`;
    card.style.opacity = '0';
    index++;
  } else {
    if (index <= 0) { snapBack(card); return; }
    card.style.transform = `translateX(140%) rotate(18deg)`;
    card.style.opacity = '0';
    index--;
  }
  setTimeout(renderStack, 260);
}

function snapBack(card) {
  card.style.transform = '';
}

document.getElementById('btn-next').addEventListener('click', () => {
  const top = stackEl.querySelector('.card-photo[style*="z-index: 10"]');
  if (top) swipe('next', top);
});
document.getElementById('btn-back').addEventListener('click', () => {
  const top = stackEl.querySelector('.card-photo[style*="z-index: 10"]');
  if (top) swipe('back', top);
});

init();
