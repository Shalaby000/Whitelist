/* ── State ─────────────────────────────────────────────────── */
const STORAGE_KEY = 'media_items_v1';

let items = loadItems();
let currentFilter = 'all';
let currentFile = null; // holds the selected File object

/* ── DOM refs ──────────────────────────────────────────────── */
const grid          = document.getElementById('grid');
const empty         = document.getElementById('empty');
const urlInput      = document.getElementById('urlInput');
const titleInput    = document.getElementById('titleInput');
const addUrlBtn     = document.getElementById('addUrlBtn');
const fileInput     = document.getElementById('fileInput');
const fileNameEl    = document.getElementById('fileName');
const addFileBtn    = document.getElementById('addFileBtn');
const clearBtn      = document.getElementById('clearBtn');
const navBtns       = document.querySelectorAll('.nav-btn');

const playerSection = document.getElementById('playerSection');
const videoPlayer   = document.getElementById('videoPlayer');
const audioPlayer   = document.getElementById('audioPlayer');
const nowTitle      = document.getElementById('nowTitle');
const closePlayer   = document.getElementById('closePlayer');

/* ── Helpers ───────────────────────────────────────────────── */
function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveItems() {
  // Only save non-blob items (blobs are session-only)
  const saveable = items.map(it => {
    if (it.blob) return { ...it, src: null, blob: true }; // mark as blob, src lost on reload
    return it;
  }).filter(it => !it.blob); // drop blob items on save — they can't persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function detectType(src) {
  const s = src.toLowerCase().split('?')[0];
  if (/\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/.test(s)) return 'video';
  if (/\.(mp3|wav|ogg|flac|aac|m4a|opus)$/.test(s)) return 'audio';
  // YouTube / common video hosts
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(src)) return 'video';
  // Soundcloud / spotify
  if (/soundcloud\.com|spotify\.com/.test(src)) return 'audio';
  return 'video'; // default
}

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getYouTubeEmbed(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
}

function getYouTubeThumb(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

/* ── Render ─────────────────────────────────────────────────── */
function render() {
  const filtered = currentFilter === 'all'
    ? items
    : items.filter(it => it.type === currentFilter);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;

    // Thumbnail
    let thumbInner = item.type === 'video' ? '▶' : '♪';
    if (item.thumb) {
      thumbInner = `<img src="${item.thumb}" alt="" loading="lazy" onerror="this.style.display='none'" />`;
    }

    card.innerHTML = `
      <div class="card-thumb">
        ${thumbInner}
        <span class="card-badge">${item.type}</span>
      </div>
      <div class="card-info">
        <div class="card-title" title="${item.title}">${item.title}</div>
      </div>
      <button class="card-del" data-id="${item.id}" title="Remove">✕</button>
    `;

    card.addEventListener('click', e => {
      if (e.target.classList.contains('card-del')) return;
      playItem(item);
    });

    card.querySelector('.card-del').addEventListener('click', e => {
      e.stopPropagation();
      removeItem(item.id);
    });

    grid.appendChild(card);
  });
}

/* ── Play ───────────────────────────────────────────────────── */
function playItem(item) {
  // Stop both players
  videoPlayer.pause();
  audioPlayer.pause();
  videoPlayer.src = '';
  audioPlayer.src = '';
  videoPlayer.classList.add('hidden');
  audioPlayer.classList.add('hidden');

  playerSection.classList.remove('hidden');
  nowTitle.textContent = item.title;

  if (item.youtube) {
    // Replace video element with iframe for YouTube
    let iframe = document.getElementById('ytFrame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'ytFrame';
      iframe.style.cssText = 'width:100%;max-height:52vh;min-height:280px;border:none;display:block;';
      iframe.allow = 'autoplay; encrypted-media; fullscreen';
      iframe.allowFullscreen = true;
    }
    iframe.src = item.ytEmbed;
    const wrap = document.getElementById('playerWrap');
    wrap.innerHTML = '';
    wrap.appendChild(iframe);
    return;
  }

  // Restore native players if we previously had a YouTube iframe
  restoreNativePlayers();

  if (item.type === 'video') {
    videoPlayer.classList.remove('hidden');
    videoPlayer.src = item.src;
    videoPlayer.play();
  } else {
    audioPlayer.classList.remove('hidden');
    audioPlayer.src = item.src;
    audioPlayer.play();
  }
}

function restoreNativePlayers() {
  const wrap = document.getElementById('playerWrap');
  // If there's an iframe, replace with original video/audio elements
  const iframe = document.getElementById('ytFrame');
  if (iframe) {
    wrap.innerHTML = '';
    wrap.appendChild(videoPlayer);
    wrap.appendChild(audioPlayer);
  }
}

/* ── Add URL ────────────────────────────────────────────────── */
addUrlBtn.addEventListener('click', () => {
  const raw = urlInput.value.trim();
  if (!raw) return;

  const type = detectType(raw);
  const title = titleInput.value.trim() || raw.split('/').pop().split('?')[0] || 'Untitled';
  const thumb = getYouTubeThumb(raw);
  const youtube = isYouTube(raw);
  const ytEmbed = youtube ? getYouTubeEmbed(raw) : null;

  items.unshift({ id: uid(), src: raw, type, title, thumb, youtube, ytEmbed });
  saveItems();
  render();

  urlInput.value = '';
  titleInput.value = '';
});

urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addUrlBtn.click(); });

/* ── Add File ───────────────────────────────────────────────── */
fileInput.addEventListener('change', () => {
  currentFile = fileInput.files[0] || null;
  fileNameEl.textContent = currentFile ? currentFile.name : 'No file chosen';
});

addFileBtn.addEventListener('click', () => {
  if (!currentFile) return;

  const src = URL.createObjectURL(currentFile);
  const type = currentFile.type.startsWith('video') ? 'video' : 'audio';
  const title = titleInput.value.trim() || currentFile.name.replace(/\.[^.]+$/, '');

  items.unshift({ id: uid(), src, type, title, blob: true });
  // Blob URLs don't persist — no need to save to localStorage
  render();

  fileInput.value = '';
  fileNameEl.textContent = 'No file chosen';
  titleInput.value = '';
  currentFile = null;
});

/* ── Remove ─────────────────────────────────────────────────── */
function removeItem(id) {
  const item = items.find(it => it.id === id);
  if (item?.blob && item.src) URL.revokeObjectURL(item.src);
  items = items.filter(it => it.id !== id);
  saveItems();

  // Close player if it was playing this item
  if (nowTitle.textContent === (item?.title || '')) closePlayer.click();
  render();
}

/* ── Clear all ──────────────────────────────────────────────── */
clearBtn.addEventListener('click', () => {
  if (!confirm('Remove all items?')) return;
  items.forEach(it => { if (it.blob && it.src) URL.revokeObjectURL(it.src); });
  items = [];
  localStorage.removeItem(STORAGE_KEY);
  closePlayer.click();
  render();
});

/* ── Close player ───────────────────────────────────────────── */
closePlayer.addEventListener('click', () => {
  videoPlayer.pause();
  audioPlayer.pause();
  videoPlayer.src = '';
  audioPlayer.src = '';
  const iframe = document.getElementById('ytFrame');
  if (iframe) iframe.src = '';
  restoreNativePlayers();
  playerSection.classList.add('hidden');
});

/* ── Filter nav ─────────────────────────────────────────────── */
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* ── Init ───────────────────────────────────────────────────── */
render();
