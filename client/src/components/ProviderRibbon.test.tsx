// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProviderRibbon from "./ProviderRibbon";

describe("ProviderRibbon", () => {
  it("names major services while clarifying that the marks are not availability claims", () => {
    render(<ProviderRibbon />);
    expect(screen.getByRole("region", { name: "Major streaming platforms" })).toBeInTheDocument();
    expect(screen.getAllByText("Netflix").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JioHotstar").length).toBeGreaterThan(0);
    expect(screen.getByText(/do not show current availability/i)).toBeInTheDocument();
  });
});
