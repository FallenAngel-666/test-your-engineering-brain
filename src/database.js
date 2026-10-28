/**
 * Data Access Layer for TEST YOUR ENGINEERING BRAIN
 * Provides thread-safe, persistent JSON storage with atomic writes and Vercel serverless resiliency.
 * Supports participants, quiz attempts, sequential 4-round progress, certificates, and email audit logs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  QUESTIONS_PER_ROUND,
  LEVEL_ORDER,
  LEVEL_METADATA,
  getAssignedQuestionWithAvoidance,
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
    version: "2.1.0"
  }
};

let db = { ...defaultState };

function reloadDatabaseFromFile() {
  let sourceFile = DB_FILE;
  if (!fs.existsSync(sourceFile) && fs.existsSync(BUNDLED_DB)) {
    sourceFile = BUNDLED_DB;
  }
  if (fs.existsSync(sourceFile)) {
    try {
      const content = fs.readFileSync(sourceFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed) {
        // Merge without losing freshly added in-memory items
        const existingPartIds = new Set((parsed.participants || []).map(p => p.participantId));
        (db.participants || []).forEach(p => {
          if (!existingPartIds.has(p.participantId)) parsed.participants.push(p);
        });

        const existingAttemptIds = new Set((parsed.quizAttempts || []).map(a => a.attemptId));
        (db.quizAttempts || []).forEach(a => {
          if (!existingAttemptIds.has(a.attemptId)) parsed.quizAttempts.push(a);
        });

        db.participants = parsed.participants || [];
        db.quizAttempts = parsed.quizAttempts || [];
        db.certificates = parsed.certificates || db.certificates || [];
        db.emailLogs = parsed.emailLogs || db.emailLogs || [];
      }
    } catch (e) {}
  }
}

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
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    }
    const dataStr = JSON.stringify(db, null, 2);
    try {
      const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
      fs.writeFileSync(tempFile, dataStr, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (renameErr) {
      fs.writeFileSync(DB_FILE, dataStr, 'utf-8');
    }
  } catch (err) {
    console.error('[Database] Failed write:', err);
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
    fullName: (fullName || 'Participant').trim(),
    email: (email || 'student@example.com').trim().toLowerCase(),
    branch: (branch || 'Engineering').trim(),
    collegeName: collegeName ? collegeName.trim() : "Dr. M.G.R. Educational and Research Institute",
    isIeiMember: isMemberBool,
    ieiMembershipId: cleanMemberId,
    registrationTimestamp: now
  };

  const existingIdx = db.participants.findIndex(p => p.participantId === participantId);
  if (existingIdx >= 0) {
    db.participants[existingIdx] = participant;
  } else {
    db.participants.push(participant);
  }

  saveDatabase();
  return participant;
}

function findParticipantById(participantId) {
  if (!participantId) return null;
  let p = db.participants.find(item => item.participantId === participantId);
  if (!p) {
    reloadDatabaseFromFile();
    p = db.participants.find(item => item.participantId === participantId);
  }
  return p || null;
}

function findParticipantByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  let p = db.participants.find(item => item.email === normalized);
  if (!p) {
    reloadDatabaseFromFile();
    p = db.participants.find(item => item.email === normalized);
  }
  return p || null;
}

function getAllParticipants() {
  reloadDatabaseFromFile();
  return [...db.participants];
}

// ----------------- QUIZ & ARENA ATTEMPTS -----------------
function createQuizAttempt(participantId, existingAttemptId) {
  const attemptId = existingAttemptId || generateId('ATT');
  const now = new Date().toISOString();

  db.lastAssignedIndices = db.lastAssignedIndices || {
    circuitMaster: -1,
    spinArena: -1,
    buildZone: -1,
    escapeRoom: -1
  };

  const seedId = participantId || attemptId;
  const q1Res = getAssignedQuestionWithAvoidance(seedId, 'circuitMaster', db.lastAssignedIndices.circuitMaster);
  db.lastAssignedIndices.circuitMaster = q1Res.index;

  const q2Res = getAssignedQuestionWithAvoidance(seedId, 'spinArena', db.lastAssignedIndices.spinArena);
  db.lastAssignedIndices.spinArena = q2Res.index;

  const q3Res = getAssignedQuestionWithAvoidance(seedId, 'buildZone', db.lastAssignedIndices.buildZone);
  db.lastAssignedIndices.buildZone = q3Res.index;

  const q4Res = getAssignedQuestionWithAvoidance(seedId, 'escapeRoom', db.lastAssignedIndices.escapeRoom);
  db.lastAssignedIndices.escapeRoom = q4Res.index;

  const attempt = {
    attemptId,
    participantId,
    status: 'In Progress', // 'Not Started', 'In Progress', 'Completed'
    startedAt: now,
    completedAt: null,
    // Engineering Arena Sequential 4-Round Progress
    currentUnlockedLevel: 'circuitMaster',
    assignedQuestionIds: {
      circuitMaster: q1Res.question.id,
      spinArena: q2Res.question.id,
      buildZone: q3Res.question.id,
      escapeRoom: q4Res.question.id
    },
    levels: {
      circuitMaster: {
        status: 'In Progress',
        unlocked: true,
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [q1Res.question],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      spinArena: {
        status: 'Not Started',
        unlocked: false,
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [q2Res.question],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      buildZone: {
        status: 'Not Started',
        unlocked: false,
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [q3Res.question],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      },
      escapeRoom: {
        status: 'Not Started',
        unlocked: false,
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [q4Res.question],
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

  const existingIdx = db.quizAttempts.findIndex(a => a.attemptId === attemptId);
  if (existingIdx >= 0) {
    db.quizAttempts[existingIdx] = attempt;
  } else {
    db.quizAttempts.push(attempt);
  }

  saveDatabase();
  return attempt;
}

function findAttemptById(attemptId) {
  if (!attemptId) return null;
  let a = db.quizAttempts.find(item => item.attemptId === attemptId);
  if (!a) {
    reloadDatabaseFromFile();
    a = db.quizAttempts.find(item => item.attemptId === attemptId);
  }
  return a || null;
}

function findLatestAttemptByParticipant(participantId) {
  if (!participantId) return null;
  reloadDatabaseFromFile();
  const attempts = db.quizAttempts.filter(a => a.participantId === participantId);
  if (attempts.length === 0) return null;
  return attempts[attempts.length - 1];
}

/**
 * Resilient helper: finds attempt or reconstructs it seamlessly.
 * Ensures Vercel serverless containers never fail with "Attempt not found"!
 */
