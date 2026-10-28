/**
 * TEST YOUR ENGINEERING BRAIN - Interactive Client Application
 * Handles Quiz flow, animations, audio, certificate preview, and admin portal.
 */

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
  currentView: 'landing',
  participant: null,
  attempt: null,
  // Engineering Arena 4-Game State
  arena: {
    levels: {
      circuitMaster: { completed: false, score: 0, wireConnected: false, selectedOption: null },
      spinArena: { completed: false, score: 0, selectedCategory: null, selectedOption: null, isBonus: false },
      buildZone: { completed: false, score: 0, placedComponents: {}, vehiclePassed: false, selectedOption: null },
      escapeRoom: { completed: false, score: 0, c1Solved: false, c1Option: null, c2Solved: false, c2Component: null, c3Solved: false, c3Pin: '' }
    },
    totalScore: 0,
    completedCount: 0,
    isChampion: false,
    config: null
  },
  questions: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  quizTimerInterval: null,
  quizSecondsElapsed: 0,
  adminToken: sessionStorage.getItem('tyeb_admin_token') || null,
  soundEnabled: true
};

// ==========================================
// AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
const AudioFX = {
  ctx: null,
  init() {
    try {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) {
      this.ctx = null;
    }
  },
  playClick() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.06); // A5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  },
  playCelebration() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major chord)
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }
};

