import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCommunityPosts, getCommunityThreads, getCommunityTitleReviews, getThreadReplies, setDbForTests, toPublicCommunityItem } from "./db";

const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

function publicReadDb(rows: unknown[][]) {
  return {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            orderBy: () => ({ limit: async () => rows.shift() ?? [] }),
          }),
        }),
      }),
    }),
  };
}

afterEach(() => setDbForTests(null));

describe("public community visibility boundary", () => {
  it("redacts internal member IDs while preserving only consented attribution", () => {
    const anonymous = toPublicCommunityItem({ id: 11, userId: 71, shareAttribution: false, body: "A careful review." }, "Private Member");
    const attributed = toPublicCommunityItem({ id: 12, userId: 72, shareAttribution: true, body: "A careful review." }, "Consenting Member");
    expect(anonymous).toEqual({ id: 11, shareAttribution: false, body: "A careful review.", contributorName: null });
    expect(attributed).toEqual({ id: 12, shareAttribution: true, body: "A careful review.", contributorName: "Consenting Member" });
    expect(anonymous).not.toHaveProperty("userId");
    expect(attributed).not.toHaveProperty("userId");
  });

  it("omits internal member IDs from actual public post, thread, reply, and review query results", async () => {
    setDbForTests(publicReadDb([
      [{ post: { id: 1, userId: 21, status: "visible", shareAttribution: false, body: "Post" }, contributorName: "Private Member" }],
      [{ thread: { id: 2, userId: 22, status: "visible", shareAttribution: true, headline: "Thread" }, contributorName: "Public Member" }],
      [{ reply: { id: 3, userId: 23, status: "visible", shareAttribution: false, body: "Reply" }, contributorName: "Private Member" }],
      [{ post: { id: 4, userId: 24, status: "visible", shareAttribution: true, body: "Review" }, contributorName: "Reviewer" }],
    ]) as never);

    const posts = await getCommunityPosts({});
    const threads = await getCommunityThreads({});
    const replies = await getThreadReplies(2);
    const reviews = await getCommunityTitleReviews({ tmdbId: 3, mediaType: "movie" });

    for (const item of [posts[0], threads[0], replies[0], reviews[0]]) expect(item).not.toHaveProperty("userId");
    expect(posts[0]).toMatchObject({ contributorName: null });
    expect(threads[0]).toMatchObject({ contributorName: "Public Member" });
    expect(replies[0]).toMatchObject({ contributorName: null });
    expect(reviews[0]).toMatchObject({ contributorName: "Reviewer" });
  });

  it("excludes hidden and removed content even if a database adapter returns it", async () => {
    setDbForTests(publicReadDb([
      [
        { post: { id: 1, userId: 21, status: "visible", shareAttribution: false }, contributorName: "Member" },
        { post: { id: 2, userId: 22, status: "hidden", shareAttribution: false }, contributorName: "Member" },
        { post: { id: 3, userId: 23, status: "removed", shareAttribution: false }, contributorName: "Member" },
      ],
    ]) as never);
    const posts = await getCommunityPosts({});
    expect(posts.map(post => post.id)).toEqual([1]);

    setDbForTests(publicReadDb([
      [
        { thread: { id: 4, userId: 24, status: "visible", shareAttribution: false }, contributorName: "Member" },
        { thread: { id: 5, userId: 25, status: "removed", shareAttribution: false }, contributorName: "Member" },
      ],
      [
        { reply: { id: 6, userId: 26, status: "visible", shareAttribution: false }, contributorName: "Member" },
        { reply: { id: 7, userId: 27, status: "hidden", shareAttribution: false }, contributorName: "Member" },
      ],
      [
        { post: { id: 8, userId: 28, status: "visible", shareAttribution: false }, contributorName: "Member" },
        { post: { id: 9, userId: 29, status: "removed", shareAttribution: false }, contributorName: "Member" },
      ],
    ]) as never);
    const threads = await getCommunityThreads({});
    const replies = await getThreadReplies(4);
    const reviews = await getCommunityTitleReviews({ tmdbId: 4, mediaType: "movie" });
    expect(threads.map(thread => thread.id)).toEqual([4]);
    expect(replies.map(reply => reply.id)).toEqual([6]);
    expect(reviews.map(review => review.id)).toEqual([8]);
  });

  it("filters public community posts, title reviews, threads, and replies to visible moderation status", () => {
    expect(dbSource).toMatch(/getCommunityPosts[\s\S]*?communityPosts\.status, "visible"/);
    expect(dbSource).toMatch(/getCommunityThreads[\s\S]*?communityThreads\.status, "visible"/);
    expect(dbSource).toMatch(/getThreadReplies[\s\S]*?communityThreadReplies\.status, "visible"/);
    expect(dbSource).toMatch(/getCommunityTitleReviews[\s\S]*?communityPosts\.status, "visible"/);
  });

  it("keeps community inputs out of catalog and decision pathways", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).toContain('catalog: router');
    expect(routerSource).toContain('community: router');
    expect(routerSource).not.toMatch(/catalog:[\s\S]*?communityPosts/);
    expect(routerSource).not.toMatch(/decisions:[\s\S]*?getCommunityPosts/);
  });
});
