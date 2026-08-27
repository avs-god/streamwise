// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = { omdb: {} as any, reviews: {} as any };
vi.mock("@/lib/trpc", () => ({ trpc: { ratings: { omdb: { useQuery: () => queryState.omdb } }, catalog: { reviews: { useQuery: () => queryState.reviews } } } }));
import CardProviderInsights from "./CardProviderInsights";

const title = { id: 27205, mediaType: "movie" as const, title: "Inception", releaseDate: "2010-07-16", tmdbVoteAverage: 8.4, tmdbVoteCount: 37000 };
afterEach(() => { cleanup(); queryState.omdb = {}; queryState.reviews = {}; });

describe("CardProviderInsights", () => {
  it("keeps TMDb votes, OMDb ratings, and TMDb review excerpts visibly source-labelled", () => {
    queryState.omdb = { data: { status: "available", ratings: [{ source: "Internet Movie Database", value: "8.8/10" }, { source: "Rotten Tomatoes", value: "87%" }] } };
    queryState.reviews = { data: { configured: true, reviews: [{ author: "TMDb reviewer", content: "A clearly bounded TMDb review excerpt for this title." }] } };
    render(<CardProviderInsights title={title} />);
    expect(screen.getByText(/TMDb: 8.4 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText(/OMDb · Internet Movie Database: 8.8\/10/)).toBeInTheDocument();
    expect(screen.getByText(/OMDb · Rotten Tomatoes: 87%/)).toBeInTheDocument();
    expect(screen.getByText(/TMDb reviewer:/)).toBeInTheDocument();
    expect(screen.getByText(/OMDb does not supply review excerpts here/)).toBeInTheDocument();
  });

  it("shows candid no-match and unavailable TMDb review states", () => {
    queryState.omdb = { data: { status: "not_found", ratings: [] } };
    queryState.reviews = { data: { configured: false, reviews: [] } };
    render(<CardProviderInsights title={title} />);
    expect(screen.getByText("No exact OMDb match")).toBeInTheDocument();
    expect(screen.getByText("TMDb review context is not configured.")).toBeInTheDocument();
  });
});
