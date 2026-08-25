import { parse as parseCookie } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getUserByOpenId } from "../db";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "");
export const portableConfigured = () => Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.JWT_SECRET);
export async function createPortableSession(openId: string) { return new SignJWT({ openId, portable: true }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${Math.floor(ONE_YEAR_MS / 1000)}s`).sign(secret()); }
export async function authenticatePortableRequest(req: Request) {
  if (!process.env.JWT_SECRET) return null;
  const token = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;
  try { const verified = await jwtVerify(token, secret()); const openId = typeof verified.payload.openId === "string" ? verified.payload.openId : null; return openId ? await getUserByOpenId(openId) ?? null : null; } catch { return null; }
}
