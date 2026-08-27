// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import StreamwiseLogo from "./StreamwiseLogo";

describe("StreamwiseLogo", () => {
  it("renders an accessible owl mark with a play-pause beak", () => {
    render(<StreamwiseLogo size={40} />);

    const logo = screen.getByRole("img", { name: "Streamwise owl logo" });
    expect(logo).toHaveAttribute("width", "40");
    expect(logo.querySelectorAll("circle")).toHaveLength(6);
    expect(logo.querySelectorAll("path")).toHaveLength(5);
  });

  it("references the owl favicon from the application document head", () => {
    const documentHead = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
    const favicon = readFileSync(resolve(process.cwd(), "client/public/favicon.svg"), "utf8");

    expect(documentHead).toContain('href="/favicon.svg"');
    expect(favicon).toContain('viewBox="0 0 64 64"');
    expect(favicon).toContain('stroke-width="1.15"');
  });
});
