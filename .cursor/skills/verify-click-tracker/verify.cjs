// verify-click-tracker: isolated local verification for socketio-client.
// Spawns the real server with a disposable count file, drives the
// Socket.IO click surface over Engine.IO polling, records evidence,
// cleans up only its own children.
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE_DIR = process.env.VERIFY_EVIDENCE_DIR || fs.mkdtempSync('/tmp/verify-click-tracker-');
const evidence = { repo: 'socketio-client', started_at: new Date().toISOString(),
  actions: [], findings: [], boundaries: ['local processes only', 'disposable count file', 'no external services'],
  cleaned: false };
let failures = 0;
let PORT = null;

function record(action, ok, detail) {
  evidence.actions.push({ at: new Date().toISOString(), action, ok, detail });
  if (!ok) failures++;
  console.log((ok ? 'PASS ' : 'FAIL ') + action + (detail ? ' :: ' + detail : ''));
}
function finding(note) { evidence.findings.push(note); console.log('FINDING ' + note); }
function req(method, p, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method,
      headers: body ? { 'Content-Type': 'text/plain;charset=UTF-8', 'Content-Length': Buffer.byteLength(body) } : {} },
      (res) => { let buf = ''; res.on('data', (c) => buf += c); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: buf })); });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}
function freePort() {
  return new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
}
async function eioHandshake() {
  const r = await req('GET', '/socket.io/?EIO=4&transport=polling');
  if (r.status !== 200 || r.body[0] !== '0') return { ok: false, detail: 'status ' + r.status };
  return { ok: true, sid: JSON.parse(r.body.slice(1)).sid };
}
const eioSend = (sid, packet) => req('POST', '/socket.io/?EIO=4&transport=polling&sid=' + sid, packet);
const eioPoll = (sid) => req('GET', '/socket.io/?EIO=4&transport=polling&sid=' + sid).then((r) => r.body);

let child = null, countFile = null;
function finish() {
  if (child && child.exitCode === null) { child.kill('SIGTERM'); setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL'); }, 1500); }
  setTimeout(() => {
    evidence.cleaned = !child || child.exitCode !== null;
    evidence.finished_at = new Date().toISOString();
    evidence.failures = failures;
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'evidence.json'), JSON.stringify(evidence, null, 1));
    console.log('EVIDENCE_DIR=' + EVIDENCE_DIR);
    console.log('FAILURES=' + failures);
    process.exit(failures ? 1 : 0);
  }, 2200);
}

(async () => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  PORT = await freePort();
  countFile = path.join(fs.mkdtempSync('/tmp/click-count-'), 'count.json');
  const logStream = fs.createWriteStream(path.join(EVIDENCE_DIR, 'server.log'));
  child = spawn('node', ['server.js'], { cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), CLICK_COUNT_FILE: countFile }),
    stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(logStream); child.stderr.pipe(logStream);
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) break;
      try { const r = await req('GET', '/socket.io/?EIO=4&transport=polling'); if (r.status === 200) { ready = true; break; } } catch (e) {}
      await new Promise((r2) => setTimeout(r2, 500));
    }
    record('launch: own child socket endpoint usable', ready);
    if (!ready) { finish(); return; }

    // client 1 connects: handshake, socket.io connect, initial count
    const hs1 = await eioHandshake();
    record('client 1 EIO4 handshake', hs1.ok, hs1.detail || '');
    await eioSend(hs1.sid, '40{}');
    await new Promise((r) => setTimeout(r, 500));
    let polled = await eioPoll(hs1.sid);
    record('client 1 receives initial count 0', polled.includes('42["updateCount",0]'), polled.slice(0, 120).replace(/\x1e/g, '|'));

    // client 1 clicks twice
    await eioSend(hs1.sid, '42["buttonClicked"]');
    await eioSend(hs1.sid, '42["buttonClicked"]');
    await new Promise((r) => setTimeout(r, 700));
    polled = await eioPoll(hs1.sid);
    record('clicks broadcast updateCount 1 and 2', polled.includes('42["updateCount",1]') && polled.includes('42["updateCount",2]'), polled.slice(0, 160).replace(/\x1e/g, '|'));

    // persistence
    let saved = null;
    try { saved = JSON.parse(fs.readFileSync(countFile, 'utf8')); } catch (e) {}
    record('count persisted to count file', saved && saved.count === 2, saved ? 'count ' + saved.count : 'no file');

    // client 2 sees current count on join
    const hs2 = await eioHandshake();
    record('client 2 EIO4 handshake', hs2.ok, hs2.detail || '');
    await eioSend(hs2.sid, '40{}');
    await new Promise((r) => setTimeout(r, 500));
    polled = await eioPoll(hs2.sid);
    record('client 2 receives current count 2 on join', polled.includes('42["updateCount",2]'), polled.slice(0, 120).replace(/\x1e/g, '|'));

    // client 2 clicks, client 1 sees it
    await eioSend(hs2.sid, '42["buttonClicked"]');
    await new Promise((r) => setTimeout(r, 700));
    polled = await eioPoll(hs1.sid);
    record('client 1 sees client 2 click (count 3)', polled.includes('42["updateCount",3]'), polled.slice(0, 120).replace(/\x1e/g, '|'));

    // static surface
    const r = await req('GET', '/');
    const buildExists = fs.existsSync(path.join(ROOT, 'my-app', 'build', 'index.html'));
    if (buildExists) {
      record('GET / serves the built client', r.status === 200 && r.body.includes('<div id="root">'), 'status ' + r.status);
    } else {
      finding('my-app/build is absent, so GET / cannot serve the React client until `npm run build --prefix my-app` runs; socket surface verified without it.');
      record('static build absent noted (socket surface proven)', true);
    }
  } catch (e) {
    record('unhandled verification error', false, String(e && e.message || e));
  } finally {
    finish();
  }
})();