// ==========================================
// BACKGROUND CIRCUIT CANVAS ANIMATION
// ==========================================
function initCircuitBackground() {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const nodes = [];
  const totalNodes = Math.min(45, Math.floor(width / 35));

  for (let i = 0; i < totalNodes; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(0, 180, 216, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Connect close nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 180, 216, ${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0) node.x = width;
      if (node.x > width) node.x = 0;
      if (node.y < 0) node.y = height;
      if (node.y > height) node.y = 0;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 180, 216, 0.6)';
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

// ==========================================
// PURE JS CELEBRATION CONFETTI
// ==========================================
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '3000';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#00b4d8', '#ffd166', '#f4a261', '#10b981', '#38bdf8', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let frame = 0;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.vRot;
      p.opacity -= 0.012;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    frame++;
    if (alive && frame < 140) {
      requestAnimationFrame(update);
    } else {
      canvas.remove();
    }
  }

  update();
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// VIEW NAVIGATION
// ==========================================
function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const target = document.getElementById(`view${capitalize(viewName)}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle URL hash sync
  if (viewName === 'admin') {
    window.location.hash = 'admin';
  } else if (window.location.hash === '#admin') {
    history.pushState('', document.title, window.location.pathname);
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ==========================================
// REGISTRATION (VIEW 1)
// ==========================================
function setupRegistration() {
  const form = document.getElementById('registrationForm');
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const branchSelect = document.getElementById('branch');
  const collegeInput = document.getElementById('collegeName');
  const alertBox = document.getElementById('formAlert');

  // IEI Membership Elements
  const ieiMemberYesRadio = document.getElementById('ieiMemberYes');
  const ieiMemberNoRadio = document.getElementById('ieiMemberNo');
  const ieiChoiceYesCard = document.getElementById('ieiChoiceYesCard');
  const ieiChoiceNoCard = document.getElementById('ieiChoiceNoCard');
  const ieiMembershipIdGroup = document.getElementById('ieiMembershipIdGroup');
  const ieiMembershipIdInput = document.getElementById('ieiMembershipId');
  const ieiMemberIdError = document.getElementById('ieiMemberIdError');

  function updateIeiMembershipUI() {
    const isYes = Boolean(ieiMemberYesRadio && ieiMemberYesRadio.checked);
    if (ieiChoiceYesCard) ieiChoiceYesCard.classList.toggle('active', isYes);
    if (ieiChoiceNoCard) ieiChoiceNoCard.classList.toggle('active', !isYes);

    if (ieiMembershipIdGroup) {
      if (isYes) {
        ieiMembershipIdGroup.style.display = 'block';
        ieiMembershipIdGroup.classList.add('iei-id-animate');
        if (ieiMembershipIdInput) {
          setTimeout(() => ieiMembershipIdInput.focus(), 60);
        }
      } else {
        ieiMembershipIdGroup.style.display = 'none';
        if (ieiMembershipIdInput) ieiMembershipIdInput.value = '';
        if (ieiMemberIdError) ieiMemberIdError.textContent = '';
      }
    }
  }

  if (ieiMemberYesRadio) ieiMemberYesRadio.addEventListener('change', updateIeiMembershipUI);
  if (ieiMemberNoRadio) ieiMemberNoRadio.addEventListener('change', updateIeiMembershipUI);

  if (ieiChoiceYesCard) {
    ieiChoiceYesCard.addEventListener('click', () => {
      if (ieiMemberYesRadio) {
        ieiMemberYesRadio.checked = true;
        updateIeiMembershipUI();
      }
    });
  }
  if (ieiChoiceNoCard) {
    ieiChoiceNoCard.addEventListener('click', () => {
      if (ieiMemberNoRadio) {
        ieiMemberNoRadio.checked = true;
        updateIeiMembershipUI();
      }
    });
  }

  if (ieiMembershipIdInput) {
    ieiMembershipIdInput.addEventListener('input', () => {
      if (ieiMemberIdError) ieiMemberIdError.textContent = '';
    });
  }

  // Clear errors on input
  nameInput.addEventListener('input', () => document.getElementById('nameError').textContent = '');
  emailInput.addEventListener('input', () => document.getElementById('emailError').textContent = '');
  branchSelect.addEventListener('change', () => document.getElementById('branchError').textContent = '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    let valid = true;
    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const branch = branchSelect.value;
    const collegeName = collegeInput.value.trim();

    // Name validation
    if (!fullName || fullName.length < 2) {
      document.getElementById('nameError').textContent = 'Please enter your full name (at least 2 letters).';
      valid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      document.getElementById('emailError').textContent = 'Please enter a valid email address.';
      valid = false;
    }

    // Branch validation
    if (!branch) {
      document.getElementById('branchError').textContent = 'Please select your engineering branch.';
      valid = false;
    }

    // IEI Membership validation
    const isIeiMember = Boolean(ieiMemberYesRadio && ieiMemberYesRadio.checked);
    const ieiMembershipId = ieiMembershipIdInput ? ieiMembershipIdInput.value.trim() : '';

    if (isIeiMember) {
      if (!ieiMembershipId || ieiMembershipId.length < 2) {
        if (ieiMemberIdError) ieiMemberIdError.textContent = 'Please enter your official IEI Membership Number.';
        valid = false;
      }
    }

    if (!valid) {
      AudioFX.playClick();
      return;
    }

    const startBtn = document.getElementById('startQuizBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = '<span>INITIALIZING QUIZ CHALLENGE... ⏳</span>';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          branch,
          collegeName,
          isIeiMember,
          ieiMembershipId: isIeiMember ? ieiMembershipId : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      state.participant = data.participant;
      state.attempt = data.attempt;

      // Persist in session and local storage for cross-container serverless recovery
      try {
        sessionStorage.setItem('tyeb_participant', JSON.stringify(data.participant));
        sessionStorage.setItem('tyeb_attempt', JSON.stringify(data.attempt));
        localStorage.setItem('tyeb_participant', JSON.stringify(data.participant));
        localStorage.setItem('tyeb_attempt', JSON.stringify(data.attempt));
      } catch (e) {}

      if (data.alreadyCompleted) {
        showToast('Found your previous completed attempt! Loading certificate...', 'info');
        // Fetch existing attempt results
        loadCompletedResults(data.participant, data.attempt, data.certificate);
      } else {
        AudioFX.playClick();
        showToast('Registration successful! Welcome to the Engineering Arena! 🎮', 'success');
        enterEngineeringArena();
      }
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.style.display = 'block';
    } finally {
      startBtn.disabled = false;
      startBtn.innerHTML = '<span>START QUIZ NOW 🚀</span>';
    }
  });
}

// ==========================================
// ENGINEERING ARENA: HUB & INTERACTIVE 4 GAMES
// ==========================================

function levelKeyToView(levelKey) {
  switch (levelKey) {
    case 'circuitMaster': return 'level1';
    case 'spinArena': return 'level2';
    case 'buildZone': return 'level3';
    case 'escapeRoom': return 'level4';
    default: return 'arena';
  }
}

async function enterEngineeringArena() {
  const p = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  if (p) {
    state.participant = p;
    const nameEl = document.getElementById('arenaParticipantName');
    if (nameEl) nameEl.textContent = p.fullName;
  }

  // Fetch sanitized arena config from backend if not already loaded
  if (!state.arena.config) {
    try {
      const res = await fetch('/api/arena/config');
      const data = await res.json();
      if (data.success && data.config) {
        state.arena.config = data.config;
      }
    } catch (e) {
      console.warn('Could not load arena config:', e);
    }
  }

  await refreshArenaStatus();
  switchView('arena');
}

async function refreshArenaStatus() {
  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');
  const participant = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  if (!attempt && !participant) return;

  const attemptId = attempt ? attempt.attemptId : '';
  const participantId = participant ? participant.participantId : '';

  try {
    const res = await fetch(`/api/arena/status?attemptId=${encodeURIComponent(attemptId)}&participantId=${encodeURIComponent(participantId)}`, {
      headers: {
        'x-participant-data': encodeURIComponent(JSON.stringify(participant || {}))
      }
    });
    const data = await res.json();
    if (data.success && data.status) {
      state.arena.levels = data.status.levels || {};
      state.arena.totalScore = data.status.totalScore || 0;
      state.arena.completedCount = data.status.completedLevelsCount || 0;
      state.arena.isChampion = Boolean(data.status.isChampion);

      // Cache locally
      try {
        const cur = JSON.parse(sessionStorage.getItem('tyeb_attempt') || '{}');
        cur.levels = data.status.levels;
        cur.arenaScore = data.status.totalScore;
        cur.completedGamesCount = data.status.completedLevelsCount;
        cur.completedLevelsCount = data.status.completedLevelsCount;
        cur.isChampion = data.status.isChampion;
        sessionStorage.setItem('tyeb_attempt', JSON.stringify(cur));
        localStorage.setItem('tyeb_attempt', JSON.stringify(cur));
      } catch (e) {}

      updateArenaHubUI();
    }
  } catch (err) {
    console.warn('Could not refresh arena status:', err);
    updateArenaHubUI();
  }
}

function updateArenaHubUI() {
  const levels = state.arena.levels || {};
  let totalScore = 0;
  let completedCount = 0;

  const mapping = [
    { key: 'circuitMaster', card: 'cardCircuit', overlay: 'lockOverlayCircuit', dot: 'dotCircuit', status: 'statusTextCircuit', badge: 'scoreBadgeCircuit', btn: 'btnPlayCircuit', name: 'CIRCUIT MASTER ⚡', step: 'stepperStep1', stepBadge: 'stepperBadge1', conn: 'stepperConn1' },
    { key: 'spinArena', card: 'cardSpin', overlay: 'lockOverlaySpin', dot: 'dotSpin', status: 'statusTextSpin', badge: 'scoreBadgeSpin', btn: 'btnPlaySpin', name: 'SPIN ARENA 🎡', step: 'stepperStep2', stepBadge: 'stepperBadge2', conn: 'stepperConn2' },
    { key: 'buildZone', card: 'cardBuild', overlay: 'lockOverlayBuild', dot: 'dotBuild', status: 'statusTextBuild', badge: 'scoreBadgeBuild', btn: 'btnPlayBuild', name: 'BUILD ZONE 🌉', step: 'stepperStep3', stepBadge: 'stepperBadge3', conn: 'stepperConn3' },
    { key: 'escapeRoom', card: 'cardEscape', overlay: 'lockOverlayEscape', dot: 'dotEscape', status: 'statusTextEscape', badge: 'scoreBadgeEscape', btn: 'btnPlayEscape', name: 'ESCAPE ROOM 🔐', step: 'stepperStep4', stepBadge: 'stepperBadge4', conn: 'stepperConn4' }
  ];

  mapping.forEach(m => {
    const lvl = levels[m.key] || {};
    const isUnlocked = m.key === 'circuitMaster' ? true : Boolean(lvl.unlocked);
    const isComp = Boolean(lvl.completed || lvl.status === 'Completed');
    const score = Number(lvl.score || 0);

    totalScore += score;
    if (isComp) completedCount++;

    const cardEl = document.getElementById(m.card);
    const overlayEl = document.getElementById(m.overlay);
    const dotEl = document.getElementById(m.dot);
    const statusEl = document.getElementById(m.status);
    const badgeEl = document.getElementById(m.badge);
    const btnEl = document.getElementById(m.btn);

    // Update Card Lock & Badges
    if (cardEl) {
      if (isUnlocked) {
        cardEl.classList.remove('locked');
      } else {
        cardEl.classList.add('locked');
      }
    }

    if (overlayEl) {
      overlayEl.style.display = isUnlocked ? 'none' : 'flex';
    }

    if (dotEl) {
      dotEl.className = `status-dot ${isComp ? 'completed' : (isUnlocked ? 'active' : 'locked')}`;
    }

    if (statusEl) {
      if (isComp) {
        statusEl.textContent = 'Completed ✅';
      } else if (isUnlocked) {
        statusEl.textContent = 'Active ⚡';
      } else {
        statusEl.textContent = 'Locked 🔒';
      }
    }

    if (badgeEl) {
      badgeEl.textContent = `${score} / 100`;
      badgeEl.className = `game-score-badge ${isComp ? 'completed' : ''}`;
    }

    if (btnEl) {
      if (!isUnlocked) {
        btnEl.textContent = `LOCKED 🔒`;
        btnEl.classList.remove('btn-primary', 'btn-outline-gold');
        btnEl.classList.add('btn-outline-secondary');
      } else if (isComp) {
        btnEl.textContent = `REPLAY ${m.name}`;
        btnEl.classList.remove('btn-primary', 'btn-outline-secondary');
        btnEl.classList.add('btn-outline-gold');
      } else {
        btnEl.textContent = `PLAY ${m.name}`;
        btnEl.classList.remove('btn-outline-gold', 'btn-outline-secondary');
        btnEl.classList.add('btn-primary');
      }
    }

    // Update Progression Stepper Step
    const stepEl = document.getElementById(m.step);
    const stepBadgeEl = document.getElementById(m.stepBadge);
    const connEl = document.getElementById(m.conn);

    if (stepEl) {
      stepEl.className = `stepper-step ${isComp ? 'completed' : (isUnlocked ? 'active' : 'locked')}`;
    }

    if (stepBadgeEl) {
      if (isComp) {
        stepBadgeEl.className = 'step-status-pill status-completed';
        stepBadgeEl.textContent = 'Done ✅';
      } else if (isUnlocked) {
        stepBadgeEl.className = 'step-status-pill status-active';
        stepBadgeEl.textContent = 'Active ⚡';
      } else {
        stepBadgeEl.className = 'step-status-pill status-locked';
        stepBadgeEl.textContent = 'Locked 🔒';
      }
    }

    if (connEl) {
      connEl.className = `stepper-connector ${isComp ? 'completed' : ''}`;
    }
  });

  // Step 5: Champion Certificate Stepper
  const step5 = document.getElementById('stepperStep5');
  const badge5 = document.getElementById('stepperBadge5');
  const isChampion = completedCount === 4;

  if (step5) {
    step5.className = `stepper-step ${isChampion ? 'completed champion-unlocked' : 'locked'}`;
  }
  if (badge5) {
    if (isChampion) {
      badge5.className = 'step-status-pill status-completed';
      badge5.textContent = 'Unlocked 🏆';
    } else {
      badge5.className = 'step-status-pill status-locked';
      badge5.textContent = 'Locked 🔒';
    }
  }

  state.arena.totalScore = totalScore;
  state.arena.completedCount = completedCount;
  state.arena.isChampion = isChampion;

  const totalScoreEl = document.getElementById('arenaTotalScore');
  if (totalScoreEl) totalScoreEl.textContent = `${totalScore} / 400`;

  const countEl = document.getElementById('arenaCompletedCount');
  if (countEl) countEl.textContent = `${completedCount} / 4`;

  const progressEl = document.getElementById('arenaProgressBar');
  if (progressEl) progressEl.style.width = `${(completedCount / 4) * 100}%`;

  const champBadge = document.getElementById('arenaChampionBadgeHub');
  if (champBadge) {
    champBadge.style.display = isChampion ? 'block' : 'none';
  }

  const submitHint = document.getElementById('arenaSubmitHint');
  if (submitHint) {
    if (isChampion) {
      submitHint.innerHTML = '🎉 <strong>All 4 challenges completed!</strong> Claim your verified E-Certificate with full 400 marks and Arena Champion title!';
    } else if (completedCount > 0) {
      submitHint.innerHTML = `You have completed ${completedCount} of 4 challenges (${totalScore} pts). Complete all 4 levels sequentially to unlock your Champion Certificate!`;
    } else {
      submitHint.textContent = 'Play challenges sequentially. Complete all 4 levels for full 400 marks and the Champion credential!';
    }
  }
}

async function navigateToArenaLevel(levelKey) {
  AudioFX.playClick();
  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');

  if (!attempt) {
    showToast('Please register first.', 'warning');
    switchView('landing');
    return;
  }

  // Check unlocking status
  const lvl = state.arena.levels[levelKey] || {};
  const isUnlocked = levelKey === 'circuitMaster' ? true : Boolean(lvl.unlocked);

  if (!isUnlocked) {
    AudioFX.playClick();
    showToast('🔒 This level is locked. Complete the previous level in sequence first!', 'warning');
    return;
  }

  switchView(levelKeyToView(levelKey));
  await loadAndStartLevel(levelKey);
}

function setupArenaNavigation() {
  // Hub Play buttons and cards
  const levels = [
    { key: 'circuitMaster', btn: 'btnPlayCircuit', card: 'cardCircuit' },
    { key: 'spinArena', btn: 'btnPlaySpin', card: 'cardSpin' },
    { key: 'buildZone', btn: 'btnPlayBuild', card: 'cardBuild' },
    { key: 'escapeRoom', btn: 'btnPlayEscape', card: 'cardEscape' }
  ];

  levels.forEach(lvl => {
    const btn = document.getElementById(lvl.btn);
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToArenaLevel(lvl.key);
    });

    const card = document.getElementById(lvl.card);
    if (card) card.addEventListener('click', () => {
      navigateToArenaLevel(lvl.key);
    });
  });

  // Back to Arena buttons
  const backButtons = [
    'btnBackToArenaFromL1', 'btnBackToArenaFromL2', 'btnBackToArenaFromL3', 'btnBackToArenaFromL4',
    'btnL1ToArena', 'btnL2ToArena', 'btnL3ToArena', 'btnL4ToArena'
  ];
  backButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      AudioFX.playClick();
      enterEngineeringArena();
    });
  });

  // Finish Arena & Claim Certificate
  const btnFinish = document.getElementById('btnFinishArena');
  if (btnFinish) btnFinish.addEventListener('click', finishEngineeringArena);
}

// ----------------------------------------------------
// COMMON ARENA LEVEL LOADER & QUESTION RUNNER
// ----------------------------------------------------

async function recordInteractiveAction(levelKey, payload = {}) {
  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');
  const participant = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  if (!attempt && !participant) return null;

  try {
    const res = await fetch('/api/arena/interactive-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-participant-data': encodeURIComponent(JSON.stringify(participant || {}))
      },
      body: JSON.stringify({
        attemptId: attempt ? attempt.attemptId : null,
        participantId: participant ? participant.participantId : null,
        participantData: participant,
        levelKey,
        payload
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to record interactive action:', err);
    return null;
  }
}

async function loadAndStartLevel(levelKey) {
  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');
  const participant = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  if (!attempt && !participant) {
    showToast('Please register first.', 'warning');
    switchView('landing');
    return;
  }

  const attemptId = attempt ? attempt.attemptId : '';
  const participantId = participant ? participant.participantId : '';

  const viewPrefix = {
    circuitMaster: 'l1',
    spinArena: 'l2',
    buildZone: 'l3',
    escapeRoom: 'l4'
  }[levelKey];

  try {
    const res = await fetch(`/api/arena/level/${levelKey}?attemptId=${encodeURIComponent(attemptId)}&participantId=${encodeURIComponent(participantId)}`, {
      headers: {
        'x-participant-data': encodeURIComponent(JSON.stringify(participant || {}))
      }
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to load level data.', 'error');
      switchView('arena');
      return;
    }

    state.arena.levels[levelKey] = Object.assign(state.arena.levels[levelKey] || {}, data);

    const hudScore = document.getElementById(`hud${viewPrefix.toUpperCase()}Score`);
    if (hudScore) hudScore.textContent = `Score: ${data.score || 0} / 100`;

    // If level is already completed: show success card
    if (data.completed) {
      showLevelCompletedCard(levelKey, data);
      return;
    }

    // If interactive challenge already done: resume question runner
    if (data.interactiveCompleted) {
      if (levelKey === 'circuitMaster') {
        const gap = document.getElementById('gapSlot');
        if (gap) {
          gap.classList.add('connected');
          gap.innerHTML = '<span style="color:#00f0ff; font-weight:800; font-size:12px;">⚡ COPPER CONDUCTOR CONNECTED (CIRCUIT CLOSED) ⚡</span>';
        }
        document.querySelectorAll('.wire-trace').forEach(t => t.classList.add('energized'));
        const bulb = document.getElementById('bulbVisual');
        if (bulb) bulb.classList.add('powered');
        const bulbStatus = document.getElementById('bulbStatusText');
        if (bulbStatus) { bulbStatus.textContent = 'ILLUMINATED (9V DC) 💡'; bulbStatus.classList.add('powered'); }
      } else if (levelKey === 'spinArena') {
        const banner = document.getElementById('spinCategoryBanner');
        if (banner) banner.style.display = 'flex';
      } else if (levelKey === 'buildZone') {
        ['foundation', 'deck', 'arch'].forEach(type => {
          const slot = document.getElementById(`slot${type.charAt(0).toUpperCase() + type.slice(1)}`);
          if (slot) slot.classList.add('filled');
        });
      } else if (levelKey === 'escapeRoom') {
        const blast = document.getElementById('blastDoorFrame');
        if (blast) blast.classList.add('unlocked');
        ['lockPill1', 'lockPill2', 'lockPill3'].forEach(id => {
          const pill = document.getElementById(id);
          if (pill) pill.classList.add('unlocked');
        });
      }

      startLevelQuestionRunner(levelKey, data.questions, data.answers || {});
    }
  } catch (err) {
    console.error('Error loading level questions:', err);
  }
}

function startLevelQuestionRunner(levelKey, questions = [], existingAnswers = {}) {
  const viewPrefix = {
    circuitMaster: 'l1',
    spinArena: 'l2',
    buildZone: 'l3',
    escapeRoom: 'l4'
  }[levelKey];

  const runnerCard = document.getElementById(`${viewPrefix}QuestionRunner`);
  if (!runnerCard) return;
  runnerCard.style.display = 'block';

  const roundNumber = {
    circuitMaster: 1,
    spinArena: 2,
    buildZone: 3,
    escapeRoom: 4
  }[levelKey] || 1;

  const q = questions[0];
  if (!q) return;

  // If already answered
  if (existingAnswers && existingAnswers[q.id]) {
    completeAndShowLevelSuccess(levelKey);
    return;
  }

  let selectedOption = null;

  const counterEl = document.getElementById(`${viewPrefix}RunnerCounter`);
  const progressEl = document.getElementById(`${viewPrefix}RunnerProgressBar`);
  const textEl = document.getElementById(`${viewPrefix}RunnerQuestionText`);
  const optionsGrid = document.getElementById(`${viewPrefix}RunnerOptionsGrid`);
  const feedbackBox = document.getElementById(`${viewPrefix}RunnerFeedbackBox`);
  const submitBtn = document.getElementById(`${viewPrefix}BtnSubmitAnswer`);
  const nextBtn = document.getElementById(`${viewPrefix}BtnNextQuestion`);

  if (counterEl) counterEl.textContent = `Round ${roundNumber} Engineering Question (${q.id})`;
  if (progressEl) progressEl.style.width = '100%';
  if (textEl) textEl.textContent = q.question;

  if (feedbackBox) feedbackBox.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';
  if (submitBtn) {
    submitBtn.style.display = 'inline-block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMIT ANSWER 📝';
  }

  if (optionsGrid) {
    optionsGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    letters.forEach(letter => {
      const text = q.options[letter];
      if (!text) return;
      const card = document.createElement('div');
      card.className = 'option-card';
      card.innerHTML = `
        <div class="option-badge">${letter}</div>
        <div class="option-label">${text}</div>
      `;

      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        AudioFX.playClick();
        selectedOption = letter;

        optionsGrid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (submitBtn) submitBtn.disabled = false;
      });

      optionsGrid.appendChild(card);
    });
  }

  // Submit Answer Action
  if (submitBtn) {
    submitBtn.onclick = async () => {
      if (!selectedOption) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'SUBMITTING ANSWER... ⏳';

      const attempt = state.attempt ||
        JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
        JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');
      const participant = state.participant ||
        JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
        JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

      try {
        const res = await fetch('/api/arena/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-participant-data': encodeURIComponent(JSON.stringify(participant || {}))
          },
          body: JSON.stringify({
            attemptId: attempt ? attempt.attemptId : null,
            participantId: participant ? participant.participantId : null,
            participantData: participant,
            levelKey,
            questionId: q.id,
            selectedOption
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Answer evaluation failed');

        // Freeze options
        optionsGrid.querySelectorAll('.option-card').forEach(c => c.classList.add('disabled'));

        // Highlight correct and incorrect options
        optionsGrid.querySelectorAll('.option-card').forEach(c => {
          const badge = c.querySelector('.option-badge');
          const letter = badge ? badge.textContent.trim() : '';
          if (letter === data.correctOption) {
            c.classList.add('correct-revealed');
          } else if (letter === selectedOption && !data.isCorrect) {
            c.classList.add('incorrect-revealed');
          }
        });

        // Show friendly feedback box (Requirement 6: NO PASS MARK)
        if (feedbackBox) {
          feedbackBox.className = `runner-feedback-box ${data.isCorrect ? 'correct' : 'incorrect'}`;
          const iconEl = document.getElementById(`${viewPrefix}FeedbackIcon`);
          const titleEl = document.getElementById(`${viewPrefix}FeedbackTitle`);
          const ptsEl = document.getElementById(`${viewPrefix}FeedbackPts`);
          const expEl = document.getElementById(`${viewPrefix}FeedbackExplanation`);

          if (iconEl) iconEl.textContent = data.isCorrect ? '🌟' : '💡';
          if (titleEl) titleEl.textContent = data.friendlyFeedback || (data.isCorrect ? "Excellent! Let's move to the next round." : "Good try! Let's continue to the next round.");
          if (ptsEl) ptsEl.textContent = '+100 Points Awarded';
          if (expEl) expEl.textContent = data.explanation || '';
          feedbackBox.style.display = 'block';
        }

        if (data.isCorrect) {
          AudioFX.playCelebration();
        } else {
          AudioFX.playClick();
        }

        submitBtn.style.display = 'none';

        // Show Next Round button
        if (nextBtn) {
          nextBtn.style.display = 'inline-block';
          const nextConfig = {
            circuitMaster: { label: 'PROCEED TO ROUND 2 (SPIN ARENA) →', targetKey: 'spinArena' },
            spinArena: { label: 'PROCEED TO ROUND 3 (BUILD ZONE) →', targetKey: 'buildZone' },
            buildZone: { label: 'PROCEED TO ROUND 4 (ESCAPE ROOM) →', targetKey: 'escapeRoom' },
            escapeRoom: { label: 'CLAIM YOUR CHAMPION CERTIFICATE 🏆', targetKey: 'finish' }
          }[levelKey];

          nextBtn.textContent = nextConfig ? nextConfig.label : 'PROCEED TO NEXT ROUND →';
          nextBtn.onclick = () => {
            AudioFX.playClick();
            if (nextConfig && nextConfig.targetKey === 'finish') {
              finishEngineeringArena();
            } else if (nextConfig) {
              navigateToArenaLevel(nextConfig.targetKey);
            } else {
              enterEngineeringArena();
            }
          };
        }

        // Update local state and hub
        if (state.arena.levels[levelKey]) {
          state.arena.levels[levelKey].completed = true;
          state.arena.levels[levelKey].score = 100;
        }
        await refreshArenaStatus();
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'SUBMIT ANSWER 📝';
      }
    };
  }

  async function completeAndShowLevelSuccess(key) {
    const attempt = state.attempt ||
      JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
      JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');
    const participant = state.participant ||
      JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
      JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

    try {
      const res = await fetch('/api/arena/complete-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-data': encodeURIComponent(JSON.stringify(participant || {}))
        },
        body: JSON.stringify({
          attemptId: attempt ? attempt.attemptId : null,
          participantId: participant ? participant.participantId : null,
          participantData: participant,
          levelKey: key
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete round.');

      launchConfetti();
      AudioFX.playCelebration();

      if (runnerCard) runnerCard.style.display = 'none';

      showLevelCompletedCard(key, data);
      await refreshArenaStatus();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

function showLevelCompletedCard(levelKey, data = {}) {
  const viewPrefix = {
    circuitMaster: 'l1',
    spinArena: 'l2',
    buildZone: 'l3',
    escapeRoom: 'l4'
  }[levelKey];

  const successCard = document.getElementById(`${viewPrefix}SuccessCard`);
  if (!successCard) return;

  const score = data.score !== undefined ? data.score : (data.levelScore !== undefined ? data.levelScore : 100);
  const scoreTag = document.getElementById(`${viewPrefix}AwardedScore`);
  if (scoreTag) scoreTag.textContent = `+${score} Points Awarded!`;

  const hudScoreEl = document.getElementById(`hud${viewPrefix.toUpperCase()}Score`);
  if (hudScoreEl) hudScoreEl.textContent = `Score: ${score} / 100`;

  successCard.style.display = 'block';

  // Setup Next Level buttons
  const nextBtnMapping = {
    circuitMaster: { btnId: 'btnL1NextLevel', targetKey: 'spinArena' },
    spinArena: { btnId: 'btnL2NextLevel', targetKey: 'buildZone' },
    buildZone: { btnId: 'btnL3NextLevel', targetKey: 'escapeRoom' }
  };

  if (nextBtnMapping[levelKey]) {
    const btn = document.getElementById(nextBtnMapping[levelKey].btnId);
    if (btn) {
      btn.onclick = () => {
        AudioFX.playClick();
        navigateToArenaLevel(nextBtnMapping[levelKey].targetKey);
      };
    }
  }

  // Level 4 Claim Certificate button
  if (levelKey === 'escapeRoom') {
    const champBtn = document.getElementById('btnL4ClaimCertificate');
    if (champBtn) {
      champBtn.onclick = () => {
        AudioFX.playClick();
        finishEngineeringArena();
      };
    }
  }
}

// ----------------------------------------------------
// LEVEL 1: CIRCUIT MASTER (INTERACTIVE BLUE & CYAN)
// ----------------------------------------------------
function setupLevel1CircuitMaster() {
  const wire = document.getElementById('wireToolboxItem');
  const gapSlot = document.getElementById('gapSlot');
  const dropZone = document.getElementById('circuitGapDropZone');
  const quickConnectBtn = document.getElementById('btnQuickConnectWire');
  const resetBtn = document.getElementById('btnResetCircuit');
  const hintBtn = document.getElementById('btnHintL1');
  const bulbVisual = document.getElementById('bulbVisual');
  const bulbStatus = document.getElementById('bulbStatusText');
  const wireTraces = document.querySelectorAll('.wire-trace');

  async function completeCircuit() {
    AudioFX.playClick();
    state.arena.levels.circuitMaster.wireConnected = true;

    // Visual: Connected Gap
    if (gapSlot) {
      gapSlot.classList.add('connected');
      gapSlot.innerHTML = '<span style="color:#00f0ff; font-weight:800; font-size:12px;">⚡ COPPER CONDUCTOR CONNECTED (CIRCUIT CLOSED) ⚡</span>';
    }

    // Energize Wires
    wireTraces.forEach(t => t.classList.add('energized'));

    // Illuminate Bulb
    if (bulbVisual) bulbVisual.classList.add('powered');
    if (bulbStatus) {
      bulbStatus.textContent = 'ILLUMINATED (9V DC) 💡';
      bulbStatus.classList.add('powered');
    }

    AudioFX.playCelebration();
    showToast('Circuit completed! Electrical current is flowing through the filament!', 'success');

    // Record action on backend
    await recordInteractiveAction('circuitMaster', { wireConnected: true });

    // Start 5-question runner
    await loadAndStartLevel('circuitMaster');
  }

  function resetCircuit() {
    state.arena.levels.circuitMaster.wireConnected = false;

    if (gapSlot) {
      gapSlot.classList.remove('connected');
      gapSlot.innerHTML = '<span class="gap-placeholder-text">⚡ DRAG OR CLICK WIRE TO CONNECT HERE ⚡</span>';
    }

    wireTraces.forEach(t => t.classList.remove('energized'));
    if (bulbVisual) bulbVisual.classList.remove('powered');
    if (bulbStatus) {
      bulbStatus.textContent = 'OFF';
      bulbStatus.classList.remove('powered');
    }

    const runner = document.getElementById('l1QuestionRunner');
    if (runner) runner.style.display = 'none';
    const successCard = document.getElementById('l1SuccessCard');
    if (successCard) successCard.style.display = 'none';

    showToast('Circuit reset to open state.', 'info');
  }

  // Drag and drop event listeners
  if (wire) {
    wire.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'copper-wire');
    });
    wire.addEventListener('click', completeCircuit);
  }

  const dropTargets = [gapSlot, dropZone].filter(Boolean);
  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (gapSlot) gapSlot.classList.add('hover-over');
    });
    target.addEventListener('dragleave', () => {
      if (gapSlot) gapSlot.classList.remove('hover-over');
    });
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      if (gapSlot) gapSlot.classList.remove('hover-over');
      completeCircuit();
    });
  });

  if (quickConnectBtn) quickConnectBtn.addEventListener('click', completeCircuit);
  if (resetBtn) resetBtn.addEventListener('click', resetCircuit);
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      showToast('💡 Hint: Connect the conductive copper wire across the open terminal gap to close the loop and power the bulb!', 'info');
    });
  }
}

// ----------------------------------------------------
// LEVEL 2: SPIN ARENA (PURPLE & GOLD THEME)
// ----------------------------------------------------
function setupLevel2SpinArena() {
  const canvas = document.getElementById('spinWheelCanvas');
  const spinBtn = document.getElementById('btnSpinWheel');
  const statusText = document.getElementById('spinStatusText');
  const bonusCard = document.getElementById('spinBonusCard');
  const claimBonusBtn = document.getElementById('btnClaimBonusPoints');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const categories = [
    { name: 'Electrical Engineering', icon: '⚡', color: '#4361ee' },
    { name: 'Computer Engineering', icon: '💻', color: '#7209b7' },
    { name: 'Mechanical Engineering', icon: '⚙️', color: '#3a0ca3' },
    { name: 'Civil Engineering', icon: '🏗️', color: '#f72585' },
    { name: 'Basic Science', icon: '🔬', color: '#4cc9f0' },
    { name: 'Brain Teaser', icon: '💡', color: '#f77f00' },
    { name: 'Bonus Points', icon: '🌟', color: '#ffd166' },
    { name: 'Surprise Challenge', icon: '🎁', color: '#06d6a0' }
  ];

  const totalSlices = categories.length;
  const sliceAngle = (2 * Math.PI) / totalSlices;
  let currentRotation = 0;
  let isSpinning = false;

  function drawWheel(rotation = 0) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 16;

    ctx.clearRect(0, 0, width, height);

    // Outer Glowing Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(255, 209, 102, 0.6)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    // Wheel Segments
    for (let i = 0; i < totalSlices; i++) {
      const startAngle = rotation + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = categories[i].color;
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text & Icon in Slice
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = i === 6 ? '#0b0f19' : '#ffffff'; // Dark text for gold slice
      ctx.font = 'bold 12.5px Montserrat, sans-serif';
      ctx.fillText(`${categories[i].name} ${categories[i].icon}`, radius - 20, 4);
      ctx.restore();

      ctx.restore();
    }

    // Center Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#0b0f19';
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', centerX, centerY);
    ctx.restore();
  }

  drawWheel(0);

  async function spinTheWheel() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    if (statusText) statusText.textContent = 'Wheel spinning at high velocity... Hold on!';

    let targetIdx = 0;
    try {
      const attempt = state.attempt || JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null');
      const participant = state.participant || JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null');
      const res = await fetch(`/api/arena/level/spinArena?attemptId=${encodeURIComponent(attempt?.attemptId || '')}&participantId=${encodeURIComponent(participant?.participantId || '')}`, {
        headers: { 'x-participant-data': encodeURIComponent(JSON.stringify(participant || {})) }
      });
      const data = await res.json();
      if (data.questions && data.questions[0]) {
        state.arena.levels.spinArena.questions = data.questions;
        const qCat = (data.questions[0].category || '').toLowerCase();
        const matched = categories.findIndex(c => qCat.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(qCat));
        if (matched >= 0) targetIdx = matched;
      }
    } catch (e) {
      targetIdx = Math.floor(Math.random() * totalSlices);
    }

    const targetCategory = categories[targetIdx];
    const targetCenter = targetIdx * sliceAngle + sliceAngle / 2;
    const topPointerAngle = (3 * Math.PI) / 2;
    let targetAngle = topPointerAngle - targetCenter;

    const extraSpins = (5 + Math.floor(Math.random() * 3)) * (2 * Math.PI);
    const startAngle = currentRotation % (2 * Math.PI);
    let delta = targetAngle - startAngle;
    while (delta < 0) delta += 2 * Math.PI;
    const totalRotation = delta + extraSpins;

    const duration = 3400; // ms
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      currentRotation = startAngle + totalRotation * eased;
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        spinBtn.disabled = false;
        handleSpinResult(targetCategory);
      }
    }

    requestAnimationFrame(animate);
  }

  async function handleSpinResult(cat) {
    AudioFX.playCelebration();
    state.arena.levels.spinArena.selectedCategory = cat.name;

    if (statusText) statusText.textContent = `Wheel stopped on: ${cat.name}!`;

    const catNameEl = document.getElementById('spinCatName');
    const catIconEl = document.getElementById('spinCatIcon');
    const bannerEl = document.getElementById('spinCategoryBanner');

    if (catNameEl) catNameEl.textContent = cat.name;
    if (catIconEl) catIconEl.textContent = cat.icon;
    if (bannerEl) bannerEl.style.display = 'flex';

    await recordInteractiveAction('spinArena', { spinCompleted: true, category: cat.name });

    if (cat.name === 'Bonus Points') {
      state.arena.levels.spinArena.isBonus = true;
      if (bonusCard) bonusCard.style.display = 'block';
    } else {
      state.arena.levels.spinArena.isBonus = false;
      if (bonusCard) bonusCard.style.display = 'none';
      await loadAndStartLevel('spinArena');
    }
  }

  if (claimBonusBtn) {
    claimBonusBtn.addEventListener('click', async () => {
      AudioFX.playCelebration();
      if (bonusCard) bonusCard.style.display = 'none';
      await loadAndStartLevel('spinArena');
    });
  }

  if (spinBtn) spinBtn.addEventListener('click', spinTheWheel);
}

// ----------------------------------------------------
// LEVEL 3: BUILD ZONE (GREEN & TEAL THEME)
// ----------------------------------------------------
function setupLevel3BuildZone() {
  const compFoundation = document.getElementById('compFoundation');
  const compDeck = document.getElementById('compDeck');
  const compArch = document.getElementById('compArch');
  const slotFoundation = document.getElementById('slotFoundation');
  const slotDeck = document.getElementById('slotDeck');
  const slotArch = document.getElementById('slotArch');
  const resetBtn = document.getElementById('btnResetBridge');
  const autoBuildBtn = document.getElementById('btnAutoBuildBridge');
  const hintBtn = document.getElementById('btnHintL3');
  const vehicleCar = document.getElementById('vehicleCar');
  const counterEl = document.getElementById('bridgePlacedCounter');

  const components = [
    { type: 'foundation', el: compFoundation, slot: slotFoundation, name: 'Foundation Truss Pier 🏗️' },
    { type: 'deck', el: compDeck, slot: slotDeck, name: 'Roadway Deck Span 🛣️' },
    { type: 'arch', el: compArch, slot: slotArch, name: 'Suspension Arch Beam 🌈' }
  ];

  function placeComponent(type) {
    AudioFX.playClick();
    state.arena.levels.buildZone.placedComponents[type] = true;

    const item = components.find(c => c.type === type);
    if (!item) return;

    if (item.slot) {
      item.slot.classList.add('filled');
      const textSpan = item.slot.querySelector('.slot-text');
      if (textSpan) textSpan.style.display = 'none';
      const placedItem = item.slot.querySelector('.slot-placed-item');
      if (placedItem) placedItem.innerHTML = `<span style="color:#06d6a0; font-weight:800;">✓ ${item.name} INSTALLED</span>`;
    }

    if (item.el) {
      item.el.classList.add('used');
      const btn = item.el.querySelector('.btn-place-comp');
      if (btn) btn.textContent = 'Installed ✓';
    }

    checkBridgeCompletion();
  }

  async function checkBridgeCompletion() {
    const placed = state.arena.levels.buildZone.placedComponents;
    const count = ['foundation', 'deck', 'arch'].filter(k => placed[k]).length;

    if (counterEl) counterEl.textContent = `Placed: ${count} / 3`;

    if (count === 3 && !state.arena.levels.buildZone.vehiclePassed) {
      state.arena.levels.buildZone.vehiclePassed = true;
      AudioFX.playCelebration();
      showToast('Bridge structural integrity confirmed! Running vehicle load test...', 'success');

      if (vehicleCar) {
        vehicleCar.classList.remove('crossing');
        void vehicleCar.offsetWidth;
        vehicleCar.classList.add('crossing');
      }

      await recordInteractiveAction('buildZone', { bridgeBuilt: true, vehiclePassed: true });

      setTimeout(async () => {
        await loadAndStartLevel('buildZone');
      }, 1800);
    }
  }

  function resetBridge() {
    state.arena.levels.buildZone.placedComponents = {};
    state.arena.levels.buildZone.vehiclePassed = false;

    components.forEach(item => {
      if (item.slot) {
        item.slot.classList.remove('filled');
        const textSpan = item.slot.querySelector('.slot-text');
        if (textSpan) textSpan.style.display = 'inline';
        const placedItem = item.slot.querySelector('.slot-placed-item');
        if (placedItem) placedItem.innerHTML = '';
      }
      if (item.el) {
        item.el.classList.remove('used');
        const btn = item.el.querySelector('.btn-place-comp');
        if (btn) btn.textContent = `Place in Slot`;
      }
    });

    if (vehicleCar) vehicleCar.classList.remove('crossing');
    if (counterEl) counterEl.textContent = 'Placed: 0 / 3';

    const runner = document.getElementById('l3QuestionRunner');
    if (runner) runner.style.display = 'none';
    const successCard = document.getElementById('l3SuccessCard');
    if (successCard) successCard.style.display = 'none';

    showToast('Bridge construction site reset.', 'info');
  }

  function autoAssembleBridge() {
    ['foundation', 'deck', 'arch'].forEach(t => placeComponent(t));
  }

  components.forEach(item => {
    if (item.el) {
      item.el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.type);
      });
      const placeBtn = item.el.querySelector('.btn-place-comp');
      if (placeBtn) placeBtn.addEventListener('click', () => placeComponent(item.type));
      item.el.addEventListener('click', (e) => {
        if (!e.target.closest('button')) placeComponent(item.type);
      });
    }

    if (item.slot) {
      item.slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.slot.classList.add('hover-over');
      });
      item.slot.addEventListener('dragleave', () => {
        item.slot.classList.remove('hover-over');
      });
      item.slot.addEventListener('drop', (e) => {
        e.preventDefault();
        item.slot.classList.remove('hover-over');
        const droppedType = e.dataTransfer.getData('text/plain');
        if (droppedType === item.type) {
          placeComponent(item.type);
        } else {
          showToast(`This component belongs in a different slot!`, 'warning');
        }
      });
    }
  });

  if (resetBtn) resetBtn.addEventListener('click', resetBridge);
  if (autoBuildBtn) autoBuildBtn.addEventListener('click', autoAssembleBridge);
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      showToast('💡 Hint: Place the Foundation Truss Pier at the bottom, Roadway Deck Span in the middle, and Suspension Arch Beam on top!', 'info');
    });
  }
}

// ----------------------------------------------------
// LEVEL 4: ENGINEERING ESCAPE ROOM (FUTURISTIC LAB)
// ----------------------------------------------------
function setupLevel4EscapeRoom() {
  const briefingView = document.getElementById('escapeBriefingView');
  const startMissionBtn = document.getElementById('btnStartMission');
  const c1Card = document.getElementById('escapeC1Card');
  const c2Card = document.getElementById('escapeC2Card');
  const c3Card = document.getElementById('escapeC3Card');
  const successCard = document.getElementById('l4SuccessCard');
  const blastDoorFrame = document.getElementById('blastDoorFrame');
  const doorBlinker = document.getElementById('doorBlinker');
  const doorStatusText = document.getElementById('doorStatusText');
  const lockPill1 = document.getElementById('lockPill1');
  const lockPill2 = document.getElementById('lockPill2');
  const lockPill3 = document.getElementById('lockPill3');
  const stageIndicator = document.getElementById('escapeStageIndicator');

  // Challenge 1 Buttons & Options
  const c1SubmitBtn = document.getElementById('btnSubmitEscapeC1');
  const c1OptionsGrid = document.getElementById('escapeC1OptionsGrid');

  // Challenge 2 Buttons & Cards
  const c2SubmitBtn = document.getElementById('btnSubmitEscapeC2');
  const c2ComponentGrid = document.getElementById('escapeC2ComponentGrid');

  // Challenge 3 Keypad
  const keypadScreen = document.getElementById('keypadScreenDisplay');
  const keypadButtons = document.querySelectorAll('.keypad-btn[data-key]');
  const keypadClearBtn = document.getElementById('btnKeypadClear');
  const keypadEnterBtn = document.getElementById('btnKeypadEnter');

  let enteredPin = '';

  // Start Mission
  if (startMissionBtn) {
    startMissionBtn.addEventListener('click', () => {
      AudioFX.playClick();
      if (briefingView) briefingView.style.display = 'none';
      if (c1Card) c1Card.style.display = 'block';
      if (stageIndicator) stageIndicator.textContent = 'Stage 1: Logic Lock';
      renderEscapeC1();
    });
  }

  // Render C1 Options
  function renderEscapeC1() {
    if (!c1OptionsGrid) return;
    c1OptionsGrid.innerHTML = '';

    const options = {
      A: '18',
      B: '24',
      C: '32',
      D: '36'
    };

    ['A', 'B', 'C', 'D'].forEach(letter => {
      const card = document.createElement('div');
      card.className = `option-card ${state.arena.levels.escapeRoom.c1Option === letter ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="option-badge">${letter}</div>
        <div class="option-label">Option ${letter}: <strong>${options[letter]}</strong> (Pattern: × 2)</div>
      `;

      card.addEventListener('click', () => {
        AudioFX.playClick();
        state.arena.levels.escapeRoom.c1Option = letter;
        renderEscapeC1();
        if (c1SubmitBtn) c1SubmitBtn.disabled = false;
      });

      c1OptionsGrid.appendChild(card);
    });
  }

  // C1 Submit -> Unlock Lock 1 & Transition to C2
  if (c1SubmitBtn) {
    c1SubmitBtn.addEventListener('click', () => {
      const opt = state.arena.levels.escapeRoom.c1Option;
      if (opt === 'C') {
        AudioFX.playCelebration();
        state.arena.levels.escapeRoom.c1Solved = true;
        showToast('Lock 1 Disengaged! Pattern confirmed: 2 × 2 = 4, 4 × 2 = 8, 8 × 2 = 16, 16 × 2 = 32', 'success');

        if (lockPill1) {
          lockPill1.classList.add('unlocked');
          lockPill1.innerHTML = '<span class="lock-icon">🔓</span><span>Lock 1: Disengaged</span>';
        }

        if (c1Card) c1Card.style.display = 'none';
        if (c2Card) c2Card.style.display = 'block';
        if (stageIndicator) stageIndicator.textContent = 'Stage 2: Hardware ID';
        renderEscapeC2();
      } else {
        AudioFX.playClick();
        showToast('Incorrect sequence progression. Each number multiplies by 2 (2, 4, 8, 16...). Try again!', 'warning');
      }
    });
  }

  // Render C2 Component Cards
  function renderEscapeC2() {
    if (!c2ComponentGrid) return;
    c2ComponentGrid.innerHTML = '';

    const components = [
      { id: 'motor', name: 'Electric Motor', icon: '⚙️', desc: 'Electromagnetic coils generate rotational torque' },
      { id: 'battery', name: 'Chemical Battery', icon: '🔋', desc: 'Stores chemical potential energy' },
      { id: 'bulb', name: 'Incandescent Bulb', icon: '💡', desc: 'Converts current into radiant light' },
      { id: 'resistor', name: 'Carbon Resistor', icon: '⚡', desc: 'Dissipates excess electrical energy as heat' }
    ];

    components.forEach(comp => {
      const card = document.createElement('div');
      const isSelected = state.arena.levels.escapeRoom.c2Component === comp.id;
      card.className = `comp-select-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="comp-card-icon">${comp.icon}</div>
        <div class="comp-card-details">
          <div class="comp-card-name">${comp.name}</div>
          <div style="font-size:11px; color:var(--text-muted);">${comp.desc}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        AudioFX.playClick();
        state.arena.levels.escapeRoom.c2Component = comp.id;
        renderEscapeC2();
        if (c2SubmitBtn) c2SubmitBtn.disabled = false;
      });

      c2ComponentGrid.appendChild(card);
    });
  }

  // C2 Submit -> Unlock Lock 2 & Transition to C3
  if (c2SubmitBtn) {
    c2SubmitBtn.addEventListener('click', () => {
      const comp = state.arena.levels.escapeRoom.c2Component;
      if (comp === 'motor') {
        AudioFX.playCelebration();
        state.arena.levels.escapeRoom.c2Solved = true;
        showToast('Lock 2 Disengaged! Electric motor verified: converts electrical to mechanical energy!', 'success');

        if (lockPill2) {
          lockPill2.classList.add('unlocked');
          lockPill2.innerHTML = '<span class="lock-icon">🔓</span><span>Lock 2: Disengaged</span>';
        }

        if (c2Card) c2Card.style.display = 'none';
        if (c3Card) c3Card.style.display = 'block';
        if (stageIndicator) stageIndicator.textContent = 'Stage 3: Digital Override';
      } else {
        AudioFX.playClick();
        showToast('Incorrect component. We need the device that converts electrical energy into mechanical movement/rotation. Try again!', 'warning');
      }
    });
  }

  // C3 Keypad Handling
  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioFX.playClick();
      if (enteredPin.length < 4) {
        enteredPin += btn.dataset.key;
        if (keypadScreen) keypadScreen.textContent = enteredPin;
      }
    });
  });

  if (keypadClearBtn) {
    keypadClearBtn.addEventListener('click', () => {
      AudioFX.playClick();
      enteredPin = '';
      if (keypadScreen) keypadScreen.textContent = '_ _';
    });
  }

  if (keypadEnterBtn) {
    keypadEnterBtn.addEventListener('click', async () => {
      AudioFX.playClick();
      if (enteredPin.trim() === '10') {
        // PIN Correct! Final Unlock!
        keypadEnterBtn.disabled = true;

        try {
          state.arena.levels.escapeRoom.c3Solved = true;

          // Unlock Door Visually
          if (lockPill3) {
            lockPill3.classList.add('unlocked');
            lockPill3.innerHTML = '<span class="lock-icon">🔓</span><span>Lock 3: Disengaged</span>';
          }

          if (blastDoorFrame) blastDoorFrame.classList.add('unlocked');
          if (doorBlinker) {
            doorBlinker.classList.remove('red');
            doorBlinker.classList.add('green');
          }
          if (doorStatusText) {
            doorStatusText.textContent = 'ACCESS GRANTED • HIGH-TECH LABORATORY UNLOCKED';
            doorStatusText.style.color = '#22c55e';
          }

          AudioFX.playCelebration();
          showToast('Access Granted! Override successful. Now answer the Level 4 engineering questions!', 'success');

          if (c3Card) c3Card.style.display = 'none';
          if (stageIndicator) stageIndicator.textContent = 'Stage 4: Knowledge Override Matrix';

          await recordInteractiveAction('escapeRoom', {
            c1Solved: true,
            c2Solved: true,
            c3Solved: true,
            pinEntered: '10'
          });

          await loadAndStartLevel('escapeRoom');
        } catch (err) {
          showToast(err.message || 'Error unlocking Level 4 challenges', 'error');
        } finally {
          keypadEnterBtn.disabled = false;
        }
      } else {
        AudioFX.playClick();
        showToast('Access Denied. Convert binary 1010 to decimal: (1×8) + (0×4) + (1×2) + (0×1) = 10. Enter 10 to override!', 'warning');
        enteredPin = '';
        if (keypadScreen) keypadScreen.textContent = 'ERR';
        setTimeout(() => {
          if (keypadScreen) keypadScreen.textContent = '_ _';
        }, 1000);
      }
    });
  }
}

