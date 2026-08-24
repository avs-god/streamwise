// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ user: null as { id: number } | null }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ community: { titleRatingSummary: { invalidate: vi.fn() }, titleReviews: { invalidate: vi.fn() } } }), community: { titleRatingSummary: { useQuery: () => ({ data: { average: null, count: 0 } }) }, titleReviews: { useQuery: () => ({ data: [] }) }, setTitleRating: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, contribute: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, report: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

import { ExternalReferencePanel, ReviewReportAction, TitleCommunity, TitleStandbyNotice } from "./TitlePage";

afterEach(() => { cleanup(); authState.user = null; });

describe("Title page source boundary", () => {
  it("keeps IMDb and Rotten Tomatoes outbound-only in a configured title state", () => {
    render(<ExternalReferencePanel encodedTitle="Inception" />);
    expect(screen.getByText(/outbound-only references/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "IMDb reference" })).toHaveAttribute("href", "https://www.imdb.com/find/?q=Inception");
    expect(screen.getByRole("link", { name: "Rotten Tomatoes reference" })).toHaveAttribute("href", "https://www.rottentomatoes.com/search?search=Inception");
    expect(screen.getByText(/No score, review text, or rating timestamp is imported/)).toBeInTheDocument();
  });

  it("keeps external references explicitly unavailable in the no-catalog title state", () => {
    render(<TitleStandbyNotice />);
    expect(screen.getByText("Legal catalog is safely on standby.")).toBeInTheDocument();
    expect(screen.getByText(/IMDb, Rotten Tomatoes, and critic-reading links are unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/without a permitted licensed provider/)).toBeInTheDocument();
  });

  it("renders accessible authenticated member rating and review controls without prepopulating a review", () => {
    authState.user = { id: 7 };
    render(<TitleCommunity titleId={27205} titleName="Inception" mediaType="movie" />);
    expect(screen.getByText("What Streamwise members think.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 ★" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 ★" })).toBeInTheDocument();
    expect(screen.getByLabelText("Write a community review")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Publish community review" })).toBeDisabled();
  });

  it("sends a report action for a supplied review identifier without requiring review fixture content", async () => {
    const onReport = vi.fn();
    const user = userEvent.setup();
    render(<ReviewReportAction postId={42} disabled={false} onReport={onReport} />);
    await user.click(screen.getByRole("button", { name: "Report review" }));
    expect(onReport).toHaveBeenCalledWith(42);
  });
});