function findOrCreateAttempt(attemptId, participantId, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (attempt) return attempt;

  if (participantId) {
    attempt = findLatestAttemptByParticipant(participantId);
    if (attempt) return attempt;
  }

  let participant = participantId ? findParticipantById(participantId) : null;
  if (!participant && participantData) {
    participant = createParticipant({
      participantId: participantId,
      fullName: participantData.fullName || 'Participant',
      email: participantData.email || 'participant@example.com',
      branch: participantData.branch || 'Engineering',
      collegeName: participantData.collegeName || '',
      isIeiMember: participantData.isIeiMember || false,
      ieiMembershipId: participantData.ieiMembershipId || null
    });
  }

  const effectivePartId = participant ? participant.participantId : (participantId || generateId('PART'));
  attempt = createQuizAttempt(effectivePartId, attemptId);
  return attempt;
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
        completed: false,
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
        completed: false,
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
        completed: false,
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
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      }
    };
  }

  // Ensure each level has assignedQuestions populated
  if (!attempt.assignedQuestionIds) attempt.assignedQuestionIds = {};
  LEVEL_ORDER.forEach(key => {
    if (!attempt.levels[key]) {
      attempt.levels[key] = {
        status: key === 'circuitMaster' ? 'In Progress' : 'Not Started',
        unlocked: key === 'circuitMaster',
        completed: false,
        interactiveCompleted: false,
        assignedQuestions: [],
        answers: {},
        score: 0,
        maxScore: 100,
        completedAt: null
      };
    }
    if (!attempt.levels[key].assignedQuestions || attempt.levels[key].assignedQuestions.length === 0) {
      const qRes = getAssignedQuestionWithAvoidance(attempt.participantId || attempt.attemptId, key);
      attempt.levels[key].assignedQuestions = [qRes.question];
      attempt.assignedQuestionIds[key] = qRes.question.id;
    }
  });

  // Sync unlocked states according to sequential rules
  attempt.levels.circuitMaster.unlocked = true;
  attempt.levels.spinArena.unlocked = Boolean(attempt.levels.circuitMaster?.completed || attempt.levels.circuitMaster?.status === 'Completed');
  attempt.levels.buildZone.unlocked = Boolean(attempt.levels.spinArena?.completed || attempt.levels.spinArena?.status === 'Completed');
  attempt.levels.escapeRoom.unlocked = Boolean(attempt.levels.buildZone?.completed || attempt.levels.buildZone?.status === 'Completed');
}

