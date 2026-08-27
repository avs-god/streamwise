// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const save = vi.fn();
const profileState = vi.hoisted(() => ({ data: null as any, isLoading: false }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Member" }, loading: false }) }));
vi.mock("@/components/AppFrame", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { tasteProfile: { get: { useQuery: () => profileState }, save: { useMutation: () => ({ mutate: save, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Settings from "./Settings";

afterEach(() => { cleanup(); save.mockReset(); profileState.data = null; });

describe("Settings", () => {
  it("offers explicit recommendation, country, density, and motion choices and persists them together", () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    fireEvent.change(screen.getByLabelText("Default discovery country"), { target: { value: "US" } });
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    fireEvent.click(screen.getByLabelText("Reduce non-essential motion"));
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ favoriteGenreIds: [28], preferredLanguages: ["ja"], defaultRegion: "US", interfaceDensity: "compact", reducedMotion: true, includeMovies: true, includeSeries: true }));
  });
});
