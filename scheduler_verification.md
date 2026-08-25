# Managed Refresh Verification Attempt

On 2026-08-24 UTC, the deployed `/api/scheduled/streamwise-refresh` callback was verified to have a durable matching `scheduledJobs.scheduleCronTaskUid` before managed execution was attempted.

A controlled, short-lived every-minute Heartbeat was created and temporarily made the persisted callback identity. The platform produced no execution record during the observation window (`runs: []`), so no claim is made that the managed platform invoked the callback or returned `catalogConfigured: false`. The handler’s no-token, orphan, and wrong-identity behavior remains covered by focused tests.

The temporary verification job and a stale pre-existing job were deleted. A fresh enabled daily Heartbeat named `streamwise-opt-in-refresh-daily-20260824` now owns the persisted callback identity `g4LWHU9zMwiNtvRLKVJN2x`; the database and `manus-heartbeat list` were checked for that alignment. Successful live execution remains an open operational verification item.

## Follow-up audit

Later on 2026-08-24 UTC, `manus-heartbeat list` again showed exactly that one enabled daily task with `POST /api/scheduled/streamwise-refresh` and cron `0 15 3 * * *` UTC. Its logs still returned `runs: []`, consistent with a newly created daily job that has not reached its first scheduled trigger. No heartbeat definition or database identity was changed during this audit.

## Successful live callback

On 2026-08-25 UTC, the first natural daily execution for persisted task `g4LWHU9zMwiNtvRLKVJN2x` completed successfully. The platform recorded run `gEWXycVdsvzc4vA79qeCy6` at `2026-08-25T03:23:12Z`, returning HTTP `200` after `4572ms`. Its authenticated callback response was `{"ok":true,"usersProcessed":0,"catalogConfigured":false,"refreshedTitles":0,"changedTitles":0}`, confirming the deployed handler accepts the persisted cron identity and accurately reports the absent catalog credential without inventing a refresh result. No heartbeat definition or database identity was changed during this audit.
