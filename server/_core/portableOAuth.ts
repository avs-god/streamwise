import { parse as parseCookie } from "cookie";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE } from "../../shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { createPortableSession, portableConfigured } from "./portableAuth";

export function registerPortableOAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", (req, res) => {
    if (!portableConfigured()) return res.status(503).json({ error: "Google OAuth is not configured." });
    const nonce = crypto.randomUUID(); res.cookie(OAUTH_STATE_COOKIE, nonce, { ...getSessionCookieOptions(req), maxAge: 600_000 });
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth"); url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID!); url.searchParams.set("redirect_uri", redirectUri); url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "openid email profile"); url.searchParams.set("state", nonce); res.redirect(url.toString());
  });
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null; const state = typeof req.query.state === "string" ? req.query.state : null; const expected = parseCookie(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!code || !state || state !== expected || !portableConfigured()) return res.status(403).json({ error: "Invalid Google OAuth callback." });
    try { const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`; const token = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code" }) }).then(response => response.json() as Promise<{ access_token?: string }>); if (!token.access_token) throw new Error("Token exchange failed"); const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } }).then(response => response.json() as Promise<{ sub?: string; name?: string; email?: string }>); if (!profile.sub) throw new Error("Google profile missing subject"); await db.upsertUser({ openId: `google:${profile.sub}`, name: profile.name ?? null, email: profile.email ?? null, loginMethod: "google", lastSignedIn: new Date() }); const session = await createPortableSession(`google:${profile.sub}`); res.clearCookie(OAUTH_STATE_COOKIE, getSessionCookieOptions(req)); res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS }); res.redirect("/"); } catch { res.status(500).json({ error: "Google OAuth sign-in failed." }); }
  });
}
