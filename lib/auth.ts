// lib/auth.ts
import { getRequestContext } from '@cloudflare/next-on-pages';

async function getJwtSecret(): Promise<string> {
  try {
    const env = (getRequestContext().env as any);
    return env.JWT_SECRET || "PIEROTH_JAPAN_SECURE_2026_TOKEN";
  } catch {
    return "PIEROTH_JAPAN_SECURE_2026_TOKEN";
  }
}

async function getCryptoKey() {
  const secret = await getJwtSecret();
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJWT(payload: any) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "");
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) })).replace(/=/g, "");
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string) {
  try {
    const [header, payload, signature] = token.split(".");
    const key = await getCryptoKey();
    const data = new TextEncoder().encode(`${header}.${payload}`);
    const sigArray = new Uint8Array(atob(signature.replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => c.charCodeAt(0)));
    const isValid = await crypto.subtle.verify("HMAC", key, sigArray, data);
    if (!isValid) return null;
    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
    return decodedPayload;
  } catch { return null; }
}
