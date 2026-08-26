// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ community: { titleLeavingSoonSignals: { invalidate: vi.fn() }, titleReviews: { invalidate: vi.fn() }, titleRatingSummary: { invalidate: vi.fn() } } }),
  community: {
    contribute: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    setTitleRating: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
  },
} }));

import CardCommunityContribution from "./CardCommunityContribution";

afterEach(cleanup);

describe("CardCommunityContribution", () => {
  it("opens a title-linked leaving-soon report dialog and offers a review path", () => {
    render(<CardCommunityContribution titleId={27205} mediaType="movie" title="Inception" region="IN" />);
    fireEvent.click(screen.getByRole("button", { name: "Contribute" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Add context for Inception");
    expect(screen.getByText("Leaving-soon report")).toBeInTheDocument();
    expect(screen.getByLabelText("Platform")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Write a review" }));
    expect(screen.getByText("Your rating")).toBeInTheDocument();
    expect(screen.getByLabelText("Your review")).toBeInTheDocument();
  });
});