// ----------------------------------------------------
// FINISH ENGINEERING ARENA & SUBMIT RESULTS
// ----------------------------------------------------
async function finishEngineeringArena() {
  await refreshArenaStatus();
  const levels = state.arena.levels;
  const completedCount = ['circuitMaster', 'spinArena', 'buildZone', 'escapeRoom'].filter(k => levels[k]?.completed || levels[k]?.status === 'Completed').length;

  if (completedCount < 4) {
    AudioFX.playClick();
    showToast(`⚠️ All 4 Engineering Arena levels must be completed before claiming your certificate! Current progress: ${completedCount} / 4 levels.`, 'warning');
    alert(`⚠️ Incomplete Engineering Arena Progress!\n\nYou must complete all 4 levels in sequence to be eligible for your Certificate of Excellence:\n\n• Level 1: Circuit Master ${levels.circuitMaster?.completed ? '✅' : '⏳'}\n• Level 2: Spin Arena ${levels.spinArena?.completed ? '✅' : '⏳'}\n• Level 3: Build Zone ${levels.buildZone?.completed ? '✅' : '⏳'}\n• Level 4: Escape Room ${levels.escapeRoom?.completed ? '✅' : '⏳'}\n\nCurrent progress: ${completedCount} / 4 levels completed.`);
    return;
  }

  showToast('Generating official Engineering Arena E-Certificate...', 'info');

  const participant = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');

  try {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participant ? participant.participantId : null,
        attemptId: attempt ? attempt.attemptId : null,
        isArena: true,
        arena: state.arena,
        participant: participant
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit Arena results.');

    displayResults(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
async function startQuizSession() {
  try {
    const res = await fetch('/api/quiz/questions');
    const data = await res.json();

    if (!res.ok || !data.questions) {
      throw new Error(data.error || 'Failed to fetch questions.');
    }

    state.questions = data.questions;
    state.userAnswers = {};
    state.currentQuestionIndex = 0;
    state.quizSecondsElapsed = 0;

    // Set HUD info
    document.getElementById('hudParticipantName').textContent = state.participant.fullName.split(' ')[0];

    // Start timer
    if (state.quizTimerInterval) clearInterval(state.quizTimerInterval);
    state.quizTimerInterval = setInterval(updateQuizTimer, 1000);

    renderQuestionPills();
    renderCurrentQuestion();
    switchView('quiz');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateQuizTimer() {
  state.quizSecondsElapsed++;
  const mins = String(Math.floor(state.quizSecondsElapsed / 60)).padStart(2, '0');
  const secs = String(state.quizSecondsElapsed % 60).padStart(2, '0');
  const timerElem = document.getElementById('quizTimerText');
  if (timerElem) timerElem.textContent = `${mins}:${secs}`;
}

function renderQuestionPills() {
  const container = document.getElementById('questionPillsRow');
  container.innerHTML = '';

  state.questions.forEach((q, idx) => {
    const pill = document.createElement('div');
    pill.className = `q-pill ${idx === state.currentQuestionIndex ? 'active' : ''} ${state.userAnswers[q.id] ? 'answered' : ''}`;
    pill.textContent = idx + 1;
    pill.title = `Question ${idx + 1}`;

    pill.addEventListener('click', () => {
      AudioFX.playClick();
      state.currentQuestionIndex = idx;
      renderCurrentQuestion();
    });

    container.appendChild(pill);
  });
}

function renderCurrentQuestion() {
  const q = state.questions[state.currentQuestionIndex];
  if (!q) return;

  // Update HUD
  document.getElementById('hudQuestionCounter').textContent = `Question ${state.currentQuestionIndex + 1} of ${state.questions.length}`;
  document.getElementById('hudCategory').textContent = q.category;
  document.getElementById('hudDifficulty').textContent = q.difficulty;
  document.getElementById('qNumberBadge').textContent = `Q${state.currentQuestionIndex + 1}`;
  document.getElementById('qText').textContent = q.question;

  // Progress Bar
  const pct = Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100);
  document.getElementById('quizProgressFill').style.width = `${pct}%`;

  // Options
  const grid = document.getElementById('optionsGrid');
  grid.innerHTML = '';

  const optionLetters = ['A', 'B', 'C', 'D'];
  optionLetters.forEach((letter) => {
    const card = document.createElement('div');
    const isSelected = state.userAnswers[q.id] === letter;
    card.className = `option-card ${isSelected ? 'selected' : ''}`;

    card.innerHTML = `
      <div class="option-badge">${letter}</div>
      <div class="option-label">${q.options[letter] || ''}</div>
    `;

    card.addEventListener('click', () => {
      AudioFX.playClick();
      selectOption(q.id, letter);
    });

    grid.appendChild(card);
  });

  // Navigation Buttons
  const prevBtn = document.getElementById('prevQuestionBtn');
  const nextBtn = document.getElementById('nextQuestionBtn');
  const submitBtn = document.getElementById('submitQuizBtn');

  prevBtn.disabled = state.currentQuestionIndex === 0;

  if (state.currentQuestionIndex === state.questions.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    submitBtn.style.display = 'none';
  }

  renderQuestionPills();
}

function selectOption(questionId, letter) {
  // If already selected, clicking toggles or updates
  state.userAnswers[questionId] = letter;
  renderCurrentQuestion();
}

function setupQuizControls() {
  document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) {
      AudioFX.playClick();
      state.currentQuestionIndex--;
      renderCurrentQuestion();
    }
  });

  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      AudioFX.playClick();
      state.currentQuestionIndex++;
      renderCurrentQuestion();
    }
  });

  document.getElementById('submitQuizBtn').addEventListener('click', () => {
    openSubmitConfirmationModal();
  });

  document.getElementById('cancelSubmitBtn').addEventListener('click', () => {
    document.getElementById('confirmSubmitModal').classList.remove('active');
  });

  document.getElementById('finalSubmitBtn').addEventListener('click', () => {
    document.getElementById('confirmSubmitModal').classList.remove('active');
    submitFinalQuiz();
  });

  // Global Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (state.currentView !== 'quiz') return;
    if (document.getElementById('confirmSubmitModal').classList.contains('active')) return;

    const key = e.key.toUpperCase();
    const currentQ = state.questions[state.currentQuestionIndex];
    if (!currentQ) return;

    if (['A', 'B', 'C', 'D'].includes(key)) {
      selectOption(currentQ.id, key);
    } else if (['1', '2', '3', '4'].includes(key)) {
      const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      selectOption(currentQ.id, map[key]);
    } else if (e.key === 'ArrowLeft' && state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderCurrentQuestion();
    } else if (e.key === 'ArrowRight' && state.currentQuestionIndex < state.questions.length - 1) {
      state.currentQuestionIndex++;
      renderCurrentQuestion();
    }
  });
}

