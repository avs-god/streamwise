import type { Request, Response } from "express";
import { getOptedInRefreshUserIds, getScheduledJobByTaskUid } from "./db";
import { syncRenewalAlerts } from "./alertService";
import { refreshTrackedTitlesForUser } from "./trackingService";
import { isCatalogConfigured } from "./catalog";
import { sdk } from "./_core/sdk";

export const STREAMWISE_REFRESH_JOB_KEY = "streamwise-opt-in-refresh";

export async function runOptInRefreshBatch() {
  const users = await getOptedInRefreshUserIds();
  const catalogConfigured = isCatalogConfigured();
  let refreshedTitles = 0;
  let changedTitles = 0;
  for (const user of users) {
    await syncRenewalAlerts(user.id);
    if (catalogConfigured) {
      const result = await refreshTrackedTitlesForUser(user.id, "en-US");
      refreshedTitles += result.checked;
      changedTitles += result.changed;
    }
  }
  return { usersProcessed: users.length, catalogConfigured, refreshedTitles, changedTitles };
}

export async function streamwiseRefreshHandler(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    const job = await getScheduledJobByTaskUid(cronUser.taskUid);
    if (!job || job.jobKey !== STREAMWISE_REFRESH_JOB_KEY) return res.status(403).json({ error: "unrecognized-cron" });
    const result = await runOptInRefreshBatch();
    return res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled-refresh-failed", timestamp: new Date().toISOString() });
  }
}
