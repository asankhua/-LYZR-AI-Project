import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function keyBytes(key: string): Buffer {
  const bytes = Buffer.from(key, "base64");
  if (bytes.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes of base64.");
  return bytes;
}

export function encryptString(plain: string, key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(key), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64");
}

export function decryptString(payload: string, key: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not set.");
  return key;
}