function openSubmitConfirmationModal() {
  const answeredCount = Object.keys(state.userAnswers).length;
  const total = state.questions.length;
  const unansweredCount = total - answeredCount;

  const statsPreview = document.getElementById('modalStatsPreview');
  statsPreview.innerHTML = `
    <div><strong>Answered:</strong> <span style="color:var(--success); font-weight:bold;">${answeredCount} / ${total}</span></div>
    <div><strong>Unanswered:</strong> <span style="color:${unansweredCount > 0 ? '#ff6b6b' : 'var(--text-muted)'}; font-weight:bold;">${unansweredCount}</span></div>
  `;

  document.getElementById('confirmSubmitModal').classList.add('active');
}

async function submitFinalQuiz() {
  if (state.quizTimerInterval) clearInterval(state.quizTimerInterval);

  showToast('Evaluating answers and generating certificate...', 'info');

  const participant = state.participant ||
    JSON.parse(sessionStorage.getItem('tyeb_participant') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_participant') || 'null');

  const attempt = state.attempt ||
    JSON.parse(sessionStorage.getItem('tyeb_attempt') || 'null') ||
    JSON.parse(localStorage.getItem('tyeb_attempt') || 'null');

  try {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participant ? participant.participantId : null,
        attemptId: attempt ? attempt.attemptId : null,
        answers: state.userAnswers,
        participant: participant
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit quiz.');
    }

    displayResults(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// RESULTS & CERTIFICATE HUB (VIEW 3)
// ==========================================
function displayResults(data) {
  AudioFX.playCelebration();
  launchConfetti();

  const evalData = data.evaluation;
  const cert = data.certificate;
  const participant = data.participant || state.participant;
  const emailStatus = data.emailStatus || { status: 'Pending Config' };
  const scoreMax = evalData.scoreMax || (evalData.arenaLevels ? 400 : (evalData.score > 10 ? 400 : 10));

  // Store in state
  state.lastEvaluation = evalData;
  state.lastCertificate = cert;

  // Header Details
  document.getElementById('resultsGreeting').textContent = `Congratulations, ${participant.fullName}!`;
  document.getElementById('resultsPerformanceBadge').textContent = evalData.performanceBadge;
  document.getElementById('resultsPerformanceMessage').textContent = evalData.performanceMessage;

  // Radial Progress Ring Animation
  const circumference = 2 * Math.PI * 70; // ~439.8
  const offset = circumference - (evalData.score / scoreMax) * circumference;
  const circleProgress = document.getElementById('scoreCircleProgress');
  if (circleProgress) circleProgress.style.strokeDashoffset = offset;

  // Number Counter Animation
  animateScoreNumber(evalData.score);
  const maxLabel = document.getElementById('resultsScoreMaxLabel');
  if (maxLabel) maxLabel.textContent = `/ ${scoreMax} MARKS`;
  document.getElementById('resultsScorePct').textContent = `${evalData.percentage}%`;

  // Metric Boxes
  document.getElementById('metricName').textContent = participant.fullName;
  document.getElementById('metricBranch').textContent = participant.branch;
  if (evalData.completedGamesCount !== undefined) {
    document.getElementById('metricCorrect').textContent = `${evalData.completedGamesCount} / 4 Challenges`;
    document.getElementById('metricIncorrect').textContent = `${evalData.score} / ${scoreMax} Points`;
  } else {
    document.getElementById('metricCorrect').textContent = evalData.correctAnswers;
    document.getElementById('metricIncorrect').textContent = evalData.incorrectAnswers;
  }

  // Arena Level Breakdown Card
  const aLevels = evalData.arenaLevels || state.arena.levels;
  if (aLevels) {
    const bCircuit = document.getElementById('bScoreCircuit');
    const bSpin = document.getElementById('bScoreSpin');
    const bBuild = document.getElementById('bScoreBuild');
    const bEscape = document.getElementById('bScoreEscape');
    const champBanner = document.getElementById('resultsChampionBanner');

    if (bCircuit) bCircuit.textContent = `${aLevels.circuitMaster?.score || 0} / 100`;
    if (bSpin) bSpin.textContent = `${aLevels.spinArena?.score || 0} / 100`;
    if (bBuild) bBuild.textContent = `${aLevels.buildZone?.score || 0} / 100`;
    if (bEscape) bEscape.textContent = `${aLevels.escapeRoom?.score || 0} / 100`;

    if (champBanner) {
      champBanner.style.display = evalData.isChampion ? 'block' : 'none';
    }
  }

  // Certificate Details & Preview Overlay
  document.getElementById('certIdTag').textContent = `ID: ${cert.certificateId}`;
  document.getElementById('certPreviewName').textContent = participant.fullName.toUpperCase();
  document.getElementById('certPreviewBranch').textContent = `Branch: ${participant.branch}`;
  document.getElementById('certPreviewScore').textContent = `Score: ${evalData.score} / ${scoreMax} (${evalData.percentage}%)${evalData.isChampion ? ' • Champion 🏆' : ''}`;
  document.getElementById('certPreviewId').textContent = `Certificate ID: ${cert.certificateId}`;

  // Download PDF Link (Direct In-Memory Blob URL if available, else server URL)
  const downloadBtn = document.getElementById('downloadCertBtn');
  if (cert.pdfBase64) {
    try {
      const byteCharacters = atob(cert.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      downloadBtn.href = blobUrl;
    } catch (e) {
      downloadBtn.href = cert.downloadUrl;
    }
  } else {
    downloadBtn.href = cert.downloadUrl;
  }
  downloadBtn.download = `Your_Engineering_Brain_Certificate_${cert.certificateId}.pdf`;

  // Email Status Badge
  updateEmailStatusUI(emailStatus.status, participant.email, emailStatus.message);

  // Question Review Accordion (hide if arena evaluation)
  const reviewCard = document.querySelector('.review-card');
  if (evalData.breakdown && evalData.breakdown.length > 0) {
    if (reviewCard) reviewCard.style.display = 'block';
    renderReviewAccordion(evalData.breakdown);
  } else {
    if (reviewCard) reviewCard.style.display = 'none';
  }

  // Switch to Results
  switchView('results');

  // Trigger E-Certificate Redirection Modal with countdown to Google Form
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSesbL495fyPcfYw49WAKHQqBVtaMsLOrkSRARc8dX6kKVUBMw/viewform?usp=publish-editor";
  openFormRedirectModal(googleFormUrl);
}

let redirectTimer = null;
function openFormRedirectModal(formUrl) {
  const modal = document.getElementById('formRedirectModal');
  if (!modal) return;

  const countdownElem = document.getElementById('countdownNumber');
  let seconds = 5;
  if (countdownElem) countdownElem.textContent = seconds;

  modal.classList.add('active');

  if (redirectTimer) clearInterval(redirectTimer);
  redirectTimer = setInterval(() => {
    seconds--;
    if (countdownElem) countdownElem.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(redirectTimer);
      modal.classList.remove('active');
      window.open(formUrl, '_blank');
    }
  }, 1000);

  const fillBtn = document.getElementById('modalFillFormBtn');
  if (fillBtn) {
    fillBtn.onclick = () => {
      if (redirectTimer) clearInterval(redirectTimer);
      modal.classList.remove('active');
    };
  }

  const stayBtn = document.getElementById('stayOnResultsBtn');
  if (stayBtn) {
    stayBtn.onclick = () => {
      if (redirectTimer) clearInterval(redirectTimer);
      modal.classList.remove('active');
      showToast('You can click "FILL FOR E-CERTIFICATE" anytime to receive your email certificate.', 'info');
    };
  }
}

function animateScoreNumber(targetScore) {
  const elem = document.getElementById('resultsScoreNumber');
  let current = 0;
  const step = Math.max(1, Math.round(targetScore / 10));
  const interval = setInterval(() => {
    current += step;
    if (current >= targetScore) {
      elem.textContent = targetScore;
      clearInterval(interval);
    } else {
      elem.textContent = current;
    }
  }, 60);
}

function updateEmailStatusUI(status, email, message) {
  const dot = document.getElementById('emailStatusDot');
  const title = document.getElementById('emailStatusTitle');
  const desc = document.getElementById('emailStatusDesc');
  const viewEmailBtn = document.getElementById('viewSimulatedEmailBtn');

  if (!dot || !title || !desc) return;

  dot.className = 'status-indicator-dot';

  if (status === 'Sent') {
    dot.classList.add('sent');
    title.textContent = 'Email Status: Delivered ✅';
    desc.textContent = `Your certificate has been successfully emailed to ${email}. Check your inbox and spam folder.`;
    viewEmailBtn.style.display = 'none';
  } else if (status === 'Failed') {
    dot.classList.add('failed');
    title.textContent = 'Email Status: Delivery Failed ⚠️';
    desc.textContent = `Could not reach ${email}. Click "Resend Email" or download your PDF directly.`;
    viewEmailBtn.style.display = 'none';
  } else {
    // Pending Config / Simulation
    dot.classList.add('pending-config');
    title.textContent = 'Email Status: Queued in System 📧';
    desc.textContent = `Certificate dispatch recorded for ${email}. Email ready in system log (Awaiting RESEND_API_KEY or SMTP credentials in .env for live inbox).`;
    viewEmailBtn.style.display = 'inline-flex';
  }
}

function renderReviewAccordion(breakdown = []) {
  const container = document.getElementById('reviewAccordion');
  container.innerHTML = '';

  breakdown.forEach((item, idx) => {
    const itemCard = document.createElement('div');
    itemCard.className = `review-item ${item.isCorrect ? 'correct' : 'incorrect'}`;

    const userSelectedText = item.selectedOption ? `${item.selectedOption}: ${item.options[item.selectedOption] || ''}` : 'Unanswered (None)';
    const correctText = `${item.correctOption}: ${item.options[item.correctOption] || ''}`;

    itemCard.innerHTML = `
      <div class="review-header-row">
        <div class="review-meta-left">
          <span class="q-number">Q${idx + 1}</span>
          <span class="review-q-title">${item.question.substring(0, 75)}...</span>
        </div>
        <span class="review-status-tag ${item.isCorrect ? 'tag-correct' : 'tag-incorrect'}">
          ${item.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
        </span>
      </div>
      <div class="review-body">
        <p style="margin-bottom:10px; font-weight:600; color:#ffffff;">${item.question}</p>
        <div style="font-size:13px; line-height:1.6;">
          <p><strong style="color:var(--text-muted);">Your Answer:</strong> <span style="color:${item.isCorrect ? 'var(--success)' : '#ff6b6b'}; font-weight:600;">${userSelectedText}</span></p>
          <p><strong style="color:var(--text-muted);">Correct Answer:</strong> <span style="color:var(--accent-teal); font-weight:600;">${correctText}</span></p>
        </div>
        <div class="review-explanation">
          <strong>💡 Engineering Explanation:</strong> ${item.explanation}
        </div>
      </div>
    `;

    itemCard.querySelector('.review-header-row').addEventListener('click', () => {
      AudioFX.playClick();
      itemCard.classList.toggle('open');
    });

    container.appendChild(itemCard);
  });
}

function setupResultsActions() {
  // Resend Email (if button exists)
  const resendBtn = document.getElementById('resendEmailBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (!state.participant) return;
      resendBtn.disabled = true;
      resendBtn.textContent = 'Resending...';

      try {
        const res = await fetch('/api/certificate/resend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId: state.participant.participantId })
        });
        const data = await res.json();
        showToast(data.message || 'Email resent successfully.', 'success');
        updateEmailStatusUI(data.status, state.participant.email, data.message);
      } catch (err) {
        showToast('Error resending email.', 'error');
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = '🔄 Resend Email';
      }
    });
  }

  // Simulated Email Modal (if button exists)
  const simEmailBtn = document.getElementById('viewSimulatedEmailBtn');
  if (simEmailBtn) {
    simEmailBtn.addEventListener('click', () => {
      const p = state.participant;
      const cert = state.lastCertificate;
      const evalData = state.lastEvaluation;

      const modalContent = document.getElementById('simulatedEmailContent');
      if (modalContent && p && cert && evalData) {
        modalContent.innerHTML = `
          <div style="background:#091224; border:1px solid var(--border-subtle); border-radius:8px; padding:16px; font-size:13px;">
            <p><strong>To:</strong> ${p.email}</p>
            <p><strong>From:</strong> MGR IEI Students Chapter &lt;iei@drmgrdu.ac.in&gt;</p>
            <p><strong>Subject:</strong> Your Test Your Engineering Brain E-Certificate</p>
            <p><strong>Attachment:</strong> 📎 Your_Engineering_Brain_Certificate_${cert.certificateId}.pdf</p>
            <hr style="border:none; border-top:1px solid var(--border-subtle); margin:12px 0;">
            <pre style="white-space:pre-wrap; font-family:var(--font-main); color:#e2e8f0; line-height:1.6;">Dear ${p.fullName},

Congratulations on completing the Test Your Engineering Brain quiz!

Thank you for participating in this initiative organized by the MGR IEI Students Chapter, Dr. M.G.R. Educational and Research Institute.

Your engineering quiz results are:

* Name: ${p.fullName}
* Branch: ${p.branch}
* Score: ${evalData.score}/10
* Percentage: ${evalData.percentage}%
* Completion Date: ${new Date().toLocaleDateString()}

Your personalized E-certificate is attached to this email.

Keep learning, keep innovating, and continue challenging your engineering knowledge!

Regards,
MGR IEI Students Chapter
Dr. M.G.R. Educational and Research Institute</pre>
          </div>
        `;
      }

      document.getElementById('simulatedEmailModal')?.classList.add('active');
    });
  }

  const closeSimBtn = document.getElementById('closeSimulatedEmailBtn');
  if (closeSimBtn) {
    closeSimBtn.addEventListener('click', () => {
      document.getElementById('simulatedEmailModal')?.classList.remove('active');
    });
  }

  // Retake Quiz
  const retakeBtn = document.getElementById('retakeQuizBtn');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      switchView('landing');
    });
  }
}

