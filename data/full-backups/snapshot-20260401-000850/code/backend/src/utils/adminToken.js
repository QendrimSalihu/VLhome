import crypto from "node:crypto";
import { env } from "../config/env.js";

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPart(payloadPart) {
  return crypto.createHmac("sha256", env.adminTokenSecret).update(payloadPart).digest("base64url");
}

export function createAdminToken({ email }) {
  const expiresInMs = Math.max(1, env.adminTokenTtlHours) * 60 * 60 * 1000;
  const payload = {
    sub: "admin",
    email,
    exp: Date.now() + expiresInMs
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = signPart(payloadPart);
  return `${payloadPart}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }
  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return { valid: false };
  }
  const expected = signPart(payloadPart);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return { valid: false };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart));
    if (!payload?.exp || Date.now() > Number(payload.exp)) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
