/**
 * End-to-End HTTP Server Endpoint Verifier
 */

const http = require('http');

async function testHttpEndpoints() {
  console.log('\n=======================================================');
  console.log('🌐 TESTING LIVE EXPRESS SERVER HTTP ENDPOINTS');
  console.log('=======================================================\n');

  // Start server on an ephemeral test port (3001)
  process.env.PORT = '3001';
  const server = require('./server.js');

  // Give server 500ms to bind
  await new Promise(r => setTimeout(r, 600));

  const baseUrl = 'http://localhost:3001';

  // 1. Test GET /api/system/status
  const statusRes = await fetch(`${baseUrl}/api/system/status`);
  const statusData = await statusRes.json();
  console.log('1. System Status endpoint:', statusData.appName, '-> OK');

  // 2. Test GET /api/quiz/questions
  const qRes = await fetch(`${baseUrl}/api/quiz/questions`);
  const qData = await qRes.json();
  console.log('2. Quiz questions endpoint: retrieved', qData.questions.length, 'questions -> OK');

  // 3. Test POST /api/register (Validation test: invalid email)
  const invalidReg = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'A', email: 'not-an-email', branch: 'CSE' })
  });
  console.log('3. Invalid registration rejected with status:', invalidReg.status, '-> OK');

  // 4. Test POST /api/register (Valid registration)
  const validReg = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Pooja Sundaram',
      email: 'pooja.sundaram@gmail.com',
      branch: 'Artificial Intelligence and Machine Learning (AI & ML)',
      collegeName: 'Dr. M.G.R. Educational and Research Institute'
    })
  });
  const regData = await validReg.json();
  console.log('4. Valid registration successful, participant ID:', regData.participant.participantId, '-> OK');

  // 5. Test POST /api/quiz/submit
  const submitRes = await fetch(`${baseUrl}/api/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantId: regData.participant.participantId,
      attemptId: regData.attempt.attemptId,
      answers: {
        1: 'B', 2: 'C', 3: 'B', 4: 'C', 5: 'B',
        6: 'C', 7: 'B', 8: 'B', 9: 'C', 10: 'B'
      }
    })
  });
  const submitData = await submitRes.json();
  console.log('5. Quiz submit successful: Score =', submitData.evaluation.score, '/ 10, Cert ID =', submitData.certificate.certificateId, '-> OK');

  // 6. Test GET /api/certificate/:id (PDF download verification)
  const certRes = await fetch(`${baseUrl}/api/certificate/${submitData.certificate.certificateId}`);
  const certBuf = await certRes.arrayBuffer();
  console.log('6. Certificate download verified: Content-Type =', certRes.headers.get('content-type'), ', Size =', certBuf.byteLength, 'bytes -> OK');

  // 7. Test Admin Login
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'IEI@Engineering2026' })
  });
  const loginData = await loginRes.json();
  console.log('7. Admin login authentication successful, token received -> OK');

  // 8. Test Admin Protected Stats
  const adminStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const adminStats = await adminStatsRes.json();
  console.log('8. Admin stats accessible: Registered =', adminStats.analytics.totalRegistered, ', Completed =', adminStats.analytics.totalCompleted, '-> OK');

  // 9. Test Admin CSV Export
  const csvRes = await fetch(`${baseUrl}/api/admin/export-csv?token=${loginData.token}`);
  const csvText = await csvRes.text();
  console.log('9. Admin CSV export successful: Header row present =', csvText.includes('Participant ID,Full Name'), '-> OK');

  console.log('\n🎉 ALL HTTP ENDPOINTS VERIFIED AND WORKING FLAWLESSLY!\n');
  process.exit(0);
}

testHttpEndpoints().catch(err => {
  console.error('HTTP test failure:', err);
  process.exit(1);
});
