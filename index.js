// --- ÍCONES SVG ---
const soundOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`;
const soundOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l-4-4m0 4l4-4" /></svg>`;

// --- ELEMENTOS DO DOM ---
const mainContainer = document.getElementById('mainContainer');
const spinButton = document.getElementById('spinButton');
const spinButtonSorter = document.getElementById('spinButtonSorter');
const returnButton = document.getElementById('returnButton');
const nameInput = document.getElementById('nameInput');
const addNameButton = document.getElementById('addNameButton');
const nameList = document.getElementById('nameList');
const clearAllButton = document.getElementById('clearAllButton');
const winnerModal = document.getElementById('winnerModal');
const winnerModalTitle = document.getElementById('winnerModalTitle');
const winnerText = document.getElementById('winnerText');
const closeModalButton = document.getElementById('closeModalButton');
const tabNames = document.getElementById('tabNames');
const tabNumbers = document.getElementById('tabNumbers');
const namesPanel = document.getElementById('namesPanel');
const numbersPanel = document.getElementById('numbersPanel');
const minNumberInput = document.getElementById('minNumber');
const maxNumberInput = document.getElementById('maxNumber');
const removeWinnerCheckbox = document.getElementById('removeWinnerCheckbox');
const cascadeContainer = document.getElementById('cascadeContainer');
const cascadeTrack = document.getElementById('cascadeTrack');
const sorterColumn = document.getElementById('sorterColumn');
const menuColumn = document.getElementById('menuColumn');
const openMenuButton = document.getElementById('openMenuButton');
const winnerCountInput = document.getElementById('winnerCount');
const winnerCountNumbersInput = document.getElementById('winnerCountNumbers');
const winnersHistoryList = document.getElementById('winnersHistoryList');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const muteButton = document.getElementById('muteButton');

// --- ESTADO DA APLICAÇÃO ---
let state = {
    mode: 'names', // 'names' ou 'numbers'
    names: [],
    winners: [],
    minNumber: 1,
    maxNumber: 100,
    isSpinning: false,
    sorterVisible: false,
    menuOpen: false,
    isMuted: false,
};

// --- CONTROLO DE ÁUDIO ---
let synth, noiseSynth;
const setupAudio = async () => {
    if (typeof Tone === 'undefined' || synth) return;
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4, attackCurve: "exponential" },
    }).toDestination();
    noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.0 }
    }).toDestination();
};

const playRollingSound = () => {
    if (state.isMuted || !noiseSynth) return;
    noiseSynth.triggerAttackRelease("8n");
};

const playWinnerSound = () => {
    if (state.isMuted || !synth) return;
    const now = Tone.now();
    synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "0.5", now);
};

// --- FUNÇÕES DE LAYOUT ---
function renderLayout() {
    if (state.isSpinning) {
        mainContainer.classList.add('md:grid-cols-3'); menuColumn.classList.add('hidden'); sorterColumn.classList.remove('hidden');
        sorterColumn.classList.remove('md:col-span-2'); sorterColumn.classList.add('md:col-span-3');
        openMenuButton.classList.add('hidden'); spinButtonSorter.classList.add('hidden'); return;
    }
    if (state.sorterVisible) {
        openMenuButton.classList.remove('hidden'); sorterColumn.classList.remove('hidden');
        if (state.menuOpen) {
            mainContainer.classList.add('md:grid-cols-3'); menuColumn.classList.remove('hidden'); menuColumn.classList.remove('md:col-span-3');
            sorterColumn.classList.add('md:col-span-2'); sorterColumn.classList.remove('md:col-span-3'); spinButtonSorter.classList.add('hidden');
        } else {
            mainContainer.classList.add('md:grid-cols-3'); menuColumn.classList.add('hidden'); sorterColumn.classList.remove('md:col-span-2');
            sorterColumn.classList.add('md:col-span-3'); spinButtonSorter.classList.remove('hidden');
        }
    } else {
        mainContainer.classList.add('md:grid-cols-3'); sorterColumn.classList.add('hidden');
        menuColumn.classList.remove('hidden'); menuColumn.classList.add('md:col-span-3');
        openMenuButton.classList.add('hidden');
    }
}

function populateCascadeTrack(forAnimation = false) {
    cascadeTrack.innerHTML = ''; cascadeTrack.style.transition = 'none'; cascadeTrack.style.transform = 'translateY(0)';
    const items = (state.mode === 'names') ? state.names.map(n => n.name) : Array.from({ length: state.maxNumber - state.minNumber + 1 }, (_, i) => i + state.minNumber);
    if (items.length === 0) {
        cascadeTrack.innerHTML = `<div class="cascade-item text-xl text-gray-400 h-16 flex items-center justify-center">Adicione itens para começar!</div>`; return;
    }
    let itemsToRender = [...items];
    if (forAnimation && items.length > 1) {
        let clonedItems = []; const minAnimationItems = 50; const clonesCount = Math.max(5, Math.ceil(minAnimationItems / items.length));
        for(let i=0; i < clonesCount; i++) { clonedItems.push(...[...items].sort(() => Math.random() - 0.5)); }
        itemsToRender = clonedItems;
    }
    itemsToRender.forEach(item => {
        const div = document.createElement('div'); div.className = 'cascade-item text-3xl font-semibold h-16 flex items-center justify-center truncate px-2';
        div.textContent = item.toString(); cascadeTrack.appendChild(div);
    });
}

