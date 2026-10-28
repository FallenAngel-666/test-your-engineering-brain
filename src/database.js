/**
 * Data Access Layer for TEST YOUR ENGINEERING BRAIN
 * Provides thread-safe, persistent JSON storage with atomic writes.
 * Supports participants, quiz attempts, sequential 4-level progress, certificates, and email audit logs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  QUESTIONS_PER_LEVEL,
  LEVEL_ORDER,
  LEVEL_METADATA,
  generateAssignedQuestions,
  sanitizeAssignedQuestions,
  isLevelUnlocked,
  evaluateQuestionAnswer,
  calculateLevelScore
} = require('./arenaGames');

// Determine storage file path (Vercel serverless /tmp or local data directory)
const IS_VERCEL = Boolean(process.env.VERCEL);
const BUNDLED_DB = path.join(__dirname, '..', 'data', 'database.json');
const DB_FILE = IS_VERCEL
  ? path.join('/tmp', 'database.json')
  : BUNDLED_DB;

// Initial in-memory schema
const defaultState = {
  participants: [],
  quizAttempts: [],
  certificates: [],
  emailLogs: [],
  systemMeta: {
    initializedAt: new Date().toISOString(),
    version: "2.0.0"
  }
};

let db = { ...defaultState };

function initDatabase() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }

  let sourceFile = DB_FILE;
  if (!fs.existsSync(sourceFile) && fs.existsSync(BUNDLED_DB)) {
    sourceFile = BUNDLED_DB;
  }

  if (fs.existsSync(sourceFile)) {
    try {
      const content = fs.readFileSync(sourceFile, 'utf-8');
      const parsed = JSON.parse(content);
      db = {
        participants: parsed.participants || [],
        quizAttempts: parsed.quizAttempts || [],
        certificates: parsed.certificates || [],
        emailLogs: parsed.emailLogs || [],
        systemMeta: parsed.systemMeta || defaultState.systemMeta
      };
      console.log(`[Database] Loaded ${db.participants.length} participants from disk.`);
    } catch (err) {
      console.error('[Database] Error reading database.json, initializing default state:', err);
      db = { ...defaultState };
      saveDatabase();
    }
  } else {
    db = { ...defaultState };
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Database] Failed atomic write:', err);
  }
}

// Helper ID generators
function generateId(prefix = 'TYEB') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
}

// ----------------- PARTICIPANTS -----------------
function createParticipant({
  participantId: existingId,
  fullName,
  email,
  branch,
  collegeName = "",
  isIeiMember = false,
  ieiMembershipId = null
}) {
  const participantId = existingId || generateId('PART');
  const now = new Date().toISOString();

  const isMemberBool = Boolean(isIeiMember);
  const cleanMemberId = isMemberBool && ieiMembershipId ? String(ieiMembershipId).trim() : null;

  const participant = {
    participantId,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    branch: branch.trim(),
    collegeName: collegeName ? collegeName.trim() : "Dr. M.G.R. Educational and Research Institute",
    isIeiMember: isMemberBool,
    ieiMembershipId: cleanMemberId,
    registrationTimestamp: now
  };

  db.participants.push(participant);
  saveDatabase();
  return participant;
}

function findParticipantById(participantId) {
  return db.participants.find(p => p.participantId === participantId) || null;
}

function findParticipantByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return db.participants.find(p => p.email === normalized) || null;
}

function getAllParticipants() {
  return [...db.participants];
}

// ----------------- QUIZ & ARENA ATTEMPTS -----------------
function createQuizAttempt(participantId, existingAttemptId) {
  const attemptId = existingAttemptId || generateId('ATT');
  const now = new Date().toISOString();

  const attempt = {
    attemptId,
    participantId,
    answers: {},
    score: 0,
    percentage: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    status: 'In Progress', // 'Not Started', 'In Progress', 'Completed'
    startedAt: now,
    completedAt: null,
    // Engineering Arena Sequential 4-Level Progress
    currentUnlockedLevel: 'circuitMaster',
    levels: {
      circuitMaster: {
        status: 'In Progress',
        unlocked: true,
        interactiveCompleted: false,
        assignedQuestions: [], // populated on demand & permanently saved!
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      spinArena: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      buildZone: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      escapeRoom: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      }
    },
    // Backward compatibility aliases
    arenaLevels: {
      circuitMaster: { score: 0, maxScore: 100, completed: false, completedAt: null },
      spinArena: { score: 0, maxScore: 100, completed: false, completedAt: null },
      buildZone: { score: 0, maxScore: 100, completed: false, completedAt: null },
      escapeRoom: { score: 0, maxScore: 100, completed: false, completedAt: null }
    },
    arenaScore: 0,
    arenaMaxScore: 400,
    completedGamesCount: 0,
    completedLevelsCount: 0,
    isChampion: false
  };

  db.quizAttempts.push(attempt);
  saveDatabase();
  return attempt;
}

function findAttemptById(attemptId) {
  return db.quizAttempts.find(a => a.attemptId === attemptId) || null;
}

function findLatestAttemptByParticipant(participantId) {
  const attempts = db.quizAttempts.filter(a => a.participantId === participantId);
  if (attempts.length === 0) return null;
  return attempts[attempts.length - 1];
}

/**
 * Ensures attempt has the proper level structure (for backwards compatibility)
 */