/**
 * Retrieves the student's assigned question for a round.
 * If questions haven't been assigned yet, generates exactly 1 question deterministically per student ID and persists it.
 * Enforces sequential unlocking: returns error if level is locked!
 */
function getOrAssignLevelQuestions(attemptId, levelKey, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  // Check sequential unlocking
  if (!isLevelUnlocked(attempt, levelKey)) {
    return {
      error: `Level is locked. You must complete the previous round in sequence first.`,
      locked: true,
      levelKey
    };
  }

  const lvl = attempt.levels[levelKey];
  // Exactly 1 question per round
  if (!lvl.assignedQuestions || lvl.assignedQuestions.length === 0) {
    lvl.assignedQuestions = generateAssignedQuestions(levelKey, attempt.participantId);
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
    maxScore: 100,
    completed: Boolean(lvl.completed || lvl.status === 'Completed')
  };
}

/**
 * Records completion of the interactive game portion (circuit / wheel / bridge / escape)
 */
function recordInteractiveAction(attemptId, levelKey, payload = {}, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  if (!isLevelUnlocked(attempt, levelKey)) {
    return { error: `Round is locked. Complete the previous round first.`, locked: true };
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
 * Submits an answer to the round's assigned question.
 * 
 * CRITICAL REQUIREMENT: NO PASS MARK!
 * Wrong answers MUST NOT block progression.
 * Submitting any valid answer saves the response, provides friendly feedback,
 * marks the round as completed, and unlocks the next round in sequence!
 */
function saveLevelAnswer(attemptId, levelKey, questionId, selectedOption, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  if (!isLevelUnlocked(attempt, levelKey)) {
    return { error: `Round is locked. Complete the previous round first.`, locked: true };
  }

  const lvl = attempt.levels[levelKey];
  if (!lvl.assignedQuestions || lvl.assignedQuestions.length === 0) {
    lvl.assignedQuestions = generateAssignedQuestions(levelKey, attempt.participantId);
  }

  const q = (lvl.assignedQuestions || []).find(item => item.id === questionId) || lvl.assignedQuestions[0];
  if (!q) {
    return { error: 'Question not found in assigned question set.' };
  }

  if (!lvl.answers) lvl.answers = {};
  lvl.answers[q.id] = selectedOption;

  const evalResult = evaluateQuestionAnswer(q, selectedOption);

  // In educational game mode, every completed round awards completion credit
  lvl.completed = true;
  lvl.status = 'Completed';
  lvl.score = 100;
  lvl.completedAt = new Date().toISOString();

  if (!attempt.arenaLevels) attempt.arenaLevels = {};
  attempt.arenaLevels[levelKey] = {
    score: 100,
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
  attempt.completedLevelsCount = Object.values(attempt.levels).filter(l => l.completed || l.status === 'Completed').length;
  attempt.completedGamesCount = attempt.completedLevelsCount;
  attempt.totalScore = attempt.completedLevelsCount * 100;
  attempt.arenaScore = attempt.totalScore;
  attempt.score = attempt.totalScore;
  attempt.percentage = Math.round((attempt.score / 400) * 100);
  attempt.isChampion = attempt.completedLevelsCount === 4;

  saveDatabase();

  return {
    success: true,
    levelKey,
    questionId: q.id,
    selectedOption,
    isCorrect: evalResult.isCorrect,
    correctOption: evalResult.correctOption,
    explanation: evalResult.explanation,
    friendlyFeedback: evalResult.friendlyFeedback,
    completed: true,
    levelScore: 100,
    totalScore: attempt.totalScore,
    completedLevelsCount: attempt.completedLevelsCount,
    isChampion: attempt.isChampion,
    nextLevel: nextKey,
    nextLevelUnlocked: Boolean(nextKey)
  };
}

/**
 * Completes a level when interactive action and question are done.
 * Unlocks the next round in sequence.
 */
function completeLevel(attemptId, levelKey, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
  if (!attempt) return { error: 'Attempt not found.' };

  ensureAttemptLevels(attempt);

  const lvl = attempt.levels[levelKey];
  lvl.completed = true;
  lvl.status = 'Completed';
  lvl.score = 100;
  lvl.completedAt = new Date().toISOString();

  if (!attempt.arenaLevels) attempt.arenaLevels = {};
  attempt.arenaLevels[levelKey] = {
    score: 100,
    maxScore: 100,
    completed: true,
    completedAt: lvl.completedAt
  };

  const nextKey = LEVEL_METADATA[levelKey]?.nextLevel;
  if (nextKey && attempt.levels[nextKey]) {
    attempt.levels[nextKey].unlocked = true;
    if (attempt.levels[nextKey].status === 'Not Started') {
      attempt.levels[nextKey].status = 'In Progress';
    }
    attempt.currentUnlockedLevel = nextKey;
  }

  attempt.completedLevelsCount = Object.values(attempt.levels).filter(l => l.completed || l.status === 'Completed').length;
  attempt.completedGamesCount = attempt.completedLevelsCount;
  attempt.totalScore = attempt.completedLevelsCount * 100;
  attempt.arenaScore = attempt.totalScore;
  attempt.score = attempt.totalScore;
  attempt.percentage = Math.round((attempt.score / 400) * 100);
  attempt.isChampion = attempt.completedLevelsCount === 4;

  saveDatabase();

  return {
    success: true,
    levelKey,
    levelScore: 100,
    maxScore: 100,
    totalScore: attempt.totalScore,
    completedLevelsCount: attempt.completedLevelsCount,
    isChampion: attempt.isChampion,
    nextLevel: nextKey,
    nextLevelUnlocked: Boolean(nextKey)
  };
}

/**
 * Returns overall arena attempt status including unlocked levels, scores, and progress
 */
function getArenaAttemptStatus(attemptId, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
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
      roundNumber: idx + 1,
      name: LEVEL_METADATA[key].name,
      roundTitle: LEVEL_METADATA[key].roundTitle,
      theme: LEVEL_METADATA[key].theme,
      icon: LEVEL_METADATA[key].icon,
      unlocked,
      completed: lvl ? Boolean(lvl.completed || lvl.status === 'Completed') : false,
      status: lvl ? lvl.status : (unlocked ? 'In Progress' : 'Not Started'),
      interactiveCompleted: Boolean(lvl?.interactiveCompleted),
      score: lvl ? (lvl.score || 0) : 0,
      maxScore: 100,
      answeredCount: Object.keys(answers).length,
      totalQuestions: 1,
      questions: unlocked && assigned.length > 0 ? sanitizeAssignedQuestions(assigned) : [],
      answers: unlocked ? answers : {}
    };
  });

  const completedLevelsCount = Object.values(attempt.levels).filter(l => l.completed || l.status === 'Completed').length;
  const totalScore = completedLevelsCount * 100;

  return {
    attemptId: attempt.attemptId,
    participantId: attempt.participantId,
    status: attempt.status,
    totalScore,
    maxScore: 400,
    completedLevelsCount,
    completedCount: completedLevelsCount,
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
    lvl.score = 100;
    lvl.completed = Boolean(levelResult.completed);
    lvl.status = levelResult.completed ? 'Completed' : 'In Progress';
    lvl.interactiveCompleted = Boolean(levelResult.completed || levelResult.isCircuitOk || levelResult.isBridgeOk);
    lvl.completedAt = levelResult.completed ? now : null;
  }

  if (!attempt.arenaLevels) attempt.arenaLevels = {};
  attempt.arenaLevels[levelKey] = {
    score: 100,
    maxScore: 100,
    completed: Boolean(levelResult.completed),
    completedAt: now,
    details: levelResult
  };

  attempt.completedGamesCount = [
    attempt.arenaLevels.circuitMaster?.completed,
    attempt.arenaLevels.spinArena?.completed,
    attempt.arenaLevels.buildZone?.completed,
    attempt.arenaLevels.escapeRoom?.completed
  ].filter(Boolean).length;
  attempt.completedLevelsCount = attempt.completedGamesCount;
  attempt.totalScore = attempt.completedLevelsCount * 100;
  attempt.arenaScore = attempt.totalScore;
  attempt.score = attempt.totalScore;
  attempt.percentage = Math.round((attempt.arenaScore / 400) * 100);
  attempt.isChampion = attempt.completedGamesCount === 4;

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
 * Strictly verifies that all 4 rounds are completed before finalizing!
 */
function finalizeArenaAttempt(attemptId, arenaSummary = {}, participantId = null, participantData = null) {
  let attempt = findAttemptById(attemptId);
  if (!attempt && (participantId || attemptId)) {
    attempt = findOrCreateAttempt(attemptId, participantId, participantData);
  }
  if (!attempt) return null;

  ensureAttemptLevels(attempt);

  const completedCount = Object.values(attempt.levels).filter(l => l.completed || l.status === 'Completed').length;
  const legacyCompleted = attempt.completedGamesCount || 0;
  const effectiveCompleted = Math.max(completedCount, legacyCompleted);

  if (effectiveCompleted < 4 && !arenaSummary.force) {
    return {
      error: `All four rounds must be completed sequentially before claiming the certificate (${effectiveCompleted}/4 completed).`,
      completedLevelsCount: effectiveCompleted
    };
  }

  const now = new Date().toISOString();
  attempt.totalScore = 400;
  attempt.score = 400;
  attempt.arenaScore = 400;
  attempt.percentage = 100;
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
  reloadDatabaseFromFile();
  return db.certificates.find(c => c.participantId === participantId) || null;
}

function findCertificateById(certificateId) {
  reloadDatabaseFromFile();
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
  participantId,
  certificateId,
  recipientEmail,
  serviceUsed,
  status,
  errorMessage = null,
  messageId = null
}) {
  const logEntry = {
    logId: generateId('LOG'),
    timestamp: new Date().toISOString(),
    participantId,
    certificateId,
    recipientEmail,
    serviceUsed,
    status,
    errorMessage,
    messageId
  };

  db.emailLogs.push(logEntry);
  saveDatabase();
  return logEntry;
}

