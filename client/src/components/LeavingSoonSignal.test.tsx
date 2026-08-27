// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({ data: undefined as any }));
vi.mock("@/lib/trpc", () => ({ trpc: { leavingSoon: { titleSignals: { useQuery: () => queryState } } } }));

import LeavingSoonSignal from "./LeavingSoonSignal";

afterEach(() => { cleanup(); queryState.data = undefined; });

describe("LeavingSoonSignal", () => {
  it("labels a visible linked member report as an unverified public-discussion signal", () => {
    queryState.data = { confirmed: [], community: [{ providerName: "Netflix", reportedLeavingAt: "2026-09-01T00:00:00.000Z", sourceUrl: "https://www.reddit.com/r/movies/comments/example" }], publicWeb: null };
    render(<LeavingSoonSignal titleId={1} mediaType="movie" />);
    expect(screen.getByText("Community Leaving-soon signal")).toBeInTheDocument();
    expect(screen.getByText(/Unverified Public discussion · reddit.com/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inspect source/ })).toHaveAttribute("href", "https://www.reddit.com/r/movies/comments/example");
  });

  it("does not render a tag when no visible title-linked report exists", () => {
    render(<LeavingSoonSignal titleId={1} mediaType="movie" />);
    expect(screen.queryByText("Community Leaving-soon signal")).not.toBeInTheDocument();
  });

  it("shows an explicit provider expiry feed separately from source-linked public-web context", () => {
    queryState.data = { confirmed: [{ providerName: "Netflix", region: "IN", sourceKind: "change_feed", expiresAt: "2026-09-01T00:00:00.000Z", lastObservedAt: "2026-08-27T00:00:00.000Z", sourceUrl: "https://provider.example/changes" }], community: [], publicWeb: { status: "lead", directResponse: "A public article discusses a possible removal.", sources: [{ domain: "example.com", url: "https://example.com/leaving", title: "Leaving list", kind: "reporting" }], communitySources: [] } };
    render(<LeavingSoonSignal titleId={1} mediaType="movie" region="IN" />);
    expect(screen.getByText("Leaving soon from Netflix")).toBeInTheDocument();
    expect(screen.getByText("Provider expiry feed")).toBeInTheDocument();
    expect(screen.getByText("Not a legal provider departure")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /example.com/ })).toHaveAttribute("href", "https://example.com/leaving");
  });
});
