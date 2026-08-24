// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { community: { titleRatingSummary: { useQuery: () => ({ data: { average: null, count: 0 } }) }, titleReviews: { useQuery: () => ({ data: [] }) }, setTitleRating: { useMutation: () => ({}) }, contribute: { useMutation: () => ({}) }, report: { useMutation: () => ({}) } } } }));

import { ExternalReferencePanel, TitleStandbyNotice } from "./TitlePage";

afterEach(cleanup);

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
});
