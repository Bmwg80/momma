const ALLOWED_PINS = ['1234', '1981', '0000'];
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = p => navigator.vibrate && navigator.vibrate(p);

const pinDisplay = $('pinDisplay'), pinError = $('pinError'), keypad = $('keypad');
const pinCard = $('pinCard'), mainCard = $('mainCard');
let input = '';

/* ---------- Hartjes (minder op telefoon, pauze als tab verborgen is) ---------- */
const heartsLayer = $('hearts');
const EMOJIS = ['💕', '❤️', '💖', '🌸', '✨'];
const small = innerWidth < 600;
function spawnHeart() {
    if (document.hidden || heartsLayer.childElementCount > (small ? 8 : 16)) return;
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    h.style.left = Math.random() * 100 + '%';
    h.style.fontSize = 14 + Math.random() * 18 + 'px';
    h.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    h.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
    h.style.animationDuration = 9 + Math.random() * 7 + 's';
    heartsLayer.appendChild(h);
    setTimeout(() => h.remove(), 17000);
}
if (!reduce) setInterval(spawnHeart, small ? 1500 : 1100);

/* ---------- Confetti (DPR max 2 voor soepelheid) ---------- */
const cv = $('confetti'), ctx = cv.getContext('2d');
const DPR = Math.min(devicePixelRatio || 1, 2);
let parts = [], raf = null;
function sizeCanvas() { cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; }
sizeCanvas(); addEventListener('resize', sizeCanvas);
function confetti(n = 120) {
    if (reduce) return;
    const colors = ['#ff7597', '#f6c98b', '#fce4ec', '#e0527b', '#c9a0ff'];
    n = small ? Math.round(n * 0.7) : n;
    for (let i = 0; i < n; i++) parts.push({
        x: innerWidth / 2, y: innerHeight * 0.45,
        vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 14 - 4,
        s: 5 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: colors[Math.floor(Math.random() * colors.length)], life: 1
    });
    if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
        p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.007;
        ctx.save(); ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x * DPR, p.y * DPR); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s * DPR, -p.s * DPR / 2, p.s * 2 * DPR, p.s * DPR);
        ctx.restore();
    }
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
    buzz([60, 40, 60]);
    setTimeout(() => pinDisplay.classList.remove('shake'), 500);
}
function tapFx(btn) {
    btn.classList.add('tap'); buzz(12);
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
        buzz([30, 30, 80]);
        confetti(150);
        setTimeout(() => {
            pinCard.classList.add('leaving');           // slot "ontploft" zacht weg
            setTimeout(() => {
                pinCard.classList.add('hidden');
                mainCard.classList.remove('hidden');    // menu pop't binnen, knoppen na elkaar
            }, reduce ? 0 : 420);
        }, reduce ? 0 : 500);
    } else {
        showError('Onjuiste code');
        setTimeout(() => { input = ''; updateDisplay(); }, 700);
    }
});
updateDisplay();

/* ---------- Navigatie met richting-bewuste overgangen ---------- */
const viewer = $('viewer'), viewerInner = $('viewerInner');
const musicPlayer = $('musicPlayer'), playPause = $('playPause');
const ORDER = ['musicView', 'photosView', 'textView'];
let currentId = null, busy = false;

const progress = document.createElement('div');
progress.className = 'progress';
document.querySelector('.viewer-topbar').appendChild(progress);

document.querySelectorAll('.gift').forEach(btn => btn.addEventListener('click', () => openViewer(btn.dataset.view)));

function openViewer(id) {
    buzz(15);
    viewer.classList.remove('hidden', 'closing');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    mainCard.classList.add('hidden');
    currentId = null;
    showView(id, true);
    if (id === 'musicView' && musicPlayer) {
        musicPlayer.play().then(() => { playPause.textContent = '⏸'; }).catch(() => {});
    }
}
function closeViewer() {
    if (busy) return;
    viewer.classList.add('closing');
    setTimeout(() => {
        viewer.classList.add('hidden');
        viewer.classList.remove('closing');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        mainCard.classList.remove('hidden');
    }, reduce ? 0 : 280);
}
$('viewerClose').addEventListener('click', closeViewer);
$('backToMenu').addEventListener('click', closeViewer);