function loadCompletedResults(participant, attempt, cert) {
  const isArena = Boolean(attempt.arenaLevels || attempt.completedGamesCount || attempt.score > 10);
  const scoreMax = isArena ? 400 : 10;

  // Synthesize evaluation result
  const evalData = {
    score: attempt.score,
    scoreMax: scoreMax,
    totalQuestions: isArena ? 4 : 10,
    percentage: attempt.percentage,
    correctAnswers: attempt.correctAnswers || attempt.completedGamesCount || 0,
    incorrectAnswers: attempt.incorrectAnswers || (scoreMax - attempt.score),
    completedGamesCount: attempt.completedGamesCount || 4,
    isChampion: Boolean(attempt.isChampion || attempt.completedGamesCount === 4),
    arenaLevels: attempt.arenaLevels || null,
    performanceMessage: attempt.score >= (isArena ? 360 : 9) ? "Outstanding! You have an excellent engineering brain!" : (attempt.score >= (isArena ? 280 : 7) ? "Great Job! Your engineering knowledge is impressive!" : (attempt.score >= (isArena ? 200 : 5) ? "Good Effort! Keep learning and improving!" : "Keep Practising! Every engineer starts with curiosity!")),
    performanceBadge: attempt.isChampion ? "Arena Champion 🏆" : (attempt.score >= (isArena ? 360 : 9) ? "Master Engineer 🏆" : (attempt.score >= (isArena ? 280 : 7) ? "Senior Innovator ⭐" : "Junior Engineer 💡")),
    breakdown: []
  };

  const certificateData = {
    certificateId: cert ? cert.certificateId : 'TYEB-2026-COMPL',
    downloadUrl: `/api/certificate/${cert ? cert.certificateId : ''}`,
    generatedAt: cert ? cert.generatedAt : new Date().toISOString()
  };

  displayResults({
    participant,
    evaluation: evalData,
    certificate: certificateData,
    emailStatus: { status: cert ? cert.emailStatus : 'Pending Config' }
  });
}