function startCascade() {
    const winnerCount = parseInt(state.mode === 'names' ? winnerCountInput.value : winnerCountNumbersInput.value, 10) || 1;
    let originalItems = (state.mode === 'names') ? [...state.names] : Array.from({ length: state.maxNumber - state.minNumber + 1 }, (_, i) => i + state.minNumber);
    
    if (originalItems.length === 0) return;

    const drawnWinners = [];
    const countToDraw = Math.min(winnerCount, originalItems.length);
    for (let i = 0; i < countToDraw; i++) {
        const winnerIndex = Math.floor(Math.random() * originalItems.length);
        drawnWinners.push(originalItems[winnerIndex]);
        originalItems.splice(winnerIndex, 1);
    }

    const firstWinner = drawnWinners[0];
    const firstWinnerName = (state.mode === 'names') ? firstWinner.name : firstWinner.toString();
    
    populateCascadeTrack(true);
    const itemHeight = 64; const containerHeight = cascadeContainer.offsetHeight; const animatedItems = Array.from(cascadeTrack.children).map(child => child.textContent);
    let targetIndexInTrack = -1; const searchStartIndex = Math.floor(animatedItems.length * 0.7);
    for(let i = searchStartIndex; i < animatedItems.length; i++) { if (animatedItems[i] === firstWinnerName) { targetIndexInTrack = i; break; } }
    if (targetIndexInTrack === -1) { targetIndexInTrack = Math.floor(animatedItems.length * 0.7) + Math.floor(Math.random() * (state.mode === 'names' ? state.names.length : 1)); }
    
    const finalPosition = -(targetIndexInTrack * itemHeight) + (containerHeight / 2) - (itemHeight / 2);
    
    cascadeTrack.style.transition = 'none'; cascadeTrack.style.transform = 'translateY(0px)'; cascadeTrack.offsetHeight; 
    
    const baseDuration = 3000;
    const dynamicDuration = Math.min(5000, originalItems.length * 50);
    const duration = baseDuration + dynamicDuration;

    cascadeTrack.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
    cascadeTrack.style.transform = `translateY(${finalPosition}px)`;
    
    const rollInterval = setInterval(playRollingSound, 100);

    setTimeout(() => {
        clearInterval(rollInterval);
        playWinnerSound();
        showWinner(drawnWinners);
        
        drawnWinners.forEach(winner => {
            const winnerObj = { name: (state.mode === 'names' ? winner.name : winner), createdAt: new Date().toISOString() };
            state.winners.unshift(winnerObj);
            if (state.mode === 'names' && removeWinnerCheckbox.checked) {
                state.names = state.names.filter(n => n.id !== winner.id);
            }
        });
        renderWinnersHistory();
        renderNameList();

        state.isSpinning = false; updateSpinButtonState(); returnButton.classList.remove('hidden'); renderLayout();
    }, duration);
}

function showWinner(winners) {
    const winnerNames = winners.map(w => (state.mode === 'names' ? w.name : w));
    if (winnerNames.length > 1) {
        winnerModalTitle.textContent = `Os ${winnerNames.length} Vencedores São...`;
        winnerText.innerHTML = `<ul class="space-y-2 text-2xl">${winnerNames.map(name => `<li>${name}</li>`).join('')}</ul>`;
    } else {
        winnerModalTitle.textContent = "O Vencedor é...";
        winnerText.textContent = winnerNames[0] || 'N/A';
    }
    winnerModal.classList.remove('hidden');
}

// --- FUNÇÕES DE LÓGICA E EVENTOS ---
function updateUI() {
    if (state.mode === 'names') {
        namesPanel.classList.remove('hidden'); numbersPanel.classList.add('hidden'); tabNames.classList.add('active'); tabNumbers.classList.remove('active');
    } else {
        namesPanel.classList.add('hidden'); numbersPanel.classList.remove('hidden'); tabNames.classList.remove('active'); tabNumbers.classList.add('active');
    }
    populateCascadeTrack(false); updateSpinButtonState();
}

function updateSpinButtonState() {
    clearAllButton.disabled = state.names.length === 0;
    const winnerInput = state.mode === 'names' ? winnerCountInput : winnerCountNumbersInput;
    const totalItems = state.mode === 'names' ? state.names.length : (state.maxNumber - state.minNumber + 1);
    winnerInput.max = totalItems > 0 ? totalItems : 1;

    const isDisabled = state.isSpinning || totalItems < 1 || (state.mode === 'names' && state.names.length < parseInt(winnerInput.value,10));
    spinButton.disabled = isDisabled; spinButtonSorter.disabled = isDisabled;
}