function ensureAttemptLevels(attempt) {
  if (!attempt.levels) {
    attempt.levels = {
      circuitMaster: {
        status: 'In Progress',
        unlocked: true,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      spinArena: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      buildZone: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      escapeRoom: {
        status: 'Not Started',
        unlocked: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      }
    };
  }

  // Sync unlocked states according to sequential rules
  attempt.levels.circuitMaster.unlocked = true;
  attempt.levels.spinArena.unlocked = Boolean(attempt.levels.circuitMaster?.status === 'Completed');
  attempt.levels.buildZone.unlocked = Boolean(attempt.levels.spinArena?.status === 'Completed');
  attempt.levels.escapeRoom.unlocked = Boolean(attempt.levels.buildZone?.status === 'Completed');
}

/**
 * Retrieves the student's assigned questions for a level.
 * If questions haven't been assigned yet, generates them randomly and persists them.
 * Enforces sequential unlocking: returns error if level is locked!
 */
function getOrAssignLevelQuestions(attemptId, levelKey) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  // Check sequential unlocking
  if (!isLevelUnlocked(attempt, levelKey)) {
    return {
      error: `Level is locked. You must complete the previous level in sequence first.`,
      locked: true,
      levelKey
    };
  }

  const lvl = attempt.levels[levelKey];
  if (!lvl) {
    return { error: `Invalid level: ${levelKey}` };
  }

  // If questions not assigned yet, assign them and save permanently
  if (!lvl.assignedQuestions || lvl.assignedQuestions.length === 0) {
    lvl.assignedQuestions = generateAssignedQuestions(levelKey, QUESTIONS_PER_LEVEL);
    if (lvl.status === 'Not Started') {
      lvl.status = 'In Progress';
    }
    saveDatabase();
  }

  return {
    success: true,
    levelKey,
    metadata: LEVEL_METADATA[levelKey],
    status: lvl.status,
    unlocked: true,
    interactiveCompleted: Boolean(lvl.interactiveCompleted),
    questions: sanitizeAssignedQuestions(lvl.assignedQuestions),
    answers: lvl.answers || {},
    score: lvl.score || 0,
    maxScore: lvl.maxScore || 100,
    completed: lvl.status === 'Completed'
  };
}

/**
 * Records completion of the interactive game portion (circuit / wheel / bridge / escape)
 */
function recordInteractiveAction(attemptId, levelKey, payload = {}) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  if (!isLevelUnlocked(attempt, levelKey)) {
    return { error: `Level is locked. Complete the previous level first.`, locked: true };
  }

  const lvl = attempt.levels[levelKey];
  lvl.interactiveCompleted = true;
  lvl.interactivePayload = payload;

  if (attempt.arenaLevels && attempt.arenaLevels[levelKey]) {
    attempt.arenaLevels[levelKey].interactiveCompleted = true;
  }

  saveDatabase();
  return { success: true, interactiveCompleted: true };
}