// ==========================================
// ADMINISTRATOR DASHBOARD (VIEW 4)
// ==========================================
function setupAdminPortal() {
  const adminBtn = document.getElementById('adminPortalBtn');
  const loginModal = document.getElementById('adminLoginModal');
  const closeLoginBtn = document.getElementById('closeAdminLoginBtn');
  const loginForm = document.getElementById('adminLoginForm');
  const passwordInput = document.getElementById('adminPasswordInput');
  const loginError = document.getElementById('adminLoginError');

  function openAdminModal() {
    if (loginModal) {
      loginModal.classList.add('active');
      if (passwordInput) {
        passwordInput.value = '';
        setTimeout(() => passwordInput.focus(), 60);
      }
      if (loginError) loginError.textContent = '';
    }
  }

  if (adminBtn) {
    adminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        AudioFX.playClick();
      } catch (err) {}

      if (state.adminToken) {
        loadAdminDashboard();
      } else {
        openAdminModal();
      }
    });
  }

  if (closeLoginBtn && loginModal) {
    closeLoginBtn.addEventListener('click', () => {
      loginModal.classList.remove('active');
    });
  }

  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.classList.remove('active');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.textContent = '';

      const password = passwordInput ? passwordInput.value : '';
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed.');

        state.adminToken = data.token;
        sessionStorage.setItem('tyeb_admin_token', data.token);
        if (loginModal) loginModal.classList.remove('active');
        showToast('Admin authentication successful.', 'success');
        loadAdminDashboard();
      } catch (err) {
        if (loginError) loginError.textContent = err.message;
      }
    });
  }

  // Admin Controls
  const refreshBtn = document.getElementById('adminRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAdminDashboard();
      showToast('Dashboard data refreshed.', 'info');
    });
  }

  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.adminToken = null;
      sessionStorage.removeItem('tyeb_admin_token');
      showToast('Logged out of Admin Portal.', 'info');
      switchView('landing');
    });
  }

  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!state.adminToken) return;
      window.location.href = `/api/admin/export-csv?token=${encodeURIComponent(state.adminToken)}`;
    });
  }

  // Filters
  const searchInput = document.getElementById('adminSearchInput');
  const branchFilter = document.getElementById('adminBranchFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const scoreFilter = document.getElementById('adminScoreFilter');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadAdminParticipants, 300);
    });
  }

  [branchFilter, statusFilter, scoreFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', loadAdminParticipants);
  });

  // Participant Detail Modal Close
  const closeDetailBtn = document.getElementById('closeDetailModalBtn');
  const detailModal = document.getElementById('participantDetailModal');
  if (closeDetailBtn && detailModal) {
    closeDetailBtn.addEventListener('click', () => {
      detailModal.classList.remove('active');
    });
  }
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        detailModal.classList.remove('active');
      }
    });
  }
}