function handleAddNames() {
    const namesString = nameInput.value.trim(); if (!namesString) return;
    const namesArray = namesString.split(/\s*[,|\n]\s*/).filter(name => name.length > 0);
    if (namesArray.length === 0) return;
    
    namesArray.forEach(name => {
        state.names.push({ id: crypto.randomUUID(), name: name });
    });
    nameInput.value = '';
    
    if (state.mode === 'names' && !state.isSpinning) {
        if (!state.sorterVisible) {
            state.sorterVisible = true;
            state.menuOpen = false;
            renderLayout();
        }
    }
    renderNameList();
    updateUI();
}

function handleDeleteName(id) {
    state.names = state.names.filter(item => item.id !== id);
    if (state.names.length === 0) {
        state.sorterVisible = false;
        state.menuOpen = true;
        renderLayout();
    }
    renderNameList();
    updateUI();
}

function handleClearAllNames() {
    state.names = [];
    state.sorterVisible = false;
    state.menuOpen = true;
    renderLayout();
    renderNameList();
    updateUI();
}

function handleClearHistory() {
    state.winners = [];
    renderWinnersHistory();
}

function renderNameList() {
    nameList.innerHTML = ''; state.names.forEach(item => {
        const li = document.createElement('li'); li.className = 'flex justify-between items-center bg-gray-900 p-2 rounded';
        li.innerHTML = `<span class="truncate">${item.name}</span><button data-id="${item.id}" class="delete-btn text-red-500 hover:text-red-400 font-bold px-2">&times;</button>`;
        nameList.appendChild(li);
    });
}
function renderWinnersHistory() {
    winnersHistoryList.innerHTML = ''; state.winners.forEach(winner => {
        const li = document.createElement('li'); li.className = 'flex justify-between items-center bg-gray-900 p-1.5 rounded';
        li.innerHTML = `<span class="truncate">${winner.name}</span>`;
        winnersHistoryList.appendChild(li);
    });
    clearHistoryButton.disabled = state.winners.length === 0;
}

const handleSorterSpinClick = () => {
    if (state.isSpinning) return;
    const originalItems = (state.mode === 'names') ? state.names.length : (state.maxNumber - state.minNumber + 1);
    const countToDraw = parseInt(state.mode === 'names' ? winnerCountInput.value : winnerCountNumbersInput.value, 10);
    if (originalItems < countToDraw) return;
    state.isSpinning = true; returnButton.classList.add('hidden'); renderLayout(); setTimeout(startCascade, 300);
};

const handleMenuSpinClick = () => {
    if (!state.sorterVisible) {
        state.sorterVisible = true; state.menuOpen = false; renderLayout(); return;
    }
    handleSorterSpinClick();
};

function init() {
    document.body.addEventListener('click', setupAudio, { once: true });
    muteButton.innerHTML = state.isMuted ? soundOffIcon : soundOnIcon;

    addNameButton.addEventListener('click', handleAddNames);
    clearAllButton.addEventListener('click', handleClearAllNames);
    clearHistoryButton.addEventListener('click', handleClearHistory);
    
    nameList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            handleDeleteName(e.target.dataset.id);
        }
    });
    
    spinButton.addEventListener('click', handleMenuSpinClick);
    spinButtonSorter.addEventListener('click', handleSorterSpinClick);

    returnButton.addEventListener('click', () => {
        state.menuOpen = true; renderLayout(); returnButton.classList.add('hidden'); populateCascadeTrack(false);
    });
    
    openMenuButton.addEventListener('click', () => {
        state.menuOpen = !state.menuOpen; renderLayout();
    });
    
    muteButton.addEventListener('click', () => {
        state.isMuted = !state.isMuted;
        muteButton.innerHTML = state.isMuted ? soundOffIcon : soundOnIcon;
    });

    closeModalButton.addEventListener('click', () => {
        winnerModal.classList.add('hidden');
        renderLayout();
    });
    
    const switchTab = (mode) => {
        state.mode = mode;
        if (mode === 'names') {
            state.sorterVisible = state.names.length > 0;
            state.menuOpen = !state.sorterVisible;
        } else {
            state.sorterVisible = false; state.menuOpen = true;
        }
        renderLayout(); updateUI();
    };
    tabNames.addEventListener('click', () => switchTab('names'));
    tabNumbers.addEventListener('click', () => switchTab('numbers'));

    [minNumberInput, maxNumberInput, winnerCountInput, winnerCountNumbersInput].forEach(input => {
        input.addEventListener('change', () => {
            state.minNumber = parseInt(minNumberInput.value, 10) || 1;
            state.maxNumber = parseInt(maxNumberInput.value, 10) || 100;
            updateSpinButtonState();
        });
    });

    renderLayout(); updateUI();
}

init();