/**
 * Submits an answer to a specific question on a level.
 * Validates against the stored assigned question with server-side scoring.
 */
function saveLevelAnswer(attemptId, levelKey, questionId, selectedOption) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  if (!isLevelUnlocked(attempt, levelKey)) {
    return { error: `Level is locked. Complete previous level first.`, locked: true };
  }

  const lvl = attempt.levels[levelKey];
  if (lvl.status === 'Completed') {
    return { error: 'Level is already completed. Answers cannot be changed.', alreadyCompleted: true };
  }

  // Find question in assigned list
  const q = (lvl.assignedQuestions || []).find(item => item.id === questionId);
  if (!q) {
    return { error: 'Question not found in assigned question set.' };
  }

  if (!lvl.answers) lvl.answers = {};
  lvl.answers[questionId] = selectedOption;

  const evalResult = evaluateQuestionAnswer(q, selectedOption);

  saveDatabase();

  return {
    success: true,
    questionId,
    selectedOption,
    isCorrect: evalResult.isCorrect,
    correctOption: evalResult.correctOption,
    explanation: evalResult.explanation,
    answeredCount: Object.keys(lvl.answers).length,
    totalQuestions: lvl.assignedQuestions.length
  };
}

/**
 * Completes a level when interactive action is done and all assigned questions are answered.
 * Calculates score, records completion, and unlocks the next level.
 */
function completeLevel(attemptId, levelKey) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  if (!isLevelUnlocked(attempt, levelKey)) {
    return { error: `Level is locked. Complete previous level first.`, locked: true };
  }

  const lvl = attempt.levels[levelKey];
  const assigned = lvl.assignedQuestions || [];
  const answers = lvl.answers || {};

  if (!lvl.interactiveCompleted) {
    return { error: 'Interactive challenge must be completed before finishing the level.' };
  }

  const answeredCount = Object.keys(answers).length;
  if (answeredCount < assigned.length) {
    return {
      error: `Please answer all ${assigned.length} questions before finishing this level (${answeredCount}/${assigned.length} answered).`,
      unanswered: assigned.length - answeredCount
    };
  }

  // Calculate score for this level
  const scoreResult = calculateLevelScore(assigned, answers);
  lvl.score = scoreResult.score;
  lvl.completed = true;
  lvl.status = 'Completed';
  lvl.completedAt = new Date().toISOString();

  // Update backward compatibility arenaLevels
  if (!attempt.arenaLevels) attempt.arenaLevels = {};
  attempt.arenaLevels[levelKey] = {
    score: scoreResult.score,
    maxScore: 100,
    completed: true,
    completedAt: lvl.completedAt
  };

  // Unlock next level in sequence
  const nextKey = LEVEL_METADATA[levelKey]?.nextLevel;
  if (nextKey && attempt.levels[nextKey]) {
    attempt.levels[nextKey].unlocked = true;
    if (attempt.levels[nextKey].status === 'Not Started') {
      attempt.levels[nextKey].status = 'In Progress';
    }
    attempt.currentUnlockedLevel = nextKey;
  }

  // Recalculate totals
  attempt.completedLevelsCount = Object.values(attempt.levels).filter(l => l.status === 'Completed').length;
  attempt.completedGamesCount = attempt.completedLevelsCount;
  attempt.totalScore = Object.values(attempt.levels).reduce((sum, l) => sum + (l.score || 0), 0);
  attempt.arenaScore = attempt.totalScore;
  attempt.score = attempt.totalScore;
  attempt.percentage = Math.round((attempt.score / 400) * 100);
  attempt.isChampion = attempt.completedLevelsCount === 4;

  saveDatabase();

  return {
    success: true,
    levelKey,
    levelScore: scoreResult.score,
    maxScore: 100,
    correctCount: scoreResult.correctCount,
    totalQuestions: assigned.length,
    percentage: scoreResult.percentage,
    totalScore: attempt.totalScore,
    totalArenaScore: attempt.totalScore,
    completedLevelsCount: attempt.completedLevelsCount,
    completedCount: attempt.completedLevelsCount,
    isChampion: attempt.isChampion,
    nextLevel: nextKey,
    nextLevelUnlocked: nextKey,
    breakdown: scoreResult.breakdown
  };
}

