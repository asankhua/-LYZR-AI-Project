import { describe, expect, it } from "vitest";
import { decryptString, encryptString } from "@/lib/security/crypto";

const key = Buffer.alloc(32, 7).toString("base64");

describe("token encryption", () => {
  it("round-trips a GitHub token", () => {
    const token = "gho_example_token";
    expect(decryptString(encryptString(token, key), key)).toBe(token);
  });

  it("rejects a key that is not 32 bytes", () => {
    expect(() => encryptString("x", Buffer.from("short").toString("base64"))).toThrow(/ENCRYPTION_KEY/);
  });
});
