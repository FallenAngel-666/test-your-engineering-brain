/**
 * Data Access Layer for TEST YOUR ENGINEERING BRAIN
 * Provides thread-safe, persistent JSON storage with atomic writes.
 * Supports participants, quiz attempts, certificates, and email audit logs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    version: "1.0.0"
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
    collegeName: (collegeName || "").trim(),
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
  const normalized = (email || "").trim().toLowerCase();
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
    // Engineering Arena 4-Level Progress
    arenaLevels: {
      circuitMaster: { score: 0, maxScore: 100, completed: false, completedAt: null },
      spinArena: { score: 0, maxScore: 100, completed: false, completedAt: null },
      buildZone: { score: 0, maxScore: 100, completed: false, completedAt: null },
      escapeRoom: { score: 0, maxScore: 100, completed: false, completedAt: null }
    },
    arenaScore: 0,
    arenaMaxScore: 400,
    completedGamesCount: 0,
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

function updateAttemptLevel(attemptId, levelKey, levelResult) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  if (!attempt.arenaLevels) {
    attempt.arenaLevels = {
      circuitMaster: { score: 0, maxScore: 100, completed: false, completedAt: null },
      spinArena: { score: 0, maxScore: 100, completed: false, completedAt: null },
      buildZone: { score: 0, maxScore: 100, completed: false, completedAt: null },
      escapeRoom: { score: 0, maxScore: 100, completed: false, completedAt: null }
    };
  }

  const now = new Date().toISOString();
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
  attempt.percentage = Math.round((attempt.arenaScore / 400) * 100);

  attempt.completedGamesCount = [
    attempt.arenaLevels.circuitMaster?.completed,
    attempt.arenaLevels.spinArena?.completed,
    attempt.arenaLevels.buildZone?.completed,
    attempt.arenaLevels.escapeRoom?.completed
  ].filter(Boolean).length;

  attempt.isChampion = attempt.completedGamesCount === 4;

  saveDatabase();
  return attempt;
}

function finalizeArenaAttempt(attemptId, arenaSummary = {}) {
  const attempt = findAttemptById(attemptId);
  if (!attempt) return null;

  if (attempt.status === 'Completed') {
    return { error: 'Attempt already submitted and finalized.' };
  }

  const now = new Date().toISOString();
  if (arenaSummary.levels) {
    attempt.arenaLevels = arenaSummary.levels;
  }
  if (arenaSummary.totalScore !== undefined) {
    attempt.arenaScore = arenaSummary.totalScore;
    attempt.score = arenaSummary.totalScore;
  }
  if (arenaSummary.percentage !== undefined) {
    attempt.percentage = arenaSummary.percentage;
  } else {
    attempt.percentage = Math.round((attempt.score / 400) * 100);
  }
  if (arenaSummary.completedCount !== undefined) {
    attempt.completedGamesCount = arenaSummary.completedCount;
  }
  attempt.isChampion = Boolean(attempt.completedGamesCount === 4 || arenaSummary.isChampion);

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
  attempt.answers = answers;
  attempt.score = evaluationResult.score;
  attempt.percentage = evaluationResult.percentage;
  attempt.correctAnswers = evaluationResult.correctAnswers;
  attempt.incorrectAnswers = evaluationResult.incorrectAnswers;
  attempt.status = 'Completed';
  attempt.completedAt = now;

  saveDatabase();
  return attempt;
}

// ----------------- CERTIFICATES -----------------
function createCertificate({ participantId, attemptId, certificateFileReference }) {
  // Check if certificate already exists for this attempt
  const existing = db.certificates.find(c => c.attemptId === attemptId);
  if (existing) {
    return existing;
  }

  const certificateId = `TYEB-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  const cert = {
    certificateId,
    participantId,
    attemptId,
    certificateFileReference,
    generatedAt: now,
    emailStatus: 'Pending', // 'Pending', 'Sent', 'Failed', 'Pending Config'
    downloadCount: 0
  };

  db.certificates.push(cert);
  saveDatabase();
  return cert;
}

function findCertificateById(certificateId) {
  return db.certificates.find(c => c.certificateId === certificateId) || null;
}

function findCertificateByParticipant(participantId) {
  return db.certificates.find(c => c.participantId === participantId) || null;
}

function updateCertificateEmailStatus(certificateId, status) {
  const cert = findCertificateById(certificateId);
  if (cert) {
    cert.emailStatus = status;
    saveDatabase();
  }
  return cert;
}

function incrementCertificateDownload(certificateId) {
  const cert = findCertificateById(certificateId);
  if (cert) {
    cert.downloadCount = (cert.downloadCount || 0) + 1;
    saveDatabase();
  }
  return cert;
}

// ----------------- EMAIL LOGS -----------------
function logEmailAttempt({ participantId, certificateId, status, errorCode = null, recipientEmail = "" }) {
  const emailLogId = generateId('EML');
  const now = new Date().toISOString();

  // Find previous attempts for this cert
  const existingLogs = db.emailLogs.filter(l => l.certificateId === certificateId);
  const attemptCount = existingLogs.length + 1;

  const log = {
    emailLogId,
    participantId,
    certificateId,
    recipientEmail,
    status, // 'Pending', 'Sent', 'Failed', 'Simulated'
    attemptCount,
    lastAttemptAt: now,
    errorCode: errorCode ? String(errorCode) : null
  };

  db.emailLogs.push(log);
  saveDatabase();
  return log;
}

function getEmailLogsByParticipant(participantId) {
  return db.emailLogs.filter(l => l.participantId === participantId);
}

function getAllEmailLogs() {
  return [...db.emailLogs];
}

// ----------------- ANALYTICS & STATS -----------------
function getAnalytics() {
  const totalRegistered = db.participants.length;
  const completedAttempts = db.quizAttempts.filter(a => a.status === 'Completed');
  const totalCompleted = completedAttempts.length;
  const totalCertificates = db.certificates.length;

  const emailsSent = db.certificates.filter(c => c.emailStatus === 'Sent').length;
  const emailsFailed = db.certificates.filter(c => c.emailStatus === 'Failed').length;
  const emailsPending = db.certificates.filter(c => c.emailStatus === 'Pending' || c.emailStatus === 'Pending Config').length;

  let totalScore = 0;
  let highestScore = 0;
  const scoreDistribution = {
    "9-10": 0,
    "7-8": 0,
    "5-6": 0,
    "0-4": 0
  };

  completedAttempts.forEach(a => {
    totalScore += a.score;
    if (a.score > highestScore) highestScore = a.score;

    if (a.score >= 9) scoreDistribution["9-10"]++;
    else if (a.score >= 7) scoreDistribution["7-8"]++;
    else if (a.score >= 5) scoreDistribution["5-6"]++;
    else scoreDistribution["0-4"]++;
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
function getAdminParticipantsList({ search = '', branch = '', status = '', scoreFilter = '' } = {}) {
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

    // Score filter (handles both 400-point arena scale and legacy 10-point scale)
    if (scoreFilter && attempt) {
      const s = attempt.score;
      if (scoreFilter === 'high' && (s < 9 || (s > 10 && s < 300))) continue;
      if (scoreFilter === 'medium' && ((s < 5 || s > 8) && (s < 180 || s > 299))) continue;
      if (scoreFilter === 'low' && (s > 4 && s < 180)) continue;
    }

    const arena = attempt?.arenaLevels || {};
    const circuitScore = arena.circuitMaster?.score ?? (attempt ? attempt.score : 0);
    const spinScore = arena.spinArena?.score ?? 0;
    const buildScore = arena.buildZone?.score ?? 0;
    const escapeScore = arena.escapeRoom?.score ?? 0;
    const completedGamesCount = attempt?.completedGamesCount ?? (quizStatus === 'Completed' ? 4 : 0);
    const isChampion = Boolean(attempt?.isChampion || (completedGamesCount === 4));

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
      percentage: attempt ? attempt.percentage : 0,
      quizStatus: quizStatus,
      certificateStatus: cert ? 'Generated' : 'Not Generated',
      certificateId: cert ? cert.certificateId : null,
      emailStatus: cert ? cert.emailStatus : 'N/A',
      completionDate: attempt && attempt.completedAt ? attempt.completedAt : 'N/A',
      // Arena Game Breakdown
      circuitScore,
      spinScore,
      buildScore,
      escapeScore,
      completedGamesCount,
      isChampion,
      arenaLevels: arena
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
  updateAttemptLevel,
  finalizeArenaAttempt,
  completeQuizAttempt,
  createCertificate,
  findCertificateById,
  findCertificateByParticipant,
  updateCertificateEmailStatus,
  incrementCertificateDownload,
  logEmailAttempt,
  getEmailLogsByParticipant,
  getAllEmailLogs,
  getAnalytics,
  getAdminParticipantsList
};