async function loadAdminDashboard() {
  if (!state.adminToken) {
    document.getElementById('adminLoginModal')?.classList.add('active');
    return;
  }

  try {
    // 1. Fetch Stats
    const statsRes = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${state.adminToken}` }
    });
    const statsData = await statsRes.json();

    if (statsRes.status === 401) {
      state.adminToken = null;
      sessionStorage.removeItem('tyeb_admin_token');
      showToast('Session expired. Please log in again.', 'warning');
      document.getElementById('adminLoginModal')?.classList.add('active');
      return;
    }

    switchView('admin');

    if (statsData.success) {
      renderAdminStats(statsData.analytics);
    }

    // 2. Fetch System Status
    const sysRes = await fetch('/api/system/status');
    const sysData = await sysRes.json();
    if (sysData.emailConfig) {
      const badge = document.getElementById('configStatusBadge');
      badge.textContent = `Provider: ${sysData.emailConfig.provider.toUpperCase()} (${sysData.emailConfig.isConfigured ? 'Active' : 'Simulation Mode'})`;
    }

    // 3. Fetch Participants
    await loadAdminParticipants();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAdminStats(a) {
  document.getElementById('statRegistered').textContent = a.totalRegistered;
  document.getElementById('statCompleted').textContent = a.totalCompleted;
  document.getElementById('statCertificates').textContent = a.totalCertificates;
  document.getElementById('statEmailsSent').textContent = a.emailsSent;
  document.getElementById('statEmailsPending').textContent = a.emailsPending;
  document.getElementById('statAverageScore').textContent = a.averageScore.toFixed(1);
  document.getElementById('statHighestScore').textContent = a.highestScore;

  // Branch Bars
  const branchContainer = document.getElementById('branchDistributionBars');
  branchContainer.innerHTML = '';
  const maxBranchCount = Math.max(1, ...Object.values(a.branchCounts || {}));

  for (const [branch, count] of Object.entries(a.branchCounts || {})) {
    const pct = Math.round((count / maxBranchCount) * 100);
    const row = document.createElement('div');
    row.className = 'chart-bar-row';
    row.innerHTML = `
      <div class="bar-label" title="${branch}">${branch}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${pct}%"></div>
      </div>
      <div class="bar-count">${count}</div>
    `;
    branchContainer.appendChild(row);
  }

  // Score Bars
  const scoreContainer = document.getElementById('scoreDistributionBars');
  scoreContainer.innerHTML = '';
  const scoreDist = a.scoreDistribution || { "9-10": 0, "7-8": 0, "5-6": 0, "0-4": 0 };
  const maxScoreCount = Math.max(1, ...Object.values(scoreDist));

  for (const [bracket, count] of Object.entries(scoreDist)) {
    const pct = Math.round((count / maxScoreCount) * 100);
    const row = document.createElement('div');
    row.className = 'chart-bar-row';
    row.innerHTML = `
      <div class="bar-label">Score ${bracket} marks</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${pct}%"></div>
      </div>
      <div class="bar-count">${count}</div>
    `;
    scoreContainer.appendChild(row);
  }
}

async function loadAdminParticipants() {
  if (!state.adminToken) return;

  const search = document.getElementById('adminSearchInput').value.trim();
  const branch = document.getElementById('adminBranchFilter').value;
  const status = document.getElementById('adminStatusFilter').value;
  const scoreFilter = document.getElementById('adminScoreFilter').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (branch) params.append('branch', branch);
  if (status) params.append('status', status);
  if (scoreFilter) params.append('scoreFilter', scoreFilter);

  try {
    const res = await fetch(`/api/admin/participants?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${state.adminToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    renderParticipantsTable(data.participants || []);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderParticipantsTable(participants = []) {
  const tbody = document.getElementById('participantsTableBody');
  tbody.innerHTML = '';

  if (participants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:32px; color:var(--text-muted);">No participants found matching criteria.</td></tr>`;
    return;
  }

  participants.forEach(p => {
    const tr = document.createElement('tr');

    const statusClass = p.quizStatus.toLowerCase().replace(' ', '-');
    const emailClass = p.emailStatus.toLowerCase().replace(' ', '-');
    const scoreMax = p.scoreMax || (p.circuitScore !== undefined || p.arenaLevels ? 400 : (p.score > 10 ? 400 : 10));
    const isChamp = Boolean(p.isChampion || (p.completedGamesCount === 4 && p.score >= 400));

    // Arena Level Badges
    const cScore = p.circuitScore !== undefined ? p.circuitScore : (p.arenaLevels?.circuitMaster?.score || 0);
    const sScore = p.spinScore !== undefined ? p.spinScore : (p.arenaLevels?.spinArena?.score || 0);
    const bScore = p.buildScore !== undefined ? p.buildScore : (p.arenaLevels?.buildZone?.score || 0);
    const eScore = p.escapeScore !== undefined ? p.escapeScore : (p.arenaLevels?.escapeRoom?.score || 0);

    const levelBadgesHtml = `
      <div class="admin-level-badges">
        <span class="level-tag tag-c" title="Circuit Master: ${cScore}/100">C:${cScore}</span>
        <span class="level-tag tag-s" title="Spin Arena: ${sScore}/100">S:${sScore}</span>
        <span class="level-tag tag-b" title="Build Zone: ${bScore}/100">B:${bScore}</span>
        <span class="level-tag tag-e" title="Escape Room: ${eScore}/100">E:${eScore}</span>
      </div>
    `;

    tr.innerHTML = `
      <td>
        <div class="p-name">
          ${p.fullName}
          ${p.isIeiMember ? `<span class="badge-pill" style="font-size:10px; padding:1px 6px; margin-left:6px; color:var(--accent-gold); border-color:rgba(255,209,102,0.4);" title="IEI Membership: ${p.ieiMembershipId || 'Verified Member'}">🎖️ IEI Member</span>` : ''}
        </div>
        <div class="p-email">${p.email}</div>
      </td>
      <td><span style="font-size:12px;">${p.branch}</span></td>
      <td><strong>${p.score} / ${scoreMax}</strong> <span style="font-size:11px; color:var(--text-muted);">(${p.percentage}%)</span></td>
      <td>${levelBadgesHtml}</td>
      <td>
        ${isChamp ? `<span class="badge-pill" style="color:var(--accent-gold); border-color:rgba(255,209,102,0.4); font-size:10.5px;">🏆 Champion</span>` : `<span style="color:var(--text-muted); font-size:11px;">-</span>`}
      </td>
      <td><span class="badge-status ${statusClass}">${p.quizStatus}</span></td>
      <td>
        ${p.certificateId ? `<a href="/api/certificate/${p.certificateId}" class="badge-pill" target="_blank" download style="text-decoration:none;">📥 ${p.certificateId}</a>` : '<span style="color:var(--text-muted);">Not Issued</span>'}
      </td>
      <td><span class="badge-status ${emailClass}">${p.emailStatus}</span></td>
      <td><span style="font-size:11.5px; color:var(--text-muted);">${p.completionDate !== 'N/A' ? new Date(p.completionDate).toLocaleDateString() : 'N/A'}</span></td>
      <td>
        <div class="action-btns-group">
          <button class="btn btn-secondary btn-sm btn-view-p" title="View Response Sheet">👁️</button>
          ${p.certificateId ? `<button class="btn btn-primary btn-sm btn-resend-p" title="Resend Email">✉️</button>` : ''}
        </div>
      </td>
    `;

    // View Details click
    tr.querySelector('.btn-view-p').addEventListener('click', () => {
      openParticipantDetailModal(p.participantId);
    });

    // Resend Email click
    const resendBtn = tr.querySelector('.btn-resend-p');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        try {
          const res = await fetch(`/api/admin/resend-email/${p.participantId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.adminToken}` }
          });
          const d = await res.json();
          showToast(d.message || 'Email action triggered.', 'success');
          loadAdminParticipants();
        } catch (err) {
          showToast('Failed to trigger email resend.', 'error');
        } finally {
          resendBtn.disabled = false;
        }
      });
    }

    tbody.appendChild(tr);
  });
}

