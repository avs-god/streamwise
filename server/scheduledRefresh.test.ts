import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getOptedInRefreshUserIds: vi.fn(),
  getScheduledJobByTaskUid: vi.fn(),
}));
vi.mock("./alertService", () => ({ syncRenewalAlerts: vi.fn() }));
vi.mock("./trackingService", () => ({ refreshTrackedTitlesForUser: vi.fn() }));
vi.mock("./catalog", () => ({ isCatalogConfigured: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));

import { getOptedInRefreshUserIds, getScheduledJobByTaskUid } from "./db";
import { syncRenewalAlerts } from "./alertService";
import { refreshTrackedTitlesForUser } from "./trackingService";
import { isCatalogConfigured } from "./catalog";
import { sdk } from "./_core/sdk";
import { STREAMWISE_REFRESH_JOB_KEY, runOptInRefreshBatch, streamwiseRefreshHandler } from "./scheduledRefresh";

function responseDouble() {
  const result = { status: vi.fn(), json: vi.fn() };
  result.status.mockReturnValue(result);
  result.json.mockReturnValue(result);
  return result;
}

describe("scheduled Streamwise refresh", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs reminders but never attempts legal-title refreshes when no live catalog is configured", async () => {
    vi.mocked(getOptedInRefreshUserIds).mockResolvedValue([{ id: 11 }, { id: 12 }]);
    vi.mocked(isCatalogConfigured).mockReturnValue(false);

    await expect(runOptInRefreshBatch()).resolves.toEqual({ usersProcessed: 2, catalogConfigured: false, refreshedTitles: 0, changedTitles: 0 });
    expect(syncRenewalAlerts).toHaveBeenCalledTimes(2);
    expect(refreshTrackedTitlesForUser).not.toHaveBeenCalled();
  });

  it("accepts only the persisted Streamwise task and returns a safe no-op for an orphaned cron", async () => {
    const response = responseDouble();
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: true, taskUid: "orphan-task" } as never);
    vi.mocked(getScheduledJobByTaskUid).mockResolvedValue(undefined);

    await streamwiseRefreshHandler({} as never, response as never);
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ ok: true, skipped: "orphan-cron" });

    const unauthorizedResponse = responseDouble();
    vi.mocked(getScheduledJobByTaskUid).mockResolvedValue({ jobKey: "different-job" } as never);
    await streamwiseRefreshHandler({} as never, unauthorizedResponse as never);
    expect(unauthorizedResponse.status).toHaveBeenCalledWith(403);
    expect(unauthorizedResponse.json).toHaveBeenCalledWith({ error: "unrecognized-cron" });

    expect(STREAMWISE_REFRESH_JOB_KEY).toBe("streamwise-opt-in-refresh");
  });
});
