// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = { value: {} as any };
vi.mock("@/lib/trpc", () => ({ trpc: { releaseSignals: { title: { useQuery: () => queryState.value } } } }));
import CardReleaseSignals from "./CardReleaseSignals";
afterEach(() => { cleanup(); queryState.value = {}; });

describe("CardReleaseSignals", () => {
  it("separates a current TMDb theatrical listing from a provider-announced future OTT date", () => {
    queryState.value = { data: { theatrical: { status: "listed", sourceUrl: "https://www.themoviedb.org/movie/1" }, announcedStreaming: [{ providerName: "Netflix", announcedFor: "2026-09-01T00:00:00.000Z", sourceUrl: "https://www.netflix.com/title/1" }] } };
    render(<CardReleaseSignals titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByText("In theatres in IN")).toBeInTheDocument();
    expect(screen.getByText(/not a streaming offer/)).toBeInTheDocument();
    expect(screen.getByText("Announced OTT date")).toBeInTheDocument();
    expect(screen.getByText(/announced future date, not a current offer/)).toBeInTheDocument();
  });
  it("does not create a label when the source has no current theatrical or active announcement signal", () => {
    queryState.value = { data: { theatrical: { status: "not_listed" }, announcedStreaming: [] } };
    const { container } = render(<CardReleaseSignals titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(container).toBeEmptyDOMElement();
  });
});