/**
 * Returns overall arena attempt status including unlocked levels, scores, and progress
 */
function getArenaAttemptStatus(attemptId) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  ensureAttemptLevels(attempt);

  const levelsStatus = {};
  LEVEL_ORDER.forEach((key, idx) => {
    const lvl = attempt.levels[key];
    const unlocked = isLevelUnlocked(attempt, key);
    const assigned = lvl?.assignedQuestions || [];
    const answers = lvl?.answers || {};

    levelsStatus[key] = {
      id: key,
      levelNumber: idx + 1,
      name: LEVEL_METADATA[key].name,
      theme: LEVEL_METADATA[key].theme,
      icon: LEVEL_METADATA[key].icon,
      unlocked,
      completed: lvl ? Boolean(lvl.completed || lvl.status === 'Completed') : false,
      status: lvl ? lvl.status : (unlocked ? 'In Progress' : 'Not Started'),
      interactiveCompleted: Boolean(lvl?.interactiveCompleted),
      score: lvl ? (lvl.score || 0) : 0,
      maxScore: 100,
      answeredCount: Object.keys(answers).length,
      totalQuestions: assigned.length || QUESTIONS_PER_LEVEL,
      // Only include questions if unlocked
      questions: unlocked && assigned.length > 0 ? sanitizeAssignedQuestions(assigned) : [],
      answers: unlocked ? answers : {}
    };
  });

  const completedLevelsCount = Object.values(attempt.levels).filter(l => l.status === 'Completed').length;
  const totalScore = Object.values(attempt.levels).reduce((sum, l) => sum + (l.score || 0), 0);

  return {
    attemptId: attempt.attemptId,
    status: attempt.status,
    totalScore,
    maxScore: 400,
    completedLevelsCount,
    totalLevels: 4,
    isChampion: completedLevelsCount === 4,
    eligibleForCertificate: completedLevelsCount === 4,
    currentUnlockedLevel: attempt.currentUnlockedLevel || 'circuitMaster',
    levels: levelsStatus
  };
}

/**
 * Legacy updateAttemptLevel (kept for backward compatibility & test suites)
 */
function updateAttemptLevel(attemptId, levelKey, levelResult) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  ensureAttemptLevels(attempt);

  const now = new Date().toISOString();
  const lvl = attempt.levels[levelKey];
  if (lvl) {
    lvl.score = Math.min(100, Math.max(0, levelResult.score || 0));
    lvl.status = levelResult.completed ? 'Completed' : 'In Progress';
    lvl.interactiveCompleted = Boolean(levelResult.completed || levelResult.isCircuitOk || levelResult.isBridgeOk);
    lvl.completedAt = levelResult.completed ? now : null;
  }

  if (!attempt.arenaLevels) attempt.arenaLevels = {};
  attempt.arenaLevels[levelKey] = {
    score: Math.min(100, Math.max(0, levelResult.score || 0)),
    maxScore: levelResult.maxScore || 100,
    completed: Boolean(levelResult.completed),
    completedAt: now,
    details: levelResult
  };

  // Recalculate arena total score
  const l1 = attempt.arenaLevels.circuitMaster?.score || 0;
  const l2 = attempt.arenaLevels.spinArena?.score || 0;
  const l3 = attempt.arenaLevels.buildZone?.score || 0;
  const l4 = attempt.arenaLevels.escapeRoom?.score || 0;

  attempt.arenaScore = Math.min(400, l1 + l2 + l3 + l4);
  attempt.score = attempt.arenaScore;
  attempt.totalScore = attempt.arenaScore;
  attempt.percentage = Math.round((attempt.arenaScore / 400) * 100);

  attempt.completedGamesCount = [
    attempt.arenaLevels.circuitMaster?.completed,
    attempt.arenaLevels.spinArena?.completed,
    attempt.arenaLevels.buildZone?.completed,
    attempt.arenaLevels.escapeRoom?.completed
  ].filter(Boolean).length;
  attempt.completedLevelsCount = attempt.completedGamesCount;

  attempt.isChampion = attempt.completedGamesCount === 4;

  // Unlock next
  const nextKey = LEVEL_METADATA[levelKey]?.nextLevel;
  if (nextKey && levelResult.completed && attempt.levels[nextKey]) {
    attempt.levels[nextKey].unlocked = true;
    if (attempt.levels[nextKey].status === 'Not Started') {
      attempt.levels[nextKey].status = 'In Progress';
    }
  }

  saveDatabase();
  return attempt;
}

