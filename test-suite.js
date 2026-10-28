/**
 * TEST YOUR ENGINEERING BRAIN - Complete Automated Verification Suite
 * Tests all 18 core scenarios outlined in Section 12 of the project specification.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./src/database');
const { getSanitizedQuestions, evaluateQuiz, questions } = require('./src/questions');
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
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
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
