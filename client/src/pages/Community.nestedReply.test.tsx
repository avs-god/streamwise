// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 7, role: "user" }, loading: false }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ community: { replies: { invalidate: testState.invalidate } } }),
    community: {
      reply: {
        useMutation: (options: { onSuccess: () => void }) => ({
          isPending: false,
          mutate: (input: unknown) => { testState.mutate(input); options.onSuccess(); },
        }),
      },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CommunityThreadDialog from "@/components/CommunityThreadDialog";

const parent = { id: 1, parentReplyId: null, body: "Parent thought", containsSpoilers: false, contributorName: null, createdAt: "2026-08-27T00:00:00.000Z" };
const child = { id: 2, parentReplyId: 1, body: "Nested follow-up", containsSpoilers: false, contributorName: null, createdAt: "2026-08-27T00:01:00.000Z" };

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("CommunityThreadDialog nested reply behavior", () => {
  it("selects a parent, submits a child with parentReplyId, and renders the child after its parent", async () => {
    const user = userEvent.setup();
    const view = render(<CommunityThreadDialog threadId={5} open onOpenChange={vi.fn()} replies={[parent]} loading={false} onReportReply={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Reply" }));
    expect(screen.getByText("Reply to this comment")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Reply to this comment"), "A nested reply");
    await user.click(screen.getByRole("button", { name: "Post reply" }));
    expect(testState.mutate).toHaveBeenCalledWith({ threadId: 5, parentReplyId: 1, body: "A nested reply", containsSpoilers: false, shareAttribution: false });
    view.rerender(<CommunityThreadDialog threadId={5} open onOpenChange={vi.fn()} replies={[parent, child]} loading={false} onReportReply={vi.fn()} />);
    const articles = Array.from(document.querySelectorAll("article"));
    expect(within(articles[0]!).getByText("Parent thought")).toBeInTheDocument();
    expect(within(articles[1]!).getByText("Nested follow-up")).toBeInTheDocument();
    expect(articles[1]).toHaveClass("border-l-4");
  });

  it("sends an individual reply ID to the private moderation callback", async () => {
    const user = userEvent.setup();
    const onReportReply = vi.fn();
    render(<CommunityThreadDialog threadId={5} open onOpenChange={vi.fn()} replies={[parent]} loading={false} onReportReply={onReportReply} />);
    await user.click(screen.getByRole("button", { name: "Report" }));
    expect(onReportReply).toHaveBeenCalledWith(1);
  });
});
