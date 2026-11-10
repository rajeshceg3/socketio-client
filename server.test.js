const Client = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createClickTracker } = require('./server');

// Tests drive the real server factory with real socket.io clients.

describe('Click tracker server', () => {
  let tracker, port, tmpFile;
  const clients = [];

  function connect() {
    const c = Client(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    clients.push(c);
    return c;
  }

  beforeEach((done) => {
    tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'clicks-')), 'count.json');
    tracker = createClickTracker({ clickCountFile: tmpFile });
    tracker.server.listen(0, () => {
      port = tracker.server.address().port;
      done();
    });
  });

  afterEach((done) => {
    clients.forEach((c) => c.close());
    clients.length = 0;
    tracker.io.close();
    tracker.server.close(() => done());
  });

  test('client connects and receives the current count', (done) => {
    const c = connect();
    c.on('updateCount', (count) => {
      expect(count).toBe(0);
      done();
    });
  });

  test('buttonClicked increments and broadcasts the new count', (done) => {
    const c = connect();
    let seen = [];
    c.on('updateCount', (count) => {
      seen.push(count);
      if (seen.length === 3) {
        expect(seen).toEqual([0, 1, 2]);
        done();
      }
    });
    c.on('connect', () => {
      c.emit('buttonClicked');
      c.emit('buttonClicked');
    });
  });

  test('a second client sees broadcasts from the first', (done) => {
    const a = connect();
    const b = connect();
    let bInitial = false;
    a.on('connect', () => a.emit('buttonClicked'));
    b.on('updateCount', (count) => {
      if (count === 0) bInitial = true;
      if (count === 1) {
        expect(bInitial).toBe(true);
        done();
      }
    });
  });

  test('click count persists to the count file', (done) => {
    const c = connect();
    c.on('updateCount', (count) => {
      if (count === 1) {
        const saved = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
        expect(saved.count).toBe(1);
        done();
      }
    });
    c.on('connect', () => c.emit('buttonClicked'));
  });

  test('a new instance restores the persisted count', (done) => {
    fs.writeFileSync(tmpFile, JSON.stringify({ count: 41 }));
    const second = createClickTracker({ clickCountFile: tmpFile });
    second.server.listen(0, () => {
      const c = Client(`http://127.0.0.1:${second.server.address().port}`, { transports: ['websocket'] });
      c.on('updateCount', (count) => {
        expect(count).toBe(41);
        c.close();
        second.io.close();
        second.server.close(() => done());
      });
    });
  });
});