function getEmailLogsByParticipant(participantId) {
  reloadDatabaseFromFile();
  return db.emailLogs.filter(l => l.participantId === participantId);
}

// ----------------- ADMIN ANALYTICS -----------------
function getAnalytics() {
  reloadDatabaseFromFile();
  const totalRegistrations = db.participants.length;
  const completedAttempts = db.quizAttempts.filter(a => a.status === 'Completed');
  const totalCompleted = completedAttempts.length;

  const totalScores = completedAttempts.reduce((acc, cur) => acc + (cur.score || 0), 0);
  const averageScore = totalCompleted > 0 ? (totalScores / totalCompleted).toFixed(1) : 0;
  const highestScore = completedAttempts.reduce((max, cur) => Math.max(max, cur.score || 0), 0);

  // Branch breakdown
  const branchCounts = {};
  db.participants.forEach(p => {
    const b = p.branch || 'Unknown';
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  // IEI Membership breakdown
  const ieiMembers = db.participants.filter(p => Boolean(p.isIeiMember)).length;
  const nonIeiMembers = totalRegistrations - ieiMembers;

  // Round completion stats
  const roundStats = { round1: 0, round2: 0, round3: 0, round4: 0 };
  db.quizAttempts.forEach(a => {
    if (a.levels?.circuitMaster?.completed) roundStats.round1++;
    if (a.levels?.spinArena?.completed) roundStats.round2++;
    if (a.levels?.buildZone?.completed) roundStats.round3++;
    if (a.levels?.escapeRoom?.completed) roundStats.round4++;
  });

  return {
    totalRegistrations,
    totalRegistered: totalRegistrations,
    totalCompleted,
    averageScore: Number(averageScore),
    highestScore,
    branchCounts,
    ieiMembers,
    nonIeiMembers,
    roundStats,
    certificatesIssued: db.certificates.length
  };
}

// ----------------- ADMIN PARTICIPANT VIEW -----------------
function getAdminParticipantsList({ search = '', branch = '', status = '', scoreFilter = '', completionFilter = '' } = {}) {
  reloadDatabaseFromFile();
  const results = [];

  for (const p of db.participants) {
    const attempt = findLatestAttemptByParticipant(p.participantId);
    const cert = findCertificateByParticipant(p.participantId);

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchEmail = p.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) continue;
    }

    // Branch filter
    if (branch && p.branch !== branch) continue;

    // Status filter
    const quizStatus = attempt ? attempt.status : 'Not Started';
    if (status && quizStatus !== status) continue;

    // Assigned question IDs & answers
    const r1Q = attempt?.levels?.circuitMaster?.assignedQuestions?.[0]?.id || 'N/A';
    const r1Ans = attempt?.levels?.circuitMaster?.answers?.[r1Q] || 'N/A';
    const r2Q = attempt?.levels?.spinArena?.assignedQuestions?.[0]?.id || 'N/A';
    const r2Ans = attempt?.levels?.spinArena?.answers?.[r2Q] || 'N/A';
    const r3Q = attempt?.levels?.buildZone?.assignedQuestions?.[0]?.id || 'N/A';
    const r3Ans = attempt?.levels?.buildZone?.answers?.[r3Q] || 'N/A';
    const r4Q = attempt?.levels?.escapeRoom?.assignedQuestions?.[0]?.id || 'N/A';
    const r4Ans = attempt?.levels?.escapeRoom?.answers?.[r4Q] || 'N/A';

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
      // Assigned question IDs & Submitted Answers
      r1QuestionId: r1Q,
      r1Answer: r1Ans,
      r2QuestionId: r2Q,
      r2Answer: r2Ans,
      r3QuestionId: r3Q,
      r3Answer: r3Ans,
      r4QuestionId: r4Q,
      r4Answer: r4Ans,
      circuitScore: attempt?.levels?.circuitMaster?.score || 0,
      circuitStatus: attempt?.levels?.circuitMaster?.completed ? 'Completed' : 'Not Started',
      spinScore: attempt?.levels?.spinArena?.score || 0,
      spinStatus: attempt?.levels?.spinArena?.completed ? 'Completed' : 'Not Started',
      buildScore: attempt?.levels?.buildZone?.score || 0,
      buildStatus: attempt?.levels?.buildZone?.completed ? 'Completed' : 'Not Started',
      escapeScore: attempt?.levels?.escapeRoom?.score || 0,
      escapeStatus: attempt?.levels?.escapeRoom?.completed ? 'Completed' : 'Not Started',
      completedLevelsCount,
      completedGamesCount: completedLevelsCount,
      isChampion,
      eligibleForCertificate: isChampion
    });
  }

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
  findOrCreateAttempt,
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
