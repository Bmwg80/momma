const ALLOWED_PINS = ['1234', '1981', '0000'];
const $ = id => document.getElementById(id);

const pinDisplay = $('pinDisplay'), pinError = $('pinError'), keypad = $('keypad');
const pinCard = $('pinCard'), mainCard = $('mainCard');
let input = '';

/* ---------- Hartjes op de achtergrond ---------- */
const heartsLayer = $('hearts');
const EMOJIS = ['💕', '❤️', '💖', '🌸', '✨'];
function spawnHeart() {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    h.style.left = Math.random() * 100 + '%';
    h.style.fontSize = 14 + Math.random() * 20 + 'px';
    h.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    h.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
    h.style.animationDuration = 9 + Math.random() * 8 + 's';
    heartsLayer.appendChild(h);
    setTimeout(() => h.remove(), 18000);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(spawnHeart, 1100);

/* ---------- Confetti ---------- */
const cv = $('confetti'), ctx = cv.getContext('2d');
let parts = [], raf = null;
function sizeCanvas() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
sizeCanvas(); addEventListener('resize', sizeCanvas);
function confetti(n = 140) {
    const colors = ['#ff7597', '#f6c98b', '#fce4ec', '#e0527b', '#c9a0ff'];
    for (let i = 0; i < n; i++) parts.push({
        x: innerWidth / 2, y: innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 4,
        s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: colors[Math.floor(Math.random() * colors.length)], life: 1
    });
    if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
        ctx.save(); ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x * devicePixelRatio, p.y * devicePixelRatio); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s, -p.s / 2, p.s * 2 * devicePixelRatio / 2, p.s);
        ctx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    raf = parts.length ? requestAnimationFrame(tick) : null;
    if (!raf) ctx.clearRect(0, 0, cv.width, cv.height);
}

/* ---------- PIN ---------- */
function updateDisplay() {
    pinDisplay.textContent = ('●'.repeat(input.length) + '_'.repeat(4 - input.length)).slice(0, 4);
}
function showError(msg) {
    pinError.textContent = msg;
    pinDisplay.classList.add('shake');
    navigator.vibrate && navigator.vibrate([60, 40, 60]);
    setTimeout(() => pinDisplay.classList.remove('shake'), 500);
}
function tapFx(btn) {
    btn.classList.add('tap');
    navigator.vibrate && navigator.vibrate(12);
    setTimeout(() => btn.classList.remove('tap'), 140);
}
keypad.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    tapFx(btn);
    const val = btn.textContent.trim();
    if (/^[0-9]$/.test(val) && input.length < 4) {
        input += val; pinError.textContent = ''; updateDisplay();
    }
});
$('clear').addEventListener('click', () => { input = ''; pinError.textContent = ''; updateDisplay(); });
$('ok').addEventListener('click', () => {
    if (input.length !== 4) return showError('Voer 4 cijfers in');
    if (ALLOWED_PINS.includes(input)) {
        pinDisplay.classList.add('ok');
        confetti(160);
        setTimeout(() => { pinCard.classList.add('hidden'); mainCard.classList.remove('hidden'); }, 600);
    } else {
        showError('Onjuiste code');
        setTimeout(() => { input = ''; updateDisplay(); }, 700);
    }
});
updateDisplay();

/* ---------- Navigatie ---------- */
const viewer = $('viewer'), viewerInner = $('viewerInner');
const musicPlayer = $('musicPlayer'), playPause = $('playPause');

document.querySelectorAll('.gift').forEach(btn => btn.addEventListener('click', () => openViewer(btn.dataset.view)));

function openViewer(id) {
    viewer.classList.remove('hidden');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    mainCard.classList.add('hidden');
    showView(id);
    if (id === 'musicView' && musicPlayer) {
        musicPlayer.play().then(() => { playPause.textContent = '⏸'; }).catch(() => {});
    }
}
function closeViewer() {
    viewer.classList.add('hidden');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    mainCard.classList.remove('hidden');
}
$('viewerClose').addEventListener('click', closeViewer);
$('backToMenu').addEventListener('click', closeViewer);

function showView(id) {
    viewerInner.querySelectorAll('.view-section').forEach(s => s.classList.toggle('active', s.id === id));
    document.querySelectorAll('.top-action').forEach(b => b.classList.toggle('active', b.dataset.target === id));
    viewer.scrollTo(0, 0);
    if (id === 'photosView') document.querySelectorAll('.photo').forEach((p, i) => { p.style.setProperty('--i', i); p.style.animation = 'none'; p.offsetHeight; p.style.animation = ''; });
    if (id === 'textView') revealLetter();
}
$('toPhotosBtn').addEventListener('click', () => showView('photosView'));
$('toTextBtn').addEventListener('click', () => showView('textView'));
document.querySelectorAll('.top-action').forEach(b => b.addEventListener('click', () => showView(b.dataset.target)));