/**
 * Finalizes an Engineering Arena attempt.
 * Strictly verifies that all 4 levels are completed before finalizing!
 */
function finalizeArenaAttempt(attemptId, arenaSummary = {}) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  ensureAttemptLevels(attempt);

  if (attempt.status === 'Completed') {
    return attempt;
  }

  // Count completed levels
  const completedCount = Object.values(attempt.levels).filter(l => l.status === 'Completed').length;
  const legacyCompleted = attempt.completedGamesCount || 0;
  const effectiveCompleted = Math.max(completedCount, legacyCompleted);

  if (effectiveCompleted < 4 && !arenaSummary.force) {
    return {
      error: `All four levels must be completed sequentially before claiming the certificate (${effectiveCompleted}/4 completed).`,
      completedLevelsCount: effectiveCompleted
    };
  }

  const now = new Date().toISOString();
  if (arenaSummary.totalScore !== undefined || arenaSummary.score !== undefined) {
    attempt.arenaScore = arenaSummary.totalScore || arenaSummary.score;
    attempt.score = attempt.arenaScore;
    attempt.totalScore = attempt.arenaScore;
  } else {
    attempt.totalScore = Object.values(attempt.levels).reduce((sum, l) => sum + (l.score || 0), 0);
    attempt.score = attempt.totalScore;
    attempt.arenaScore = attempt.totalScore;
  }

  attempt.percentage = Math.round((attempt.score / 400) * 100);
  attempt.completedLevelsCount = 4;
  attempt.completedGamesCount = 4;
  attempt.isChampion = true;
  attempt.status = 'Completed';
  attempt.completedAt = now;

  saveDatabase();
  return attempt;
}

function completeQuizAttempt(attemptId, evaluationResult, answers) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  if (attempt.status === 'Completed') {
    return { error: 'Attempt already submitted and finalized.' };
  }

  const now = new Date().toISOString();
  attempt.status = 'Completed';
  attempt.completedAt = now;
  attempt.answers = answers || {};
  attempt.score = evaluationResult.score;
  attempt.percentage = evaluationResult.percentage;
  attempt.correctAnswers = evaluationResult.correctAnswers;
  attempt.incorrectAnswers = evaluationResult.incorrectAnswers;

  saveDatabase();
  return attempt;
}

// ----------------- CERTIFICATES -----------------
function createCertificate({
  certificateId: existingId,
  participantId,
  attemptId,
  certificateFileReference = '',
  emailStatus = 'Pending Config'
}) {
  const certificateId = existingId || generateId('TYEB-2026');
  const now = new Date().toISOString();

  const certificate = {
    certificateId,
    participantId,
    attemptId,
    certificateFileReference,
    emailStatus,
    generatedAt: now,
    lastEmailedAt: null
  };

  db.certificates.push(certificate);
  saveDatabase();
  return certificate;
}

function findCertificateByParticipant(participantId) {
  return db.certificates.find(c => c.participantId === participantId) || null;
}

function findCertificateById(certificateId) {
  return db.certificates.find(c => c.certificateId === certificateId) || null;
}

function updateCertificateEmailStatus(certificateId, status) {
  const cert = findCertificateById(certificateId);
  if (!cert) return null;

  cert.emailStatus = status;
  cert.lastEmailedAt = new Date().toISOString();
  saveDatabase();
  return cert;
}

