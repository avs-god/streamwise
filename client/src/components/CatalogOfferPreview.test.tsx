// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({ value: {} as { isLoading?: boolean; error?: Error | null; data?: any } }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { title: { useQuery: () => queryState.value } } } }));

import CatalogOfferPreview from "./CatalogOfferPreview";

afterEach(() => { cleanup(); queryState.value = {}; });

describe("CatalogOfferPreview", () => {
  it("renders verified provider names and offer categories when the catalog resolves a title", () => {
    queryState.value = { data: { configured: true, title: { checkedAt: "2026-08-24T00:00:00.000Z", offers: [{ id: 1, name: "Netflix", type: "stream" }, { id: 2, name: "Prime Video", type: "rent" }] } } };
    render(<CatalogOfferPreview titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByLabelText("Verified legal offers in IN")).toHaveTextContent("Netflix · Included");
    expect(screen.getByText("Prime Video · Rent")).toBeInTheDocument();
    expect(screen.getByText(/JustWatch via TMDb/)).toBeInTheDocument();
  });

  it("states when the legal preview is not configured or cannot be fetched", () => {
    queryState.value = { data: { configured: false, title: null } };
    const view = render(<CatalogOfferPreview titleId={1} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByText(/Legal provider preview is unavailable/)).toBeInTheDocument();
    queryState.value = { error: new Error("network") };
    view.rerender(<CatalogOfferPreview titleId={2} mediaType="movie" region="IN" language="en-US" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Verified legal offers could not be loaded for this card");
  });
});
