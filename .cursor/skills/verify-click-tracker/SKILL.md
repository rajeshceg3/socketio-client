---
name: verify-click-tracker
description: "Verify socketio-client's real-time click counter (join sync, broadcast, persistence) with isolated local processes and recorded evidence. Use before reporting behavior changes complete."
---

# Verify socketio-client

Generated from source interview following pstack create-verification-skill. Read features/README.md first.

## Launch

From the repository root run `npm install --ignore-scripts`, then the unit
suite `npx jest`, then `node .cursor/skills/verify-click-tracker/verify.cjs`.
Node 18+ required (developed on Node 22). The verify helper picks its own
free port and a disposable count file (override with VERIFY_EVIDENCE_DIR;
the app reads PORT and CLICK_COUNT_FILE).

## Doctor

The helper confirms its own child answers the Socket.IO handshake before
driving. A TCP listener alone is not success. After a surprising failure,
clean up and rerun from a fresh instance.

## Drive

Run `node .cursor/skills/verify-click-tracker/verify.cjs`. It drives two
independent clients over Engine.IO polling: join sync, click broadcasts in
both directions, and the persisted count file. The static React surface is
checked when my-app/build exists and flagged honestly when it does not.

## Evidence

Default location is a unique /tmp/verify-click-tracker- directory, printed
at exit. evidence.json records each action, response/status, assertions,
findings and cleanup; server.log captures the child output. One passing
path never means the whole map passed; check FAILURES=0.

## Cleanup

The helper signals only the process it created, escalates only on its own
child and preserves evidence. Confirm cleaned:true. Count files are
disposable.

## Helpers

`node .cursor/skills/verify-click-tracker/verify.cjs` is self-contained
(stdlib only). server.js exports createClickTracker so tests and this
helper never fight over a port or a count file.

## Maintenance

After behavior changes use /maintain-verification-skill: reconcile every
mapped feature with source and exercise each live; report unreachable
prerequisites and product regressions rather than editing the map to hide
them.
