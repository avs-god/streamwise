// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = { value: {} as any };
vi.mock("@/lib/trpc", () => ({ trpc: { anime: { search: { useQuery: () => queryState.value } } } }));
vi.mock("./AnimeAvailabilityPreview", () => ({ default: () => <div data-testid="anime-availability" /> }));
import AnimeDiscoveryPanel from "./AnimeDiscoveryPanel";
afterEach(() => { cleanup(); queryState.value = {}; });

describe("AnimeDiscoveryPanel", () => {
  it("labels AniList discovery separately from legal availability", () => {
    queryState.value = { data: { status: "available", titles: [{ id: 1, title: "Frieren", nativeTitle: "葬送のフリーレン", englishTitle: "Frieren", format: "TV", episodes: 28, genres: ["Adventure"], description: "A story", coverImage: null, averageScore: 90, siteUrl: "https://anilist.co/anime/1" }] } };
    render(<AnimeDiscoveryPanel query="Frieren" region="IN" language="en-US" />);
    expect(screen.getByRole("region", { name: "Anime catalogue discovery" })).toBeInTheDocument();
    expect(screen.getByText("Anime catalogue · AniList")).toBeInTheDocument();
    expect(screen.getByText(/AniList supplies anime metadata/i)).toBeInTheDocument();
    expect(screen.getByTestId("anime-availability")).toBeInTheDocument();
  });
  it("does not fabricate availability when AniList returns no matches", () => {
    queryState.value = { data: { status: "available", titles: [] } };
    render(<AnimeDiscoveryPanel query="Unknown anime" region="IN" language="en-US" />);
    expect(screen.getByText(/Legal availability was not inferred/i)).toBeInTheDocument();
  });
});