// ----------------- EMAIL AUDIT LOGS -----------------
function logEmailDispatch({
  logId: existingId,
  participantId,
  certificateId,
  recipientEmail,
  provider,
  status,
  messageId = null,
  errorMessage = null
}) {
  const logId = existingId || generateId('LOG');
  const now = new Date().toISOString();

  const logEntry = {
    logId,
    participantId,
    certificateId,
    recipientEmail,
    provider,
    status,
    messageId,
    errorMessage,
    timestamp: now
  };

  db.emailLogs.push(logEntry);
  saveDatabase();
  return logEntry;
}

function getEmailLogsByParticipant(participantId) {
  return db.emailLogs.filter(l => l.participantId === participantId);
}

// ----------------- ADMIN ANALYTICS -----------------
function getAnalytics() {
  const totalRegistered = db.participants.length;
  const completedAttempts = db.quizAttempts.filter(a => a.status === 'Completed');
  const totalCompleted = completedAttempts.length;
  const totalCertificates = db.certificates.length;

  const emailsSent = db.emailLogs.filter(l => l.status === 'Sent' || l.status === 'Form Dispatched').length;
  const emailsFailed = db.emailLogs.filter(l => l.status === 'Failed').length;
  const emailsPending = db.certificates.filter(c => c.emailStatus === 'Pending Config').length;

  let totalScore = 0;
  let highestScore = 0;
  const scoreDistribution = {
    "360-400": 0,
    "280-359": 0,
    "200-279": 0,
    "0-199": 0
  };

  completedAttempts.forEach(a => {
    totalScore += a.score;
    if (a.score > highestScore) highestScore = a.score;

    if (a.score >= 360) scoreDistribution["360-400"]++;
    else if (a.score >= 280) scoreDistribution["280-359"]++;
    else if (a.score >= 200) scoreDistribution["200-279"]++;
    else scoreDistribution["0-199"]++;
  });

  const averageScore = totalCompleted > 0 ? (totalScore / totalCompleted).toFixed(1) : 0;

  // Branch breakdown
  const branchCounts = {};
  db.participants.forEach(p => {
    branchCounts[p.branch] = (branchCounts[p.branch] || 0) + 1;
  });

  return {
    totalRegistered,
    totalCompleted,
    totalCertificates,
    emailsSent,
    emailsFailed,
    emailsPending,
    averageScore: Number(averageScore),
    highestScore,
    scoreDistribution,
    branchCounts
  };
}

