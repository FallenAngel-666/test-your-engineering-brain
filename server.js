/**
 * TEST YOUR ENGINEERING BRAIN - Main Server
 * Express Application with REST API, Certificate Generator, and Admin Control
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const db = require('./src/database');
const { getSanitizedQuestions, evaluateQuiz } = require('./src/questions');
const {
  getSanitizedArenaConfig,
  evaluateLevel,
  calculateArenaTotal
} = require('./src/arenaGames');
const { generateCertificatePdf } = require('./src/certificateGenerator');
const { sendCertificateEmail, getEmailProviderConfig } = require('./src/emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'IEI@Engineering2026';
const ADMIN_TOKEN = crypto.createHash('sha256').update(ADMIN_PASSWORD + '_SALT_MGR_IEI').digest('hex');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const queryToken = req.query.token;

  if (token === ADMIN_TOKEN || queryToken === ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Valid admin credentials required.' });
}

// ==========================================
// PUBLIC PARTICIPANT & QUIZ APIS
// ==========================================

// 1. Participant Registration
app.post('/api/register', (req, res) => {
  try {
    const { fullName, email, branch, collegeName, isIeiMember, ieiMembershipId } = req.body;

    // Strict Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid full name (minimum 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const validBranches = [
      'Computer Science and Engineering (CSE)',
      'Information Technology (IT)',
      'Artificial Intelligence and Data Science (AI & DS)',
      'Artificial Intelligence and Machine Learning (AI & ML)',
      'Cyber Security',
      'Cyber Forensics and Information Security',
      'Cyber Forensics',
      'Information Security',
      'Electronics and Communication Engineering (ECE)',
      'Electrical and Electronics Engineering (EEE)',
      'Mechanical Engineering',
      'Civil Engineering',
      'Biomedical Engineering',
      'Other'
    ];

    if (!branch || !validBranches.includes(branch)) {
      return res.status(400).json({ error: 'Please select a valid engineering branch from the list.' });
    }

    // IEI Membership validation
    const isMemberBool = isIeiMember === true || isIeiMember === 'yes' || isIeiMember === 'true';
    const cleanMemberId = isMemberBool && typeof ieiMembershipId === 'string' ? ieiMembershipId.trim() : null;

    if (isMemberBool && (!cleanMemberId || cleanMemberId.length < 2)) {
      return res.status(400).json({ error: 'Please enter your official IEI Membership Number.' });
    }

    // Check if participant already exists
    let participant = db.findParticipantByEmail(email);
    if (!participant) {
      participant = db.createParticipant({
        fullName,
        email,
        branch,
        collegeName: collegeName || '',
        isIeiMember: isMemberBool,
        ieiMembershipId: cleanMemberId
      });
    } else {
      participant.isIeiMember = isMemberBool;
      participant.ieiMembershipId = cleanMemberId;
      if (branch && validBranches.includes(branch)) participant.branch = branch;
    }

    // Check if participant already has a completed attempt
    const existingAttempt = db.findLatestAttemptByParticipant(participant.participantId);
    if (existingAttempt && existingAttempt.status === 'Completed') {
      const cert = db.findCertificateByParticipant(participant.participantId);
      return res.json({
        success: true,
        alreadyCompleted: true,
        message: 'You have already completed the quiz!',
        participant,
        attempt: existingAttempt,
        certificate: cert
      });
    }

    // Create a new quiz attempt if none in progress
    let attempt = existingAttempt;
    if (!attempt || attempt.status === 'Completed') {
      attempt = db.createQuizAttempt(participant.participantId);
    }

    return res.json({
      success: true,
      alreadyCompleted: false,
      participant: {
        participantId: participant.participantId,
        fullName: participant.fullName,
        email: participant.email,
        branch: participant.branch,
        collegeName: participant.collegeName,
        isIeiMember: Boolean(participant.isIeiMember),
        ieiMembershipId: participant.ieiMembershipId || null
      },
      attempt: {
        attemptId: attempt.attemptId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        levels: attempt.levels,
        currentUnlockedLevel: attempt.currentUnlockedLevel
      }
    });
  } catch (err) {
    console.error('[API /register error]:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. Fetch Quiz Questions (Legacy)
app.get('/api/quiz/questions', (req, res) => {
  try {
    const sanitized = getSanitizedQuestions();
    return res.json({
      success: true,
      totalQuestions: sanitized.length,
      questions: sanitized
    });
  } catch (err) {
    console.error('[API /quiz/questions error]:', err);
    return res.status(500).json({ error: 'Unable to retrieve quiz questions.' });
  }
});

// 2b. ENGINEERING ARENA - Fetch Game Configuration & Content (Client Safe)
app.get('/api/arena/config', (req, res) => {
  try {
    const config = getSanitizedArenaConfig();
    return res.json({
      success: true,
      config
    });
  } catch (err) {
    console.error('[API /arena/config error]:', err);
    return res.status(500).json({ error: 'Unable to retrieve arena configuration.' });
  }
});

// 2c. ENGINEERING ARENA - Get Student's Overall Arena Status & Sequential Progress
app.get('/api/arena/status', (req, res) => {
  try {
    const { attemptId, participantId } = req.query;
    let participantData = null;
    if (req.headers['x-participant-data']) {
      try { participantData = JSON.parse(decodeURIComponent(req.headers['x-participant-data'])); } catch (e) {}
    }

    const attempt = db.findOrCreateAttempt(attemptId, participantId, participantData);
    if (!attempt) {
      return res.status(404).json({ error: 'No active attempt found.' });
    }

    const status = db.getArenaAttemptStatus(attempt.attemptId, participantId, participantData);
    return res.json({ success: true, status });
  } catch (err) {
    console.error('[API /arena/status error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve arena status.' });
  }
});

// 2d. ENGINEERING ARENA - Fetch Assigned Question for a Round (Enforces Sequential Unlocking)
app.get('/api/arena/level/:levelKey', (req, res) => {
  try {
    const { levelKey } = req.params;
    const { attemptId, participantId } = req.query;
    let participantData = null;
    if (req.headers['x-participant-data']) {
      try { participantData = JSON.parse(decodeURIComponent(req.headers['x-participant-data'])); } catch (e) {}
    }

    const attempt = db.findOrCreateAttempt(attemptId, participantId, participantData);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    const levelData = db.getOrAssignLevelQuestions(attempt.attemptId, levelKey, participantId, participantData);
    if (levelData.error) {
      const statusCode = levelData.locked ? 403 : 400;
      return res.status(statusCode).json(levelData);
    }

    return res.json({ success: true, ...levelData });
  } catch (err) {
    console.error('[API /arena/level error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve level.' });
  }
});

// 2e. ENGINEERING ARENA - Record Interactive Action (Circuit connect, spin wheel, build bridge, escape room)
app.post('/api/arena/interactive-action', (req, res) => {
  try {
    const { attemptId, participantId, participantData, levelKey, payload } = req.body;
    if (!levelKey) {
      return res.status(400).json({ error: 'levelKey is required.' });
    }

    const result = db.recordInteractiveAction(attemptId, levelKey, payload || {}, participantId, participantData);
    if (result.error) {
      const statusCode = result.locked ? 403 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API /arena/interactive-action error]:', err);
    return res.status(500).json({ error: 'Failed to record interactive action.' });
  }
});

// 2f. ENGINEERING ARENA - Submit Question Answer (Real-time backend validation, No Pass Mark)
app.post('/api/arena/submit-answer', (req, res) => {
  try {
    const { attemptId, participantId, participantData, levelKey, questionId, selectedOption } = req.body;
    if (!levelKey || !selectedOption) {
      return res.status(400).json({ error: 'levelKey and selectedOption are required.' });
    }

    const result = db.saveLevelAnswer(attemptId, levelKey, questionId, selectedOption, participantId, participantData);
    if (result.error) {
      const statusCode = result.locked ? 403 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API /arena/submit-answer error]:', err);
    return res.status(500).json({ error: 'Failed to submit answer.' });
  }
});

// 2g. ENGINEERING ARENA - Complete Round (Calculates score & unlocks next round in sequence)
app.post('/api/arena/complete-level', (req, res) => {
  try {
    const { attemptId, participantId, participantData, levelKey } = req.body;
    if (!levelKey) {
      return res.status(400).json({ error: 'levelKey is required.' });
    }

    const result = db.completeLevel(attemptId, levelKey, participantId, participantData);
    if (result.error) {
      const statusCode = result.locked ? 403 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API /arena/complete-level error]:', err);
    return res.status(500).json({ error: 'Failed to complete level.' });
  }
});

// 2h. ENGINEERING ARENA - Backward-compatible Level Submission Endpoint
app.post('/api/arena/submit-level', (req, res) => {
  try {
    const { attemptId, participantId, levelKey, data, payload } = req.body;
    if (!levelKey) {
      return res.status(400).json({ error: 'Level key is required.' });
    }

    const effectiveData = payload || data || {};
    let updatedAttempt = null;

    if (attemptId) {
      const attempt = db.findAttemptById(attemptId);
      if (attempt) {
        db.recordInteractiveAction(attemptId, levelKey, effectiveData);
        // If question answer is included in payload
        if (effectiveData.selectedOption) {
          const lvlInfo = db.getOrAssignLevelQuestions(attemptId, levelKey);
          if (lvlInfo.questions && lvlInfo.questions.length > 0) {
            lvlInfo.questions.forEach(q => {
              db.saveLevelAnswer(attemptId, levelKey, q.id, effectiveData.selectedOption);
            });
            const comp = db.completeLevel(attemptId, levelKey);
            return res.json({
              success: true,
              levelResult: { score: comp.levelScore || 100, completed: true, correct: true },
              attempt: db.findAttemptById(attemptId)
            });
          }
        }
        updatedAttempt = db.updateAttemptLevel(attemptId, levelKey, { score: 100, completed: true });
      }
    }

    return res.json({
      success: true,
      score: 100,
      completed: true,
      correct: true,
      message: `${levelKey} completed!`,
      attempt: updatedAttempt
    });
  } catch (err) {
    console.error('[API /arena/submit-level error]:', err);
    return res.status(500).json({ error: 'Failed to process level submission.' });
  }
});

// 3. Submit Quiz / Finalize Engineering Arena (Strict Sequential Verification)
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { participantId, attemptId, answers, levels, isArena, participant: pPayload } = req.body;

    let participant = participantId ? db.findParticipantById(participantId) : null;

    if (!participant && pPayload && (pPayload.email || pPayload.fullName)) {
      if (pPayload.email) {
        participant = db.findParticipantByEmail(pPayload.email);
      }
      if (!participant) {
        participant = db.createParticipant({
          participantId: participantId || pPayload.participantId,
          fullName: pPayload.fullName || 'Participant',
          email: pPayload.email || 'participant@drmgrdu.ac.in',
          branch: pPayload.branch || 'Other',
          collegeName: pPayload.collegeName || '',
          isIeiMember: Boolean(pPayload.isIeiMember),
          ieiMembershipId: pPayload.ieiMembershipId || null
        });
      }
    }

    if (!participant) {
      participant = db.createParticipant({
        participantId: participantId || 'PART-RECOVERED',
        fullName: (pPayload && pPayload.fullName) ? pPayload.fullName : 'Engineering Participant',
        email: (pPayload && pPayload.email) ? pPayload.email : 'iei@drmgrdu.ac.in',
        branch: (pPayload && pPayload.branch) ? pPayload.branch : 'Other',
        collegeName: (pPayload && pPayload.collegeName) ? pPayload.collegeName : 'Dr. M.G.R. Educational and Research Institute',
        isIeiMember: Boolean(pPayload && pPayload.isIeiMember),
        ieiMembershipId: pPayload ? pPayload.ieiMembershipId : null
      });
    }

    let attempt = attemptId ? db.findAttemptById(attemptId) : null;
    if (!attempt) {
      attempt = db.createQuizAttempt(participant.participantId, attemptId);
    }

    if (attempt.status === 'Completed') {
      const cert = db.findCertificateByParticipant(participant.participantId);
      return res.status(200).json({
        success: true,
        alreadyCompleted: true,
        evaluation: {
          score: attempt.score,
          scoreMax: 400,
          totalScore: attempt.score,
          percentage: attempt.percentage,
          isChampion: Boolean(attempt.isChampion || attempt.completedLevelsCount === 4 || attempt.completedGamesCount === 4),
          completedGamesCount: 4,
          completedLevelsCount: 4,
          performanceBadge: "ENGINEERING ARENA CHAMPION 🏆",
          performanceMessage: "Outstanding! You are an Engineering Arena Champion!"
        },
        certificate: {
          certificateId: cert ? cert.certificateId : 'TYEB-2026-COMPLETED',
          downloadUrl: `/api/certificate/${cert ? cert.certificateId : ''}`,
          generatedAt: cert ? cert.generatedAt : new Date().toISOString()
        },
        participant: {
          fullName: participant.fullName,
          email: participant.email,
          branch: participant.branch
        }
      });
    }

    const isArenaSubmission = Boolean(isArena || levels || attempt.arenaLevels || attempt.levels);
    let evaluation;
    let completedAttempt;

    if (isArenaSubmission) {
      // Finalize Arena - strictly verify all 4 levels are completed
      completedAttempt = db.finalizeArenaAttempt(attempt.attemptId);
      if (completedAttempt && completedAttempt.error) {
        return res.status(400).json(completedAttempt);
      }

      evaluation = {
        score: completedAttempt.score,
        scoreMax: 400,
        totalScore: completedAttempt.score,
        percentage: completedAttempt.percentage,
        correctAnswers: completedAttempt.completedLevelsCount || 4,
        completedGamesCount: 4,
        completedLevelsCount: 4,
        totalQuestions: 4,
        incorrectAnswers: 0,
        performanceMessage: "Outstanding! You are an Engineering Arena Champion with elite technical mastery across all 4 levels!",
        performanceBadge: "ENGINEERING ARENA CHAMPION 🏆",
        isChampion: true,
        arenaLevels: completedAttempt.levels || completedAttempt.arenaLevels
      };
    } else {
      // Legacy 10-MCQ evaluation
      evaluation = evaluateQuiz(answers || {});
      completedAttempt = db.completeQuizAttempt(attemptId, evaluation, answers || {});
    }

    // Generate Certificate PDF
    let cert = db.findCertificateByParticipant(participantId);
    if (!cert) {
      cert = db.createCertificate({
        participantId: participant.participantId,
        attemptId: completedAttempt.attemptId,
        certificateFileReference: ''
      });
    }

    const pdfResult = await generateCertificatePdf({
      certificateId: cert.certificateId,
      fullName: participant.fullName,
      branch: participant.branch,
      score: evaluation.score,
      scoreMax: isArenaSubmission ? 400 : 10,
      isChampion: Boolean(evaluation.isChampion),
      percentage: evaluation.percentage,
      completionDate: completedAttempt.completedAt
    });

    // Update certificate file reference
    cert.certificateFileReference = pdfResult.filePath;

    // Trigger Email Delivery
    const emailResult = await sendCertificateEmail({
      participant,
      certificate: cert,
      score: evaluation.score,
      percentage: evaluation.percentage,
      pdfBuffer: pdfResult.pdfBuffer,
      fileName: pdfResult.fileName
    });

    return res.json({
      success: true,
      participant: {
        fullName: participant.fullName,
        email: participant.email,
        branch: participant.branch
      },
      evaluation: {
        score: evaluation.score,
        maxScore: evaluation.maxScore || 10,
        totalQuestions: evaluation.totalQuestions,
        percentage: evaluation.percentage,
        correctAnswers: evaluation.correctAnswers,
        incorrectAnswers: evaluation.incorrectAnswers,
        performanceMessage: evaluation.performanceMessage,
        performanceBadge: evaluation.performanceBadge,
        isChampion: Boolean(evaluation.isChampion),
        completedCount: evaluation.completedCount || evaluation.correctAnswers,
        levels: evaluation.levels || null,
        breakdown: evaluation.breakdown || null
      },
      certificate: {
        certificateId: cert.certificateId,
        downloadUrl: `/api/certificate/${cert.certificateId}`,
        pdfBase64: pdfResult.pdfBuffer.toString('base64'),
        generatedAt: cert.generatedAt
      },
      emailStatus: {
        status: emailResult.status,
        provider: emailResult.provider,
        message: emailResult.message || 'Email delivery dispatched.'
      }
    });
  } catch (err) {
    console.error('[API /quiz/submit error]:', err);
    return res.status(500).json({ error: 'An error occurred while evaluating your quiz.' });
  }
});

// 4. Download E-Certificate PDF
app.get('/api/certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = db.findCertificateById(certificateId);

    if (!cert) {
      return res.status(404).send('Certificate not found.');
    }

    const fileName = `Your_Engineering_Brain_Certificate_${certificateId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // 1. If file exists on disk, stream it
    if (cert.certificateFileReference && fs.existsSync(cert.certificateFileReference)) {
      db.incrementCertificateDownload(certificateId);
      return fs.createReadStream(cert.certificateFileReference).pipe(res);
    }

    // 2. Otherwise generate in memory (serverless / cloud resilient)
    const participant = db.findParticipantById(cert.participantId);
    const attempt = db.findAttemptById(cert.attemptId);
    if (!participant || !attempt) {
      return res.status(404).send('Certificate metadata could not be loaded.');
    }

    const generated = await generateCertificatePdf({
      certificateId: cert.certificateId,
      fullName: participant.fullName,
      branch: participant.branch,
      score: attempt.score,
      percentage: attempt.percentage,
      completionDate: cert.generatedAt
    });

    db.incrementCertificateDownload(certificateId);
    return res.send(generated.pdfBuffer);
  } catch (err) {
    console.error('[API /certificate download error]:', err);
    return res.status(500).send('Error downloading certificate.');
  }
});

// 5. Check Certificate & Email Status
app.get('/api/certificate/status/:participantId', (req, res) => {
  try {
    const { participantId } = req.params;
    const cert = db.findCertificateByParticipant(participantId);
    if (!cert) {
      return res.json({ generated: false });
    }

    const logs = db.getEmailLogsByParticipant(participantId);
    return res.json({
      generated: true,
      certificateId: cert.certificateId,
      emailStatus: cert.emailStatus,
      downloadCount: cert.downloadCount,
      generatedAt: cert.generatedAt,
      emailLogs: logs
    });
  } catch (err) {
    console.error('[API /certificate/status error]:', err);
    return res.status(500).json({ error: 'Failed to fetch status.' });
  }
});

// 6. Resend Certificate Email (Participant trigger)
app.post('/api/certificate/resend', async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required.' });
    }

    const participant = db.findParticipantById(participantId);
    const cert = db.findCertificateByParticipant(participantId);
    const attempt = db.findLatestAttemptByParticipant(participantId);

    if (!participant || !cert || !attempt) {
      return res.status(404).json({ error: 'Certificate record not found for resend.' });
    }

    // Ensure PDF exists
    let filePath = cert.certificateFileReference;
    if (!filePath || !fs.existsSync(filePath)) {
      const generated = await generateCertificatePdf({
        certificateId: cert.certificateId,
        fullName: participant.fullName,
        branch: participant.branch,
        score: attempt.score,
        percentage: attempt.percentage,
        completionDate: cert.generatedAt
      });
      filePath = generated.filePath;
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const emailResult = await sendCertificateEmail({
      participant,
      certificate: cert,
      score: attempt.score,
      percentage: attempt.percentage,
      pdfBuffer,
      fileName
    });

    return res.json({
      success: emailResult.success || emailResult.status === 'Pending Config',
      status: emailResult.status,
      provider: emailResult.provider,
      message: emailResult.message || 'Email resent successfully.'
    });
  } catch (err) {
    console.error('[API /certificate/resend error]:', err);
    return res.status(500).json({ error: 'Failed to resend certificate email.' });
  }
});

// ==========================================
// ADMINISTRATOR APIS (PROTECTED)
// ==========================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      message: 'Admin authentication successful.'
    });
  }

  return res.status(401).json({ error: 'Invalid administrator password.' });
});

// Admin Analytics
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  try {
    const analytics = db.getAnalytics();
    return res.json({ success: true, analytics });
  } catch (err) {
    console.error('[API /admin/stats error]:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// Admin Participants List (Search & Filter)
app.get('/api/admin/participants', requireAdmin, (req, res) => {
  try {
    const { search, branch, status, scoreFilter } = req.query;
    const participants = db.getAdminParticipantsList({
      search,
      branch,
      status,
      scoreFilter
    });
    return res.json({ success: true, count: participants.length, participants });
  } catch (err) {
    console.error('[API /admin/participants error]:', err);
    return res.status(500).json({ error: 'Failed to load participants.' });
  }
});

// Admin Single Participant Detail (with full answers & review)
app.get('/api/admin/participant/:id', requireAdmin, (req, res) => {
  try {
    const participantId = req.params.id;
    const participant = db.findParticipantById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found.' });
    }

    const attempt = db.findLatestAttemptByParticipant(participantId);
    const cert = db.findCertificateByParticipant(participantId);
    const emailLogs = db.getEmailLogsByParticipant(participantId);

    // If attempt has answers, compute breakdown
    let breakdown = [];
    if (attempt && attempt.answers) {
      const evaluation = evaluateQuiz(attempt.answers);
      breakdown = evaluation.breakdown;
    }

    return res.json({
      success: true,
      participant,
      attempt,
      certificate: cert,
      emailLogs,
      breakdown
    });
  } catch (err) {
    console.error('[API /admin/participant/:id error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve participant details.' });
  }
});

// Admin Resend Email Action
app.post('/api/admin/resend-email/:participantId', requireAdmin, async (req, res) => {
  try {
    const { participantId } = req.params;
    const participant = db.findParticipantById(participantId);
    const cert = db.findCertificateByParticipant(participantId);
    const attempt = db.findLatestAttemptByParticipant(participantId);

    if (!participant || !cert || !attempt) {
      return res.status(404).json({ error: 'Required records not found for this participant.' });
    }

    let filePath = cert.certificateFileReference;
    if (!filePath || !fs.existsSync(filePath)) {
      const generated = await generateCertificatePdf({
        certificateId: cert.certificateId,
        fullName: participant.fullName,
        branch: participant.branch,
        score: attempt.score,
        percentage: attempt.percentage,
        completionDate: cert.generatedAt
      });
      filePath = generated.filePath;
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const emailResult = await sendCertificateEmail({
      participant,
      certificate: cert,
      score: attempt.score,
      percentage: attempt.percentage,
      pdfBuffer,
      fileName
    });

    return res.json({
      success: true,
      status: emailResult.status,
      message: `Email action processed: ${emailResult.status}`
    });
  } catch (err) {
    console.error('[API /admin/resend-email error]:', err);
    return res.status(500).json({ error: 'Admin email dispatch failed.' });
  }
});

// Admin CSV Export
app.get('/api/admin/export-csv', requireAdmin, (req, res) => {
  try {
    const participants = db.getAdminParticipantsList();

    // CSV Headers
    const headers = [
      'Participant ID',
      'Full Name',
      'Email Address',
      'Engineering Branch',
      'College Name',
      'IEI Member',
      'IEI Membership ID',
      'Registration Timestamp',
      'Total Score (out of 400)',
      'Completed Rounds (out of 4)',
      'Round 1 Question ID',
      'Round 1 Answer',
      'Round 1 Status',
      'Round 2 Question ID',
      'Round 2 Answer',
      'Round 2 Status',
      'Round 3 Question ID',
      'Round 3 Answer',
      'Round 3 Status',
      'Round 4 Question ID',
      'Round 4 Answer',
      'Round 4 Status',
      'Arena Champion',
      'Overall Completion Status',
      'Certificate Status',
      'Certificate ID',
      'Email Status',
      'Completion Date'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = participants.map(p => [
      escapeCsv(p.participantId),
      escapeCsv(p.fullName),
      escapeCsv(p.email),
      escapeCsv(p.branch),
      escapeCsv(p.collegeName),
      escapeCsv(p.isIeiMember ? 'Yes' : 'No'),
      escapeCsv(p.ieiMembershipId || 'N/A'),
      escapeCsv(p.registrationTimestamp),
      escapeCsv(p.score),
      escapeCsv(`${p.completedLevelsCount ?? 0} / 4`),
      escapeCsv(p.r1QuestionId || 'N/A'),
      escapeCsv(p.r1Answer || 'N/A'),
      escapeCsv(p.circuitStatus || 'Not Started'),
      escapeCsv(p.r2QuestionId || 'N/A'),
      escapeCsv(p.r2Answer || 'N/A'),
      escapeCsv(p.spinStatus || 'Not Started'),
      escapeCsv(p.r3QuestionId || 'N/A'),
      escapeCsv(p.r3Answer || 'N/A'),
      escapeCsv(p.buildStatus || 'Not Started'),
      escapeCsv(p.r4QuestionId || 'N/A'),
      escapeCsv(p.r4Answer || 'N/A'),
      escapeCsv(p.escapeStatus || 'Not Started'),
      escapeCsv(p.isChampion ? 'Yes 🏆' : 'No'),
      escapeCsv(p.quizStatus),
      escapeCsv(p.certificateStatus),
      escapeCsv(p.certificateId || 'N/A'),
      escapeCsv(p.emailStatus),
      escapeCsv(p.completionDate)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n'); // UTF-8 BOM for Excel

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Engineering_Arena_Participants.csv"');
    return res.send(csvContent);
  } catch (err) {
    console.error('[API /admin/export-csv error]:', err);
    return res.status(500).send('Failed to generate CSV export.');
  }
});

// System Status & Email Provider Configuration Health
app.get('/api/system/status', (req, res) => {
  const emailConfig = getEmailProviderConfig();
  res.json({
    appName: "TEST YOUR ENGINEERING BRAIN",
    version: "1.0.0",
    organizer: "MGR IEI Students Chapter, Dr. M.G.R. Educational and Research Institute",
    emailConfig: {
      provider: emailConfig.provider,
      isConfigured: emailConfig.isConfigured,
      fromEmail: emailConfig.fromEmail,
      fromName: emailConfig.fromName
    }
  });
});

// Fallback route to serve frontend index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server when run directly or locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🧠 TEST YOUR ENGINEERING BRAIN - Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🎓 MGR IEI Students Chapter • Dr. M.G.R. University`);
    console.log(`🔑 Admin Default Password: ${ADMIN_PASSWORD}`);
    console.log(`=======================================================`);
  });
}

// Export for Vercel Serverless Function
module.exports = app;
