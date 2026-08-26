// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({ data: undefined as any }));
vi.mock("@/lib/trpc", () => ({ trpc: { community: { titleLeavingSoonSignals: { useQuery: () => queryState } } } }));

import LeavingSoonSignal from "./LeavingSoonSignal";

afterEach(() => { cleanup(); queryState.data = undefined; });

describe("LeavingSoonSignal", () => {
  it("labels a visible linked member report as an unverified public-discussion signal", () => {
    queryState.data = [{ providerName: "Netflix", reportedLeavingAt: "2026-09-01T00:00:00.000Z", sourceUrl: "https://www.reddit.com/r/movies/comments/example" }];
    render(<LeavingSoonSignal titleId={1} mediaType="movie" />);
    expect(screen.getByText("Leaving-soon signal")).toBeInTheDocument();
    expect(screen.getByText(/Unverified Public discussion · reddit.com/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inspect source/ })).toHaveAttribute("href", "https://www.reddit.com/r/movies/comments/example");
  });

  it("does not render a tag when no visible title-linked report exists", () => {
    render(<LeavingSoonSignal titleId={1} mediaType="movie" />);
    expect(screen.queryByText("Leaving-soon signal")).not.toBeInTheDocument();
  });
});