// ----------------- ADMIN PARTICIPANT VIEW -----------------
function getAdminParticipantsList({ search = '', branch = '', status = '', scoreFilter = '', completionFilter = '' } = {}) {
  const results = [];

  for (const p of db.participants) {
    const attempt = findLatestAttemptByParticipant(p.participantId);
    const cert = findCertificateByParticipant(p.participantId);

    // Apply search filter (Name or Email)
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchEmail = p.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) continue;
    }

    // Branch filter
    if (branch && p.branch !== branch) {
      continue;
    }

    // Status filter
    const quizStatus = attempt ? attempt.status : 'Not Started';
    if (status && quizStatus !== status) {
      continue;
    }

    // Level breakdown
    let circuitScore = 0;
    let spinScore = 0;
    let buildScore = 0;
    let escapeScore = 0;
    let circuitStatus = 'Not Started';
    let spinStatus = 'Not Started';
    let buildStatus = 'Not Started';
    let escapeStatus = 'Not Started';

    if (attempt?.levels) {
      circuitScore = attempt.levels.circuitMaster?.score || 0;
      spinScore = attempt.levels.spinArena?.score || 0;
      buildScore = attempt.levels.buildZone?.score || 0;
      escapeScore = attempt.levels.escapeRoom?.score || 0;

      circuitStatus = attempt.levels.circuitMaster?.status || 'Not Started';
      spinStatus = attempt.levels.spinArena?.status || 'Not Started';
      buildStatus = attempt.levels.buildZone?.status || 'Not Started';
      escapeStatus = attempt.levels.escapeRoom?.status || 'Not Started';
    } else if (attempt?.arenaLevels) {
      circuitScore = attempt.arenaLevels.circuitMaster?.score || 0;
      spinScore = attempt.arenaLevels.spinArena?.score || 0;
      buildScore = attempt.arenaLevels.buildZone?.score || 0;
      escapeScore = attempt.arenaLevels.escapeRoom?.score || 0;

      circuitStatus = attempt.arenaLevels.circuitMaster?.completed ? 'Completed' : 'Not Started';
      spinStatus = attempt.arenaLevels.spinArena?.completed ? 'Completed' : 'Not Started';
      buildStatus = attempt.arenaLevels.buildZone?.completed ? 'Completed' : 'Not Started';
      escapeStatus = attempt.arenaLevels.escapeRoom?.completed ? 'Completed' : 'Not Started';
    }

    const completedLevelsCount = attempt ? (attempt.completedLevelsCount || attempt.completedGamesCount || (quizStatus === 'Completed' ? 4 : 0)) : 0;
    const isChampion = Boolean(attempt?.isChampion || completedLevelsCount === 4);

    // Completion Filter
    if (completionFilter) {
      if (completionFilter === 'completedAll4' && completedLevelsCount !== 4) continue;
      if (completionFilter === 'completed3' && completedLevelsCount !== 3) continue;
      if (completionFilter === 'completed2' && completedLevelsCount !== 2) continue;
      if (completionFilter === 'completed1' && completedLevelsCount !== 1) continue;
      if (completionFilter === 'notStarted' && completedLevelsCount !== 0) continue;
    }

    // Score filter (handles 400-point arena scale)
    if (scoreFilter && attempt) {
      const s = attempt.score;
      if (scoreFilter === 'high' && s < 300) continue;
      if (scoreFilter === 'medium' && (s < 180 || s >= 300)) continue;
      if (scoreFilter === 'low' && s >= 180) continue;
    }

    results.push({
      participantId: p.participantId,
      fullName: p.fullName,
      email: p.email,
      branch: p.branch,
      collegeName: p.collegeName || 'N/A',
      isIeiMember: Boolean(p.isIeiMember),
      ieiMembershipId: p.ieiMembershipId || null,
      registrationTimestamp: p.registrationTimestamp,
      attemptId: attempt ? attempt.attemptId : null,
      score: attempt ? attempt.score : 0,
      scoreMax: 400,
      percentage: attempt ? attempt.percentage : 0,
      quizStatus: quizStatus,
      certificateStatus: cert ? 'Generated' : 'Not Generated',
      certificateId: cert ? cert.certificateId : null,
      emailStatus: cert ? cert.emailStatus : 'N/A',
      completionDate: attempt && attempt.completedAt ? attempt.completedAt : 'N/A',
      // Arena Level Scores & Statuses
      circuitScore,
      circuitStatus,
      spinScore,
      spinStatus,
      buildScore,
      buildStatus,
      escapeScore,
      escapeStatus,
      completedLevelsCount,
      completedGamesCount: completedLevelsCount,
      isChampion,
      eligibleForCertificate: isChampion
    });
  }

  // Sort by recent first
  results.sort((a, b) => new Date(b.registrationTimestamp) - new Date(a.registrationTimestamp));
  return results;
}

// Initialize on require
initDatabase();

module.exports = {
  createParticipant,
  findParticipantById,
  findParticipantByEmail,
  getAllParticipants,
  createQuizAttempt,
  findAttemptById,
  findLatestAttemptByParticipant,
  getOrAssignLevelQuestions,
  recordInteractiveAction,
  saveLevelAnswer,
  completeLevel,
  getArenaAttemptStatus,
  updateAttemptLevel,
  finalizeArenaAttempt,
  completeQuizAttempt,
  createCertificate,
  findCertificateByParticipant,
  findCertificateById,
  updateCertificateEmailStatus,
  logEmailDispatch,
  logEmailAttempt: logEmailDispatch,
  getEmailLogsByParticipant,
  getAnalytics,
  getAdminParticipantsList
};
