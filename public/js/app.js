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
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        body: JSON.stringify({ fullName, email, branch, collegeName })
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
        showToast('Registration successful! Starting quiz...', 'success');
        startQuizSession();
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
// QUIZ FLOW (VIEW 2)
// ==========================================
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

  // Store in state
  state.lastEvaluation = evalData;
  state.lastCertificate = cert;

  // Header Details
  document.getElementById('resultsGreeting').textContent = `Congratulations, ${participant.fullName}!`;
  document.getElementById('resultsPerformanceBadge').textContent = evalData.performanceBadge;
  document.getElementById('resultsPerformanceMessage').textContent = evalData.performanceMessage;

  // Radial Progress Ring Animation
  const circumference = 2 * Math.PI * 70; // ~439.8
  const offset = circumference - (evalData.score / evalData.totalQuestions) * circumference;
  const circleProgress = document.getElementById('scoreCircleProgress');
  circleProgress.style.strokeDashoffset = offset;

  // Number Counter Animation
  animateScoreNumber(evalData.score);
  document.getElementById('resultsScorePct').textContent = `${evalData.percentage}%`;

  // Metric Boxes
  document.getElementById('metricName').textContent = participant.fullName;
  document.getElementById('metricBranch').textContent = participant.branch;
  document.getElementById('metricCorrect').textContent = evalData.correctAnswers;
  document.getElementById('metricIncorrect').textContent = evalData.incorrectAnswers;

  // Certificate Details & Preview Overlay
  document.getElementById('certIdTag').textContent = `ID: ${cert.certificateId}`;
  document.getElementById('certPreviewName').textContent = participant.fullName.toUpperCase();
  document.getElementById('certPreviewBranch').textContent = `Branch: ${participant.branch}`;
  document.getElementById('certPreviewScore').textContent = `Score: ${evalData.score} / 10 (${evalData.percentage}%)`;
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

  // Question Review Accordion
  renderReviewAccordion(evalData.breakdown);

  // Switch to Results
  switchView('results');
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
  // Resend Email
  document.getElementById('resendEmailBtn').addEventListener('click', async () => {
    if (!state.participant) return;
    const btn = document.getElementById('resendEmailBtn');
    btn.disabled = true;
    btn.textContent = 'Resending...';

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
      btn.disabled = false;
      btn.textContent = '🔄 Resend Email';
    }
  });

  // Simulated Email Modal
  document.getElementById('viewSimulatedEmailBtn').addEventListener('click', () => {
    const p = state.participant;
    const cert = state.lastCertificate;
    const evalData = state.lastEvaluation;

    const modalContent = document.getElementById('simulatedEmailContent');
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

    document.getElementById('simulatedEmailModal').classList.add('active');
  });

  document.getElementById('closeSimulatedEmailBtn').addEventListener('click', () => {
    document.getElementById('simulatedEmailModal').classList.remove('active');
  });

  // Retake Quiz
  document.getElementById('retakeQuizBtn').addEventListener('click', () => {
    switchView('landing');
  });
}

function loadCompletedResults(participant, attempt, cert) {
  // Synthesize evaluation result
  const evalData = {
    score: attempt.score,
    totalQuestions: 10,
    percentage: attempt.percentage,
    correctAnswers: attempt.correctAnswers,
    incorrectAnswers: attempt.incorrectAnswers,
    performanceMessage: attempt.score >= 9 ? "Outstanding! You have an excellent engineering brain!" : (attempt.score >= 7 ? "Great Job! Your engineering knowledge is impressive!" : (attempt.score >= 5 ? "Good Effort! Keep learning and improving!" : "Keep Practising! Every engineer starts with curiosity!")),
    performanceBadge: attempt.score >= 9 ? "Master Engineer 🏆" : (attempt.score >= 7 ? "Senior Innovator ⭐" : (attempt.score >= 5 ? "Aspiring Engineer 💡" : "Engineering Explorer 🚀")),
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

  adminBtn.addEventListener('click', () => {
    AudioFX.playClick();
    if (state.adminToken) {
      loadAdminDashboard();
    } else {
      loginModal.classList.add('active');
      passwordInput.value = '';
      loginError.textContent = '';
      passwordInput.focus();
    }
  });

  closeLoginBtn.addEventListener('click', () => {
    loginModal.classList.remove('active');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const password = passwordInput.value;
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
      loginModal.classList.remove('active');
      showToast('Admin authentication successful.', 'success');
      loadAdminDashboard();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  // Admin Controls
  document.getElementById('adminRefreshBtn').addEventListener('click', () => {
    loadAdminDashboard();
    showToast('Dashboard data refreshed.', 'info');
  });

  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    state.adminToken = null;
    sessionStorage.removeItem('tyeb_admin_token');
    showToast('Logged out of Admin Portal.', 'info');
    switchView('landing');
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (!state.adminToken) return;
    window.location.href = `/api/admin/export-csv?token=${encodeURIComponent(state.adminToken)}`;
  });

  // Filters
  const searchInput = document.getElementById('adminSearchInput');
  const branchFilter = document.getElementById('adminBranchFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const scoreFilter = document.getElementById('adminScoreFilter');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadAdminParticipants, 300);
  });

  branchFilter.addEventListener('change', loadAdminParticipants);
  statusFilter.addEventListener('change', loadAdminParticipants);
  scoreFilter.addEventListener('change', loadAdminParticipants);

  // Participant Detail Modal Close
  document.getElementById('closeDetailModalBtn').addEventListener('click', () => {
    document.getElementById('participantDetailModal').classList.remove('active');
  });
}

async function loadAdminDashboard() {
  if (!state.adminToken) return;
  switchView('admin');

  try {
    // 1. Fetch Stats
    const statsRes = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${state.adminToken}` }
    });
    const statsData = await statsRes.json();

    if (statsRes.status === 401) {
      state.adminToken = null;
      sessionStorage.removeItem('tyeb_admin_token');
      document.getElementById('adminLoginModal').classList.add('active');
      return;
    }

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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">No participants found matching criteria.</td></tr>`;
    return;
  }

  participants.forEach(p => {
    const tr = document.createElement('tr');

    const statusClass = p.quizStatus.toLowerCase().replace(' ', '-');
    const emailClass = p.emailStatus.toLowerCase().replace(' ', '-');

    tr.innerHTML = `
      <td>
        <div class="p-name">${p.fullName}</div>
        <div class="p-email">${p.email}</div>
      </td>
      <td><span style="font-size:12px;">${p.branch}</span></td>
      <td><strong>${p.score} / 10</strong> <span style="font-size:11px; color:var(--text-muted);">(${p.percentage}%)</span></td>
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
  initCircuitBackground();
  setupRegistration();
  setupQuizControls();
  setupResultsActions();
  setupAdminPortal();
  setupSoundToggle();

  // If URL has #admin, navigate to admin
  if (window.location.hash === '#admin') {
    if (state.adminToken) {
      loadAdminDashboard();
    } else {
      document.getElementById('adminLoginModal').classList.add('active');
    }
  }
});