function activate(next, dir) {
    viewerInner.querySelectorAll('.view-section').forEach(s => s.classList.remove('active', 'leaving'));
    next.style.setProperty('--d', dir);
    next.classList.add('active');
    currentId = next.id;
    document.querySelectorAll('.top-action').forEach(b => b.classList.toggle('active', b.dataset.target === currentId));
    progress.style.transform = `scaleX(${(ORDER.indexOf(currentId) + 1) / ORDER.length})`;
    viewer.scrollTo(0, 0);
    if (currentId === 'photosView') document.querySelectorAll('.photo').forEach((p, i) => {
        p.style.setProperty('--i', i); p.style.animation = 'none'; p.offsetHeight; p.style.animation = '';
    });
    if (currentId === 'textView') revealLetter();
}
function showView(id, immediate) {
    const next = $(id);
    if (!next || id === currentId || busy) return;
    const prev = currentId && $(currentId);
    const dir = prev ? (ORDER.indexOf(id) > ORDER.indexOf(currentId) ? 1 : -1) : 1;
    if (!prev || immediate || reduce) return activate(next, dir);
    busy = true;
    prev.style.setProperty('--d', dir);
    prev.classList.add('leaving');
    setTimeout(() => { activate(next, dir); busy = false; }, 210);
}
$('toPhotosBtn').addEventListener('click', () => showView('photosView'));
$('toTextBtn').addEventListener('click', () => showView('textView'));
document.querySelectorAll('.top-action').forEach(b => b.addEventListener('click', () => { buzz(10); showView(b.dataset.target); }));

$('finishExpBtn').addEventListener('click', () => {
    ['backToMenu', 'topActions', 'viewerClose', 'photosMenuBtn', 'textMenuBtn'].forEach(i => $(i).classList.remove('hidden'));
    closeViewer();
    setTimeout(() => confetti(200), reduce ? 0 : 300);
});

/* Swipe tussen pagina's (links/rechts), zoals in een app */
let sx = 0, sy = 0, swipeOk = false;
viewer.addEventListener('touchstart', e => {
    swipeOk = !e.target.closest('.overlay-controls, input');
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
}, { passive: true });
viewer.addEventListener('touchend', e => {
    if (!swipeOk || !currentId) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const i = ORDER.indexOf(currentId) + (dx < 0 ? 1 : -1);
    if (ORDER[i]) { buzz(10); showView(ORDER[i]); }
}, { passive: true });

/* Brief: alinea's verschijnen zacht tijdens het lezen */
let letterIO = null;
function revealLetter() {
    const ps = document.querySelectorAll('.text-scroll p');
    ps.forEach(p => p.classList.remove('in'));
    letterIO && letterIO.disconnect();
    letterIO = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); letterIO.unobserve(e.target); }
    }), { root: viewer, threshold: 0.12 });
    ps.forEach(p => letterIO.observe(p));
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
    buzz(10);
}
function closeLightbox() { lightbox.classList.add('hidden'); lightbox.setAttribute('aria-hidden', 'true'); lbImg.src = ''; }
function stepLightbox(d) {
    lbIndex = (lbIndex + d + photoImgs.length) % photoImgs.length;
    lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = '';
    lbImg.src = photoImgs[lbIndex].src;
}
document.addEventListener('click', e => {
    const photo = e.target.closest('.photo-grid.full .photo');
    if (photo) openLightbox(Array.from(document.querySelectorAll('.photo-grid.full .photo')).indexOf(photo));
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
    hideT = setTimeout(() => { if (!musicPlayer.paused && !dragging) overlay.classList.add('hidden'); }, 3000);
}
musicPlayer.addEventListener('loadedmetadata', () => { seekBar.max = Math.floor(musicPlayer.duration); durTime.textContent = fmt(musicPlayer.duration); });
musicPlayer.addEventListener('timeupdate', () => { if (!dragging) seekBar.value = Math.floor(musicPlayer.currentTime); curTime.textContent = fmt(musicPlayer.currentTime); });
musicPlayer.addEventListener('play', () => { playPause.textContent = '⏸'; showControls(); });
musicPlayer.addEventListener('pause', () => { playPause.textContent = '▶'; overlay.classList.remove('hidden'); clearTimeout(hideT); });
$('skipBack').addEventListener('click', () => { musicPlayer.currentTime = Math.max(0, musicPlayer.currentTime - 10); showControls(); });
$('skipForward').addEventListener('click', () => { musicPlayer.currentTime = Math.min(musicPlayer.duration, musicPlayer.currentTime + 10); showControls(); });
playPause.addEventListener('click', () => { toggle(); showControls(); });
musicPlayer.addEventListener('click', () => { toggle(); showControls(); });
seekBar.addEventListener('input', () => { dragging = true; curTime.textContent = fmt(seekBar.value); });
seekBar.addEventListener('change', () => { musicPlayer.currentTime = Number(seekBar.value); dragging = false; showControls(); });
videoWrap.addEventListener('mousemove', showControls);
videoWrap.addEventListener('touchstart', showControls, { passive: true });
showControls();