$('finishExpBtn').addEventListener('click', () => {
    ['backToMenu', 'topActions', 'viewerClose', 'photosMenuBtn', 'textMenuBtn'].forEach(i => $(i).classList.remove('hidden'));
    closeViewer();
    confetti(200);
});

/* Brief: alinea's verschijnen zacht tijdens het lezen */
function revealLetter() {
    const ps = document.querySelectorAll('.text-scroll p');
    ps.forEach(p => p.classList.remove('in'));
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { root: viewer, threshold: 0.15 });
    ps.forEach(p => io.observe(p));
}

/* ---------- Lightbox ---------- */
const lightbox = $('lightbox'), lbImg = $('lbImg');
let photoImgs = [], lbIndex = 0;
function openLightbox(idx) {
    photoImgs = Array.from(document.querySelectorAll('.photo-grid.full .photo img'));
    lbIndex = (idx + photoImgs.length) % photoImgs.length;
    lbImg.src = photoImgs[lbIndex].src;
    lightbox.classList.remove('hidden');
    lightbox.setAttribute('aria-hidden', 'false');
}
function closeLightbox() { lightbox.classList.add('hidden'); lightbox.setAttribute('aria-hidden', 'true'); lbImg.src = ''; }
function stepLightbox(d) {
    lbIndex = (lbIndex + d + photoImgs.length) % photoImgs.length;
    lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = '';
    lbImg.src = photoImgs[lbIndex].src;
}
document.addEventListener('click', e => {
    const img = e.target.closest('.photo-grid.full .photo img');
    if (img) openLightbox(Array.from(document.querySelectorAll('.photo-grid.full .photo img')).indexOf(img));
});
$('lbClose').addEventListener('click', closeLightbox);
$('lbPrev').addEventListener('click', () => stepLightbox(-1));
$('lbNext').addEventListener('click', () => stepLightbox(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lightbox-content')) closeLightbox(); });
let tx = 0;
lightbox.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - tx;
    if (dx < -40) stepLightbox(1); else if (dx > 40) stepLightbox(-1);
}, { passive: true });
document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
    if (e.key === 'Escape') closeLightbox();
});

/* ---------- Videospeler ---------- */
const seekBar = $('seekBar'), curTime = $('curTime'), durTime = $('durTime');
const overlay = $('overlayControls'), videoWrap = $('videoWrap');
let hideT = null, dragging = false;
const fmt = s => (isNaN(s) || !isFinite(s)) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function toggle() { musicPlayer.paused ? musicPlayer.play() : musicPlayer.pause(); }
function showControls() {
    overlay.classList.remove('hidden');
    clearTimeout(hideT);
    hideT = setTimeout(() => { if (!musicPlayer.paused) overlay.classList.add('hidden'); }, 3000);
}
musicPlayer.addEventListener('loadedmetadata', () => { seekBar.max = Math.floor(musicPlayer.duration); durTime.textContent = fmt(musicPlayer.duration); });
musicPlayer.addEventListener('timeupdate', () => { if (!dragging) seekBar.value = Math.floor(musicPlayer.currentTime); curTime.textContent = fmt(musicPlayer.currentTime); });
musicPlayer.addEventListener('play', () => { playPause.textContent = '⏸'; showControls(); });
musicPlayer.addEventListener('pause', () => { playPause.textContent = '▶'; overlay.classList.remove('hidden'); clearTimeout(hideT); });
$('skipBack').addEventListener('click', () => { musicPlayer.currentTime = Math.max(0, musicPlayer.currentTime - 10); });
$('skipForward').addEventListener('click', () => { musicPlayer.currentTime = Math.min(musicPlayer.duration, musicPlayer.currentTime + 10); });
playPause.addEventListener('click', toggle);
musicPlayer.addEventListener('click', () => { toggle(); showControls(); });
seekBar.addEventListener('input', () => { dragging = true; curTime.textContent = fmt(seekBar.value); });
seekBar.addEventListener('change', () => { musicPlayer.currentTime = Number(seekBar.value); dragging = false; });
videoWrap.addEventListener('mousemove', showControls);
videoWrap.addEventListener('touchstart', showControls, { passive: true });
showControls();