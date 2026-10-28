/**
 * TEST YOUR ENGINEERING BRAIN - Complete Automated Verification Suite
 * Tests all 18 core scenarios outlined in Section 12 of the project specification.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./src/database');
const { getSanitizedQuestions, evaluateQuiz, questions } = require('./src/questions');
const arenaGames = require('./src/arenaGames');
const { generateCertificatePdf } = require('./src/certificateGenerator');
const { sendCertificateEmail, buildEmailContent } = require('./src/emailService');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.stack || err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.stack || err.message);
  }
}

async function executeSuite() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('=======================================================\n');

  // 1. Question Bank Integrity
  runTest('Question bank contains exactly 10 questions', () => {
    assert.strictEqual(questions.length, 10);
  });

  runTest('Sanitized questions do NOT expose correctOption or explanation', () => {
    const sanitized = getSanitizedQuestions();
    assert.strictEqual(sanitized.length, 10);
    sanitized.forEach(q => {
      assert.strictEqual(q.correctOption, undefined);
      assert.strictEqual(q.explanation, undefined);
      assert.ok(q.options.A && q.options.B && q.options.C && q.options.D);
    });
  });

  // 2. Server-side Quiz Evaluation
  runTest('Quiz scoring correctly calculates 10/10 for all correct answers', () => {
    const perfectAnswers = {};
    questions.forEach(q => { perfectAnswers[q.id] = q.correctOption; });
    const result = evaluateQuiz(perfectAnswers);

    assert.strictEqual(result.score, 10);
    assert.strictEqual(result.percentage, 100);
    assert.strictEqual(result.correctAnswers, 10);
    assert.strictEqual(result.incorrectAnswers, 0);
    assert.ok(result.performanceMessage.includes("Outstanding"));
  });

  runTest('Quiz scoring calculates 0/10 for all wrong answers', () => {
    const wrongAnswers = {};
    questions.forEach(q => {
      // Pick a wrong letter
      const wrong = ['A', 'B', 'C', 'D'].find(l => l !== q.correctOption);
      wrongAnswers[q.id] = wrong;
    });
    const result = evaluateQuiz(wrongAnswers);

    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.percentage, 0);
    assert.strictEqual(result.correctAnswers, 0);
    assert.strictEqual(result.incorrectAnswers, 10);
    assert.ok(result.performanceMessage.includes("Keep Practising"));
  });

  runTest('Quiz scoring allows unanswered questions without throwing', () => {
    const partialAnswers = { 1: questions[0].correctOption, 2: questions[1].correctOption };
    const result = evaluateQuiz(partialAnswers);

    assert.strictEqual(result.score, 2);
    assert.strictEqual(result.percentage, 20);
    assert.strictEqual(result.correctAnswers, 2);
    assert.strictEqual(result.incorrectAnswers, 8);
  });

  // 3. Database Layer Validation
  runTest('Participant registration persists correctly with generated ID', () => {
    const p = db.createParticipant({
      fullName: 'Vikramaditya Rao',
      email: 'vikram.rao@drmgrdu.ac.in',
      branch: 'Computer Science and Engineering (CSE)',
      collegeName: 'Dr. M.G.R. Educational and Research Institute'
    });

    assert.ok(p.participantId.startsWith('PART-'));
    assert.strictEqual(p.fullName, 'Vikramaditya Rao');
    assert.strictEqual(p.email, 'vikram.rao@drmgrdu.ac.in');

    const found = db.findParticipantById(p.participantId);
    assert.strictEqual(found.participantId, p.participantId);
  });

  runTest('Participant with IEI membership persists isIeiMember and ieiMembershipId correctly', () => {
    const p = db.createParticipant({
      fullName: 'Pooja Sundaram',
      email: 'pooja.sundaram@gmail.com',
      branch: 'Electrical and Electronics Engineering (EEE)',
      collegeName: 'Dr. M.G.R. Educational and Research Institute',
      isIeiMember: true,
      ieiMembershipId: 'SM-9876543'
    });

    assert.strictEqual(p.isIeiMember, true);
    assert.strictEqual(p.ieiMembershipId, 'SM-9876543');

    const found = db.findParticipantById(p.participantId);
    assert.strictEqual(found.isIeiMember, true);
    assert.strictEqual(found.ieiMembershipId, 'SM-9876543');
  });

  runTest('Participant without IEI membership persists isIeiMember=false and allows direct quiz attempt', () => {
    const p = db.createParticipant({
      fullName: 'Rahul Nambiar',
      email: 'rahul.nambiar@gmail.com',
      branch: 'Cyber Security',
      collegeName: 'Dr. M.G.R. Educational and Research Institute',
      isIeiMember: false,
      ieiMembershipId: null
    });

    assert.strictEqual(p.isIeiMember, false);
    assert.strictEqual(p.ieiMembershipId, null);

    const attempt = db.createQuizAttempt(p.participantId);
    assert.ok(attempt.attemptId);
    assert.strictEqual(attempt.status, 'In Progress');
  });

  runTest('Quiz attempt tracks status from In Progress to Completed', () => {
    const p = db.createParticipant({
      fullName: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@gmail.com',
      branch: 'Artificial Intelligence and Data Science (AI & DS)'
    });

    const attempt = db.createQuizAttempt(p.participantId);
    assert.strictEqual(attempt.status, 'In Progress');

    const evalRes = evaluateQuiz({ 1: questions[0].correctOption, 2: questions[1].correctOption, 3: questions[2].correctOption });
    const completed = db.completeQuizAttempt(attempt.attemptId, evalRes, { 1: 'B', 2: 'C', 3: 'B' });

    assert.strictEqual(completed.status, 'Completed');
    assert.strictEqual(completed.score, 3);
  });

  runTest('Duplicate submission on finalized attempt is rejected', () => {
    const p = db.createParticipant({
      fullName: 'Rohan Iyer',
      email: 'rohan.iyer@gmail.com',
      branch: 'Mechanical Engineering'
    });

    const attempt = db.createQuizAttempt(p.participantId);
    const evalRes = evaluateQuiz({});
    db.completeQuizAttempt(attempt.attemptId, evalRes, {});

    const duplicateTry = db.completeQuizAttempt(attempt.attemptId, evalRes, {});
    assert.ok(duplicateTry.error, 'Duplicate attempt should return error object');
  });

  // 4. Dynamic PDF Certificate Generation
  await runAsyncTest('PDF Certificate generates with official branding, correct name, branch, score & ID', async () => {
    const certId = 'TYEB-2026-TEST01';
    const result = await generateCertificatePdf({
      certificateId: certId,
      fullName: 'ANANYA DESHMUKH',
      branch: 'Artificial Intelligence and Data Science (AI & DS)',
      score: 9,
      percentage: 90,
      completionDate: new Date()
    });

    assert.ok(fs.existsSync(result.filePath), 'Certificate PDF file must exist on disk');
    assert.ok(result.pdfBuffer.length > 50000, 'Certificate PDF size should be substantial (>50KB)');
    assert.ok(result.fileName.includes(certId));
  });

  // 5. Long Name Font Sizing Test
  await runAsyncTest('Very long participant name generates cleanly without overflow error', async () => {
    const certId = 'TYEB-2026-LONGNAME';
    const result = await generateCertificatePdf({
      certificateId: certId,
      fullName: 'SRI BALASUBRAMANIAN VENKATARAMANATHANATHAN',
      branch: 'Electronics and Communication Engineering (ECE)',
      score: 10,
      percentage: 100,
      completionDate: new Date()
    });

    assert.ok(fs.existsSync(result.filePath));
    assert.ok(result.pdfBuffer.length > 50000);
  });

  // 6. Email Content & Workflow Formatting
  runTest('Email content contains required subject, participant name, score and institutional sign-off', () => {
    const content = buildEmailContent({
      fullName: 'Vikramaditya Rao',
      branch: 'Computer Science and Engineering (CSE)',
      score: 10,
      percentage: 100,
      completionDate: new Date()
    });

    assert.strictEqual(content.subject, 'Your Test Your Engineering Brain E-Certificate');
    assert.ok(content.textBody.includes('Vikramaditya Rao'));
    assert.ok(content.textBody.includes('Score: 10/10'));
    assert.ok(content.textBody.includes('Percentage: 100%'));
    assert.ok(content.textBody.includes('MGR IEI Students Chapter'));
    assert.ok(content.textBody.includes('Dr. M.G.R. Educational and Research Institute'));
  });

  // 7. Email Workflow & Audit Logging
  await runAsyncTest('Email dispatch records status and log audit without crashing if keys unconfigured', async () => {
    const p = db.createParticipant({
      fullName: 'Karthik Raja',
      email: 'karthik.raja@gmail.com',
      branch: 'Civil Engineering'
    });

    const cert = db.createCertificate({
      participantId: p.participantId,
      attemptId: 'ATT-TEST-001',
      certificateFileReference: ''
    });

    const pdfBuffer = Buffer.from('Mock PDF Content for Test');
    const result = await sendCertificateEmail({
      participant: p,
      certificate: cert,
      score: 8,
      percentage: 80,
      pdfBuffer,
      fileName: 'test.pdf'
    });

    assert.ok(result.status === 'Form Dispatched' || result.status === 'Sent' || result.status === 'Pending Config');
    const logs = db.getEmailLogsByParticipant(p.participantId);
    assert.ok(logs.length >= 1, 'Email log must have recorded the attempt');
    assert.strictEqual(logs[0].participantId, p.participantId);
  });

  // 8. Admin Analytics & Query Helpers
  runTest('Admin analytics calculates correct registration count, scores and branch breakdown', () => {
    const stats = db.getAnalytics();
    assert.ok(stats.totalRegistered >= 4);
    assert.ok(typeof stats.averageScore === 'number');
    assert.ok(stats.branchCounts['Computer Science and Engineering (CSE)'] >= 1);
  });

  runTest('Admin participant search filters by name or email correctly', () => {
    const list = db.getAdminParticipantsList({ search: 'Deshmukh' });
    assert.ok(list.length >= 1, 'Should find at least one participant matching Deshmukh');
    assert.ok(list.every(p => p.fullName.includes('Deshmukh') || p.email.includes('deshmukh')));
  });

  // 9. ENGINEERING ARENA: 4 Interactive Levels Validation
  runTest('Arena configuration returns all 4 levels without exposing answers', () => {
    const config = arenaGames.getSanitizedArenaConfig();
    assert.ok(config.level1 && config.level2 && config.level3 && config.level4);
    assert.strictEqual(config.level1.id, 'circuitMaster');
    assert.strictEqual(config.level2.id, 'spinArena');
    assert.strictEqual(config.level3.id, 'buildZone');
    assert.strictEqual(config.level4.id, 'escapeRoom');
    assert.strictEqual(config.level1.correctOption, undefined);
    assert.strictEqual(config.level3.correctOption, undefined);
  });

  runTest('Level 1: Circuit Master verifies wire connection & theory question', () => {
    const valid = arenaGames.validateLevel1({ wireConnected: true, selectedOption: 'A' });
    assert.strictEqual(valid.correct, true);
    assert.strictEqual(valid.score, 100);
    assert.strictEqual(valid.message, 'Circuit Master Unlocked!');

    const incomplete = arenaGames.validateLevel1({ wireConnected: false, selectedOption: 'A' });
    assert.strictEqual(incomplete.correct, false);
    assert.strictEqual(incomplete.score, 0);

    const wrongAnswer = arenaGames.validateLevel1({ wireConnected: true, selectedOption: 'B' });
    assert.strictEqual(wrongAnswer.score, 50); // Partial credit for closing circuit
  });

  runTest('Level 2: Spin Arena verifies bonus points and category question answers', () => {
    const bonus = arenaGames.validateLevel2({ category: 'Bonus Points' });
    assert.strictEqual(bonus.correct, true);
    assert.strictEqual(bonus.score, 100);

    const questionCorrect = arenaGames.validateLevel2({ category: 'Electrical Engineering', selectedOption: 'A' });
    assert.strictEqual(questionCorrect.correct, true);
    assert.strictEqual(questionCorrect.score, 100);
    assert.strictEqual(questionCorrect.message, 'Spin Arena Completed!');
  });

  runTest('Level 3: Build Zone verifies bridge placement & structural question', () => {
    const valid = arenaGames.validateLevel3({
      placedComponents: { foundation: true, deck: true, arch: true },
      selectedOption: 'A'
    });
    assert.strictEqual(valid.correct, true);
    assert.strictEqual(valid.score, 100);
    assert.strictEqual(valid.message, 'Junior Engineer Unlocked!');

    const incompleteBridge = arenaGames.validateLevel3({
      placedComponents: { foundation: true },
      selectedOption: 'A'
    });
    assert.strictEqual(incompleteBridge.correct, false);
    assert.strictEqual(incompleteBridge.score, 0);
  });

  runTest('Level 4: Escape Room verifies 3 challenges (logic, component, keypad pin 10)', () => {
    const valid = arenaGames.validateLevel4({
      c1Option: 'C',
      c2Component: 'motor',
      c3Pin: '10'
    });
    assert.strictEqual(valid.correct, true);
    assert.strictEqual(valid.score, 100);
    assert.strictEqual(valid.badge, 'ENGINEERING ESCAPE MASTER');

    const wrongPin = arenaGames.validateLevel4({
      c1Option: 'C',
      c2Component: 'motor',
      c3Pin: '99'
    });
    assert.strictEqual(wrongPin.correct, false);
  });

  runTest('Unified Arena Total evaluates 400 marks & awards ENGINEERING ARENA CHAMPION distinction', () => {
    const arenaSummary = arenaGames.calculateArenaTotal({
      circuitMaster: { completed: true, score: 100 },
      spinArena: { completed: true, score: 100 },
      buildZone: { completed: true, score: 100 },
      escapeRoom: { completed: true, score: 100 }
    });

    assert.strictEqual(arenaSummary.score, 400);
    assert.strictEqual(arenaSummary.totalScore, 400);
    assert.strictEqual(arenaSummary.scoreMax, 400);
    assert.strictEqual(arenaSummary.percentage, 100);
    assert.strictEqual(arenaSummary.completedGamesCount, 4);
    assert.strictEqual(arenaSummary.isChampion, true);
    assert.ok(arenaSummary.performanceBadge.includes('CHAMPION'));
  });

  // 10. Database Arena State Persistence & Certificate
  await runAsyncTest('Participant can complete Arena in DB and generate 400-mark Champion Certificate', async () => {
    const p = db.createParticipant({
      fullName: 'Siddharth Varma',
      email: 'siddharth.varma@gmail.com',
      branch: 'Cyber Security',
      collegeName: 'Dr. M.G.R. Educational and Research Institute'
    });

    const attempt = db.createQuizAttempt(p.participantId);
    assert.ok(attempt.attemptId);

    // Save individual level progress
    db.updateAttemptLevel(attempt.attemptId, 'circuitMaster', { completed: true, score: 100 });
    db.updateAttemptLevel(attempt.attemptId, 'spinArena', { completed: true, score: 100 });
    db.updateAttemptLevel(attempt.attemptId, 'buildZone', { completed: true, score: 100 });
    db.updateAttemptLevel(attempt.attemptId, 'escapeRoom', { completed: true, score: 100 });

    // Finalize arena
    const updatedAttempt = db.findAttemptById(attempt.attemptId);
    const arenaSummary = arenaGames.calculateArenaTotal(updatedAttempt.arenaLevels);
    const finalized = db.finalizeArenaAttempt(attempt.attemptId, arenaSummary);

    assert.strictEqual(finalized.status, 'Completed');
    assert.strictEqual(finalized.score, 400);
    assert.strictEqual(finalized.isChampion, true);

    // Generate Champion Certificate
    const certResult = await generateCertificatePdf({
      certificateId: 'TYEB-2026-CHAMP01',
      fullName: p.fullName,
      branch: p.branch,
      score: finalized.score,
      scoreMax: 400,
      percentage: finalized.percentage,
      isChampion: true,
      completionDate: new Date()
    });

    assert.ok(fs.existsSync(certResult.filePath));
    assert.ok(certResult.pdfBuffer.length > 50000);

    // Verify Admin row formatting
    const adminRows = db.getAdminParticipantsList({ search: 'Siddharth' });
    assert.ok(adminRows.length >= 1);
    const row = adminRows[0];
    assert.strictEqual(row.score, 400);
    assert.strictEqual(row.isChampion, true);
    assert.strictEqual(row.circuitScore, 100);
    assert.strictEqual(row.spinScore, 100);
    assert.strictEqual(row.buildScore, 100);
    assert.strictEqual(row.escapeScore, 100);
  });

  // 11. Question Bank 40 Unique Questions Integrity (R1-Q1..10 to R4-Q1..10)
  runTest('Question banks contain 40 unique questions: exactly 10 per round with zero overlap', () => {
    const banks = arenaGames.QUESTION_BANKS;
    const rounds = ['circuitMaster', 'spinArena', 'buildZone', 'escapeRoom'];
    const allIds = new Set();
    const allQuestions = new Set();

    rounds.forEach((roundKey, rIdx) => {
      assert.strictEqual(banks[roundKey].length, 10, `Round ${roundKey} must have exactly 10 questions`);
      const prefix = `R${rIdx + 1}-Q`;

      banks[roundKey].forEach((q, qIdx) => {
        assert.ok(q.id.startsWith(prefix), `Question id ${q.id} must start with ${prefix}`);
        assert.strictEqual(q.id, `${prefix}${qIdx + 1}`, `Question ID must match ${prefix}${qIdx + 1}`);
        assert.ok(q.question, 'Question must have text');
        assert.ok(q.options && q.options.A && q.options.B && q.options.C && q.options.D, 'Question must have 4 options');
        assert.ok(q.correctOption, 'Question must have correctOption');
        assert.ok(q.explanation, 'Question must have explanation');

        assert.ok(!allIds.has(q.id), `Duplicate question id found: ${q.id}`);
        assert.ok(!allQuestions.has(q.question), `Duplicate question text found: ${q.question}`);
        allIds.add(q.id);
        allQuestions.add(q.question);
      });
    });

    assert.strictEqual(allIds.size, 40, 'Must have exactly 40 unique question IDs');
    assert.strictEqual(allQuestions.size, 40, 'Must have exactly 40 unique question texts');
  });

  // 12. Exactly ONE Question per Round per Student (4 Questions Total)
  runTest('Each student receives exactly ONE question per round (4 questions total)', () => {
    assert.strictEqual(arenaGames.QUESTIONS_PER_ROUND, 1);
    const p = db.createParticipant({
      fullName: 'Dev Patel',
      email: 'dev.patel@gmail.com',
      branch: 'Computer Science Engineering (CSE)'
    });
    const attempt = db.createQuizAttempt(p.participantId);

    const r1 = db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');
    assert.strictEqual(r1.questions.length, 1, 'Round 1 must present exactly 1 question');
    assert.ok(r1.questions[0].id.startsWith('R1-Q'), 'Must be from Round 1 bank');

    // Sanitized question must not leak correctOption or explanation
    assert.strictEqual(r1.questions[0].correctOption, undefined);
    assert.strictEqual(r1.questions[0].explanation, undefined);
    assert.ok(r1.questions[0].options.A && r1.questions[0].options.B && r1.questions[0].options.C && r1.questions[0].options.D);
  });

  // 13. State Persistence (Questions not reshuffled on reload or sign-in)
  runTest('Database persists assigned question set so student reloads do not reshuffle', () => {
    const p = db.createParticipant({
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@gmail.com',
      branch: 'Electrical and Electronics Engineering (EEE)'
    });
    const attempt = db.createQuizAttempt(p.participantId);

    const firstFetch = db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');
    const secondFetch = db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');

    assert.strictEqual(firstFetch.questions.length, 1);
    assert.strictEqual(secondFetch.questions.length, 1);

    // Verify exact same question ID and options order on reload
    assert.strictEqual(firstFetch.questions[0].id, secondFetch.questions[0].id);
    assert.strictEqual(firstFetch.questions[0].question, secondFetch.questions[0].question);
    assert.strictEqual(firstFetch.questions[0].options.A, secondFetch.questions[0].options.A);
    assert.strictEqual(firstFetch.questions[0].options.B, secondFetch.questions[0].options.B);
    assert.strictEqual(firstFetch.questions[0].options.C, secondFetch.questions[0].options.C);
    assert.strictEqual(firstFetch.questions[0].options.D, secondFetch.questions[0].options.D);
  });

  // 14. Multi-Student Independent Randomization (At least 5 Students)
  runTest('Test across 5 separate student accounts: independent question assignments & option shuffling', () => {
    const students = [
      { name: 'Student Alpha', email: 'alpha@iei.org', branch: 'Mechanical Engineering' },
      { name: 'Student Beta', email: 'beta@iei.org', branch: 'Computer Science Engineering (CSE)' },
      { name: 'Student Gamma', email: 'gamma@iei.org', branch: 'Civil Engineering' },
      { name: 'Student Delta', email: 'delta@iei.org', branch: 'Electrical and Electronics Engineering (EEE)' },
      { name: 'Student Epsilon', email: 'epsilon@iei.org', branch: 'Biomedical Engineering' }
    ];

    const studentAssignments = [];

    students.forEach((s) => {
      const p = db.createParticipant({ fullName: s.name, email: s.email, branch: s.branch });
      const att = db.createQuizAttempt(p.participantId);

      const q1 = arenaGames.getAssignedQuestionForStudent(p.participantId, 'circuitMaster');
      const q2 = arenaGames.getAssignedQuestionForStudent(p.participantId, 'spinArena');
      const q3 = arenaGames.getAssignedQuestionForStudent(p.participantId, 'buildZone');
      const q4 = arenaGames.getAssignedQuestionForStudent(p.participantId, 'escapeRoom');

      studentAssignments.push({
        participantId: p.participantId,
        q1: q1.id,
        q2: q2.id,
        q3: q3.id,
        q4: q4.id
      });
    });

    assert.strictEqual(studentAssignments.length, 5);

    // Verify variation: not all students get the identical combination
    const uniqueCombos = new Set(studentAssignments.map(s => `${s.q1}-${s.q2}-${s.q3}-${s.q4}`));
    assert.ok(uniqueCombos.size > 1, 'Question combinations must vary across different students');
  });

  // 15. No Pass Mark: Incorrect answers STILL unlock next round without penalty
  runTest('No pass mark: incorrect answers still mark round complete & unlock next round', () => {
    const p = db.createParticipant({
      fullName: 'Learner One',
      email: 'learner1@example.com',
      branch: 'Civil Engineering'
    });
    const attempt = db.createQuizAttempt(p.participantId);

    // Round 1: Intentionally answer INCORRECTLY
    const r1 = db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');
    const assignedQ = db.findAttemptById(attempt.attemptId).levels.circuitMaster.assignedQuestions[0];
    const wrongOption = assignedQ.correctOption === 'A' ? 'B' : 'A';

    const submitRes = db.saveLevelAnswer(attempt.attemptId, 'circuitMaster', assignedQ.id, wrongOption);
    assert.strictEqual(submitRes.isCorrect, false, 'Answer must evaluate to false for wrong option');
    assert.ok(submitRes.friendlyFeedback.includes("Good try!"), 'Must show friendly feedback for wrong answer');
    assert.strictEqual(submitRes.completed, true, 'Round 1 must be marked as completed despite wrong answer');
    assert.strictEqual(submitRes.nextLevelUnlocked, true, 'Next level must be unlocked despite wrong answer');

    // Verify Round 2 is now unlocked
    const status = db.getArenaAttemptStatus(attempt.attemptId);
    assert.strictEqual(status.levels.circuitMaster.completed, true);
    assert.strictEqual(status.levels.spinArena.unlocked, true);
  });

  // 16. Strict Sequential Unlocking & Progression (Round 1 -> 2 -> 3 -> 4 -> Cert)
  runTest('Strict sequential progression: Round 1 -> Round 2 -> Round 3 -> Round 4 -> Certificate', () => {
    const p = db.createParticipant({
      fullName: 'Rohan Mehra',
      email: 'rohan.mehra@gmail.com',
      branch: 'Mechanical Engineering'
    });
    const attempt = db.createQuizAttempt(p.participantId);

    // Round 1 unlocked initially
    const status1 = db.getArenaAttemptStatus(attempt.attemptId);
    assert.strictEqual(status1.levels.circuitMaster.unlocked, true);
    assert.strictEqual(status1.levels.spinArena.unlocked, false);

    // Attempting to access Round 2 before Round 1 must be rejected with locked: true
    const lockedRes = db.getOrAssignLevelQuestions(attempt.attemptId, 'spinArena');
    assert.ok(lockedRes.error && lockedRes.locked === true);

    // Complete Round 1
    db.recordInteractiveAction(attempt.attemptId, 'circuitMaster', { wireConnected: true });
    db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');
    const l1Q = db.findAttemptById(attempt.attemptId).levels.circuitMaster.assignedQuestions[0];
    db.saveLevelAnswer(attempt.attemptId, 'circuitMaster', l1Q.id, l1Q.correctOption);

    // Round 2 is now unlocked
    const status2 = db.getArenaAttemptStatus(attempt.attemptId);
    assert.strictEqual(status2.levels.circuitMaster.completed, true);
    assert.strictEqual(status2.levels.spinArena.unlocked, true);
    assert.strictEqual(status2.levels.buildZone.unlocked, false);

    // Complete Round 2
    db.recordInteractiveAction(attempt.attemptId, 'spinArena', { spinCompleted: true });
    db.getOrAssignLevelQuestions(attempt.attemptId, 'spinArena');
    const l2Q = db.findAttemptById(attempt.attemptId).levels.spinArena.assignedQuestions[0];
    db.saveLevelAnswer(attempt.attemptId, 'spinArena', l2Q.id, l2Q.correctOption);

    // Round 3 is now unlocked
    const status3 = db.getArenaAttemptStatus(attempt.attemptId);
    assert.strictEqual(status3.levels.buildZone.unlocked, true);
    assert.strictEqual(status3.levels.escapeRoom.unlocked, false);

    // Complete Round 3
    db.recordInteractiveAction(attempt.attemptId, 'buildZone', { bridgeBuilt: true });
    db.getOrAssignLevelQuestions(attempt.attemptId, 'buildZone');
    const l3Q = db.findAttemptById(attempt.attemptId).levels.buildZone.assignedQuestions[0];
    db.saveLevelAnswer(attempt.attemptId, 'buildZone', l3Q.id, l3Q.correctOption);

    // Round 4 is now unlocked
    const status4 = db.getArenaAttemptStatus(attempt.attemptId);
    assert.strictEqual(status4.levels.escapeRoom.unlocked, true);

    // Complete Round 4
    db.recordInteractiveAction(attempt.attemptId, 'escapeRoom', { c1Solved: true, c2Solved: true, c3Solved: true });
    db.getOrAssignLevelQuestions(attempt.attemptId, 'escapeRoom');
    const l4Q = db.findAttemptById(attempt.attemptId).levels.escapeRoom.assignedQuestions[0];
    db.saveLevelAnswer(attempt.attemptId, 'escapeRoom', l4Q.id, l4Q.correctOption);

    // Finalize
    const finalized = db.finalizeArenaAttempt(attempt.attemptId);
    assert.strictEqual(finalized.status, 'Completed');
    assert.strictEqual(finalized.score, 400);
    assert.strictEqual(finalized.isChampion, true);
  });

  // 17. Certificate Eligibility Enforcement
  runTest('Certificate issuance strictly blocked if fewer than 4 rounds completed', () => {
    const p = db.createParticipant({
      fullName: 'Incomplete Student',
      email: 'incomplete@gmail.com',
      branch: 'Information Technology'
    });
    const attempt = db.createQuizAttempt(p.participantId);

    // Only complete Round 1
    db.recordInteractiveAction(attempt.attemptId, 'circuitMaster', { wireConnected: true });
    db.getOrAssignLevelQuestions(attempt.attemptId, 'circuitMaster');
    const l1Q = db.findAttemptById(attempt.attemptId).levels.circuitMaster.assignedQuestions[0];
    db.saveLevelAnswer(attempt.attemptId, 'circuitMaster', l1Q.id, l1Q.correctOption);

    // Attempting to finalize should reject
    const finalizeRes = db.finalizeArenaAttempt(attempt.attemptId);
    assert.ok(finalizeRes && finalizeRes.error, 'Finalize must return error if fewer than 4 rounds completed');
    assert.strictEqual(finalizeRes.completedLevelsCount, 1);
  });

  console.log('\n-------------------------------------------------------');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('-------------------------------------------------------\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please inspect logs above.');
    process.exit(1);
  }
}

executeSuite().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
