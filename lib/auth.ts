// lib/auth.ts
export async function signJWT(payload: any, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({ 
    ...payload, 
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) 
  }));
  
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string) {
  try {
    const [header, payload, signature] = token.split(".");
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const data = new TextEncoder().encode(`${header}.${payload}`);
    const sigArray = new Uint8Array(atob(signature.replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => c.charCodeAt(0)));
    const isValid = await crypto.subtle.verify("HMAC", key, sigArray, data);
    if (!isValid) return null;
    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
    return decodedPayload;
  } catch { return null; }
}
