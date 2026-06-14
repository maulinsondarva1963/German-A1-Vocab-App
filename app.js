// app.js

// 1. Identify Chapter from URL (e.g., "chapter1.html" -> "chapter1")
const pathName = window.location.pathname;
let currentChapter = pathName.substring(pathName.lastIndexOf('/') + 1).replace('.html', '');
if (!currentChapter || currentChapter === "") currentChapter = "chapter1"; // Fallback

// 2. Load Data
let fullChapterData = typeof vocabularyDatabase !== 'undefined' ? vocabularyDatabase[currentChapter] || [] : [];
let currentWords = [...fullChapterData];
let currentIndex = 0;
let isFlipped = false;

// 3. State & Gamification (Loads from browser memory)
let xp = parseInt(localStorage.getItem('germanApp_xp')) || 0;
let level = parseInt(localStorage.getItem('germanApp_level')) || 1;

document.addEventListener('DOMContentLoaded', () => {
    updateGamificationUI();
    renderCard();
});

function renderCard() {
    const container = document.getElementById('cardContainer');
    if (!container) return;

    if (currentWords.length === 0) {
        container.innerHTML = `
            <div class="text-center bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20">
                <h2 class="text-2xl font-bold mb-2">Glückwunsch! 🎉</h2>
                <p class="text-gray-300">Du hast alle Wörter in dieser Ansicht gelernt.</p>
                <button onclick="location.reload()" class="mt-6 px-6 py-2 bg-blue-500 rounded-full font-bold hover:bg-blue-600 transition">Neustart</button>
            </div>`;
        return;
    }

    const card = currentWords[currentIndex];
    isFlipped = false;

    container.innerHTML = `
        <div id="flashcard" class="card-inner w-full h-96 relative transform-style-3d cursor-pointer" onclick="toggleFlip()">
            <div class="absolute inset-0 w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center backface-hidden shadow-2xl">
                <span class="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-white/20 rounded-md uppercase">${card.difficulty}</span>
                <p class="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-2">${card.partOfSpeech}</p>
                <h2 class="text-4xl font-extrabold text-center mb-6">${card.word}</h2>
                <button onclick="playAudio(event, '${card.word}')" class="p-4 bg-blue-500/20 hover:bg-blue-500/40 rounded-full transition text-2xl border border-blue-500/50">🔊</button>
            </div>
            <div class="absolute inset-0 w-full h-full bg-indigo-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 shadow-2xl text-center">
                <h3 class="text-3xl font-bold text-emerald-400 mb-6">${card.translation}</h3>
                <div class="bg-black/30 p-4 rounded-xl w-full border border-white/10">
                    <p class="italic text-gray-300 mb-2">"${card.example}"</p>
                    <p class="text-sm text-gray-400">"${card.exTranslation}"</p>
                </div>
            </div>
        </div>
        
        <div class="flex gap-4 mt-8 w-full">
            <button onclick="handleSwipe('left')" class="flex-1 py-4 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/50 rounded-2xl font-bold text-rose-300 transition">Nochmal (Swipe ←)</button>
            <button onclick="handleSwipe('right')" class="flex-1 py-4 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl font-bold text-emerald-300 transition">Gelernt (Swipe →)</button>
        </div>
    `;
    setupTouchEvents();
}

function toggleFlip() {
    const card = document.getElementById('flashcard');
    if (!card) return;
    isFlipped = !isFlipped;
    isFlipped ? card.classList.add('rotate-y-180') : card.classList.remove('rotate-y-180');
}

function playAudio(event, word) {
    event.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
}

function handleSwipe(direction) {
    const card = document.getElementById('flashcard');
    if (!card) return;
    
    if (direction === 'right') {
        card.classList.add('swipe-right');
        addXP(10);
    } else {
        card.classList.add('swipe-left');
    }

    setTimeout(() => {
        currentWords.splice(currentIndex, 1);
        if (currentIndex >= currentWords.length) currentIndex = 0;
        renderCard();
    }, 400);
}

function setDifficulty(levelFilter) {
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-white/10', 'text-gray-300');
    });
    event.target.classList.remove('bg-white/10', 'text-gray-300');
    event.target.classList.add('bg-blue-500', 'text-white');

    currentWords = levelFilter === 'ALL' ? [...fullChapterData] : fullChapterData.filter(w => w.difficulty === levelFilter);
    currentIndex = 0;
    renderCard();
}

function addXP(amount) {
    xp += amount;
    const newLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    if (newLevel > level) {
        level = newLevel;
        triggerConfetti();
    }
    localStorage.setItem('germanApp_xp', xp);
    localStorage.setItem('germanApp_level', level);
    updateGamificationUI();
}

function updateGamificationUI() {
    const xpEl = document.getElementById('xpDisplay');
    const lvlEl = document.getElementById('levelDisplay');
    if(xpEl) xpEl.innerText = xp;
    if(lvlEl) lvlEl.innerText = level;
}

function triggerConfetti() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti');
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.width = conf.style.height = Math.random() * 10 + 5 + 'px';
        conf.style.animationDuration = Math.random() * 2 + 1 + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 3000);
    }
}

// Touch Gestures
let touchstartX = 0, touchendX = 0;
function setupTouchEvents() {
    const card = document.getElementById('flashcard');
    if(!card) return;
    card.addEventListener('touchstart', e => touchstartX = e.changedTouches[0].screenX, {passive: true});
    card.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        if (touchendX < touchstartX - 50) handleSwipe('left');
        if (touchendX > touchstartX + 50) handleSwipe('right');
    }, {passive: true});
}