async function openParticipantDetailModal(participantId) {
  try {
    const res = await fetch(`/api/admin/participant/${participantId}`, {
      headers: { 'Authorization': `Bearer ${state.adminToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { participant, attempt, certificate, emailLogs, breakdown } = data;

    const modalBody = document.getElementById('detailModalBody');
    document.getElementById('detailModalTitle').textContent = `Participant Record: ${participant.fullName}`;

    let breakdownHtml = '';
    if (breakdown && breakdown.length > 0) {
      breakdownHtml = `
        <h4 style="margin:20px 0 10px 0; color:var(--accent-teal);">Exam Responses Breakdown (10 Questions):</h4>
        <div style="max-height:280px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:8px; padding:12px; background:rgba(0,0,0,0.2);">
          ${breakdown.map((b, i) => `
            <div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:12.5px;">
              <div><strong>Q${i+1}:</strong> ${b.question}</div>
              <div style="display:flex; justify-content:space-between; margin-top:4px;">
                <span>Selected: <strong style="color:${b.isCorrect ? 'var(--success)' : '#ff6b6b'};">${b.selectedOption || 'None'}</strong></span>
                <span>Correct: <strong style="color:var(--accent-teal);">${b.correctOption}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px; margin-bottom:16px;">
        <div><strong>Participant ID:</strong> <code>${participant.participantId}</code></div>
        <div><strong>Email:</strong> ${participant.email}</div>
        <div><strong>Branch:</strong> ${participant.branch}</div>
        <div><strong>College:</strong> ${participant.collegeName || 'Dr. M.G.R. Educational and Research Institute'}</div>
        <div><strong>IEI Member:</strong> ${participant.isIeiMember ? `<span style="color:var(--accent-gold); font-weight:700;">Yes (${participant.ieiMembershipId || 'Verified'})</span>` : '<span style="color:var(--text-muted);">No</span>'}</div>
        <div><strong>Score:</strong> ${attempt ? attempt.score : 0} / 10 (${attempt ? attempt.percentage : 0}%)</div>
        <div><strong>Status:</strong> ${attempt ? attempt.status : 'Not Started'}</div>
        <div><strong>Certificate ID:</strong> ${certificate ? certificate.certificateId : 'None'}</div>
        <div><strong>Email Status:</strong> ${certificate ? certificate.emailStatus : 'None'}</div>
      </div>
      ${breakdownHtml}
      <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">
        ${certificate ? `<a href="/api/certificate/${certificate.certificateId}" class="btn btn-primary btn-sm" download>📥 Download Certificate PDF</a>` : ''}
      </div>
    `;

    document.getElementById('participantDetailModal').classList.add('active');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// SOUND TOGGLE & INITIALIZATION
// ==========================================
function setupSoundToggle() {
  const btn = document.getElementById('soundToggleBtn');
  btn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    btn.textContent = state.soundEnabled ? '🔊' : '🔇';
    showToast(state.soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted', 'info');
  });
}

// Main Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  try { initCircuitBackground(); } catch (e) { console.warn('Circuit canvas error:', e); }
  try { setupRegistration(); } catch (e) { console.error('Registration error:', e); }
  try { setupArenaNavigation(); } catch (e) { console.error('Arena navigation error:', e); }
  try { setupLevel1CircuitMaster(); } catch (e) { console.error('Circuit Master error:', e); }
  try { setupLevel2SpinArena(); } catch (e) { console.error('Spin Arena error:', e); }
  try { setupLevel3BuildZone(); } catch (e) { console.error('Build Zone error:', e); }
  try { setupLevel4EscapeRoom(); } catch (e) { console.error('Escape Room error:', e); }
  try { setupQuizControls(); } catch (e) { console.error('Quiz controls error:', e); }
  try { setupResultsActions(); } catch (e) { console.error('Results actions error:', e); }
  try { setupAdminPortal(); } catch (e) { console.error('Admin portal error:', e); }
  try { setupSoundToggle(); } catch (e) { console.error('Sound toggle error:', e); }

  // Admin Hotkey support (Alt+A or Ctrl+Shift+A)
  window.addEventListener('keydown', (e) => {
    if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
      e.preventDefault();
      if (state.adminToken) {
        loadAdminDashboard();
      } else {
        const modal = document.getElementById('adminLoginModal');
        modal?.classList.add('active');
        const pw = document.getElementById('adminPasswordInput');
        if (pw) { pw.value = ''; setTimeout(() => pw.focus(), 60); }
      }
    }
  });

  // Direct URL Hash Routing (#admin)
  const handleAdminHash = () => {
    if (window.location.hash === '#admin') {
      if (state.adminToken) {
        loadAdminDashboard();
      } else {
        const modal = document.getElementById('adminLoginModal');
        modal?.classList.add('active');
        const pw = document.getElementById('adminPasswordInput');
        if (pw) { pw.value = ''; setTimeout(() => pw.focus(), 60); }
      }
    }
  };

  handleAdminHash();
  window.addEventListener('hashchange', handleAdminHash);
});
