// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({ value: {} as { isLoading?: boolean; error?: Error | null; data?: any } }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { title: { useQuery: () => queryState.value } } } }));
vi.mock("./CardProviderInsights", () => ({ default: () => <div data-testid="card-provider-insights" /> }));
vi.mock("./CardReleaseSignals", () => ({ default: () => <div data-testid="card-release-signals" /> }));

import CatalogOfferPreview from "./CatalogOfferPreview";

afterEach(() => { cleanup(); queryState.value = {}; });

describe("CatalogOfferPreview", () => {
  it("renders verified provider names and offer categories when the catalog resolves a title", () => {
    queryState.value = { data: { configured: true, title: { checkedAt: "2026-08-24T00:00:00.000Z", offers: [{ id: 1, name: "Netflix", type: "stream" }, { id: 2, name: "Prime Video", type: "rent" }], watchmodeOffers: [], streamingAvailabilityOffers: [], watchmodeStatus: "unavailable", streamingAvailabilityStatus: "unavailable", watchmodeCheckedAt: null, streamingAvailabilityCheckedAt: null } } };
    render(<CatalogOfferPreview titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByLabelText("Legal offer comparison in IN")).toHaveTextContent("Netflix · Included");
    expect(screen.getByText("Prime Video · Rent")).toBeInTheDocument();
    expect(screen.getByText(/JustWatch via TMDb/)).toBeInTheDocument();
    expect(screen.getByTestId("card-provider-insights")).toBeInTheDocument();
    expect(screen.getByTestId("card-release-signals")).toBeInTheDocument();
  });

  it("states when the legal preview is not configured or cannot be fetched", () => {
    queryState.value = { data: { configured: false, title: null } };
    const view = render(<CatalogOfferPreview titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByText(/Legal provider preview is unavailable/)).toBeInTheDocument();
    queryState.value = { error: new Error("network") };
    view.rerender(<CatalogOfferPreview titleId={2} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Verified legal offers could not be loaded for this card");
  });

  it("expands every source-backed platform and labels YouTube rentals and purchases by transaction type", () => {
    queryState.value = { data: { configured: true, title: { checkedAt: "2026-08-24T00:00:00.000Z", offers: [{ id: 1, name: "Netflix", type: "stream" }, { id: 2, name: "Prime Video", type: "rent" }, { id: 3, name: "Apple TV", type: "buy" }, { id: 4, name: "YouTube", type: "rent" }, { id: 5, name: "YouTube", type: "buy" }], watchmodeOffers: [{ id: 6, name: "YouTube Movies", type: "rent", detail: "HD", price: "$3.99" }], streamingAvailabilityOffers: [], watchmodeStatus: "available", streamingAvailabilityStatus: "unavailable", watchmodeCheckedAt: "2026-08-24T00:00:00.000Z", streamingAvailabilityCheckedAt: null } } };
    render(<CatalogOfferPreview titleId={1} mediaType="movie" region="US" language="en-US" />);
    expect(screen.getByText("YouTube · Rent")).toBeInTheDocument();
    expect(screen.getByText(/YouTube \/ Google TV availability is source-backed/)).toBeInTheDocument();
    expect(screen.queryByText("YouTube · Buy")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all 5 primary-source offers" }));
    expect(screen.getByText("YouTube · Buy")).toBeInTheDocument();
    expect(screen.getByText("YouTube Movies · Rent · HD · $3.99")).toBeInTheDocument();
  });
});
