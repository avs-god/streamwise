// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mutation = vi.fn();
const result = { configured: true, titles: [{ id: 9, title: "First Pick", mediaType: "movie", releaseDate: "2024-01-01", overview: "A catalog pick." }], conversation: { reply: "I’d start with First Pick (2024). I read your request as: A thoughtful science-fiction request.", rationale: "I read your request as: A thoughtful science-fiction request.", nextStep: "Open a pick to compare current legal offers in your country.", usedSavedTaste: false, research: null } };
vi.mock("@/lib/trpc", () => ({ trpc: { ai: { recommend: { useMutation: (options: any) => ({ mutate: (input: unknown) => { mutation(input); options.onSuccess(result); }, isPending: false }) } } } }));
vi.mock("@/components/CatalogOfferPreview", () => ({ default: () => <div data-testid="offers" /> }));
vi.mock("@/components/LeavingSoonSignal", () => ({ default: () => <div data-testid="leaving-soon" /> }));
vi.mock("@/components/QuickWatchlistSave", () => ({ default: () => <button type="button">Save</button> }));
vi.mock("@/components/CardCommunityContribution", () => ({ default: () => <button type="button">Contribute</button> }));

import NaturalRecommendationChat from "./NaturalRecommendationChat";

afterEach(() => { cleanup(); mutation.mockReset(); });

describe("NaturalRecommendationChat", () => {
  it("uses a natural prompt without exposing filter controls and presents a structured shortlist", async () => {
    render(<NaturalRecommendationChat region="IN" language="en-US" userSignedIn={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Natural-language picks")).toBeInTheDocument();
    expect(screen.queryByLabelText("Recommendation language filter")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Recommendation runtime filter")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /I want a tense science-fiction film/i }));
    await waitFor(() => expect(screen.getByText("A good place to start")).toBeInTheDocument());
    expect(screen.getByText(/I’d start with First Pick/)).toBeInTheDocument();
    expect(screen.getByText("Why this fits")).toBeInTheDocument();
    expect(screen.getByText("Three picks to consider.")).toBeInTheDocument();
    expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ region: "IN", language: "en-US" }));
    expect(mutation.mock.calls[0]?.[0]).not.toHaveProperty("preferredMediaType");
    expect(mutation.mock.calls[0]?.[0]).not.toHaveProperty("preferredOriginalLanguage");
    expect(mutation.mock.calls[0]?.[0]).not.toHaveProperty("maxRuntimeMinutes");
  });
});
