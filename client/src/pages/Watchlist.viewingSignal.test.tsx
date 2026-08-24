// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  record: vi.fn(),
  refetch: vi.fn(),
  signals: { isLoading: false, error: null as Error | null, data: [] as any[], refetch: () => state.refetch() },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 7, role: "user" }, loading: false }) }));
vi.mock("@/components/AppFrame", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/ConnectionNotice", () => ({ PrivacyNote: () => <div /> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ watchlist: { list: { cancel: vi.fn(), getData: vi.fn(), setData: vi.fn(), invalidate: vi.fn() } }, alerts: { list: { invalidate: vi.fn() } }, viewingSignals: { list: { invalidate: vi.fn() } } }),
    watchlist: {
      list: { useQuery: () => ({ isLoading: false, error: null, data: [{ id: 1, tmdbId: 27205, mediaType: "movie", title: "Inception", releaseDate: "2010-07-16", providerNamesJson: "[]", availabilityCheckedAt: null, availabilityRegion: "IN", plannedFor: "this_month", monitorAvailability: false, note: null }] }) },
      setIntent: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, remove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, setNote: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, setMonitoring: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, refresh: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, refreshTracked: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    viewingSignals: {
      list: { useQuery: () => state.signals },
      record: { useMutation: () => ({ mutate: state.record, isPending: false }) },
      remove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Watchlist from "./Watchlist";

afterEach(() => { cleanup(); vi.clearAllMocks(); state.signals = { isLoading: false, error: null, data: [], refetch: () => state.refetch() }; });

describe("Watchlist private viewing signal", () => {
  it("only records a watched title after the member explicitly presses the opt-in control", async () => {
    const user = userEvent.setup();
    render(<Watchlist />);
    expect(screen.getByText(/It is never inferred from activity or shared publicly/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Record as watched" }));
    expect(state.record).toHaveBeenCalledWith({ tmdbId: 27205, mediaType: "movie", title: "Inception" });
  });

  it("offers a retry when watched-record status cannot be loaded and makes no recording", async () => {
    state.signals = { isLoading: false, error: new Error("network"), data: [], refetch: () => state.refetch() };
    const user = userEvent.setup();
    render(<Watchlist />);
    expect(screen.getByRole("alert")).toHaveTextContent("Private watched-record status could not be loaded.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    expect(state.record).not.toHaveBeenCalled();
  });
});
