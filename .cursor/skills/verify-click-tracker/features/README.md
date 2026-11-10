# Feature map: socketio-client (Real-Time Click Tracker)

Purpose (from PRODUCT_REQUIREMENTS.md): one shared click counter; any client
clicks, every connected client sees the new total in real time; the count
persists across restarts via clickCount.json. React client in my-app/ is
served statically when built.

## Exercised by server.test.js (jest, real server factory + real clients)

| Behavior | What is proven |
|---|---|
| Initial sync | a connecting client receives the current count |
| Click | buttonClicked increments and broadcasts updateCount |
| Multi-client | a second client sees the first client's clicks |
| Persistence | the count file is written on each click |
| Restore | a new instance restores the persisted count |

## Exercised by verify.cjs (spawned real server, Engine.IO polling)

| Behavior | What is proven |
|---|---|
| Two independent clients | initial sync, clicks broadcast both ways, count file |
| Static client | served when my-app/build exists; honestly flagged when absent |

## Known boundaries (honest scope)

- clickCount.json is the whole persistence story; single-process demo.
- No auth, no rate limiting: a learning example, per the PRD's audience.
- The React build is a pre-deploy step; it is not committed.
