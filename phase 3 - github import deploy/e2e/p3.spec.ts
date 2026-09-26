import { expect, test } from "@playwright/test";

function crc32(buffer: Buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function zip(files: { path: string; content: string }[]) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.path);
    const data = Buffer.from(file.content);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(Buffer.concat([local, name, data]));
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += 30 + name.length + data.length;
  }
  const central = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, central, end]);
}

test("guest import, git, deploy, and the public agent API", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/try");
  await page.getByRole("link", { name: "Import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Import a project" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign up to connect" })).toBeVisible();

  const archive = zip([
    { path: "README.md", content: "# Notes\nA plain folder.\n" },
    { path: "notes.txt", content: "hello\n" },
  ]);
  await page.getByRole("button", { name: "Zip archive" }).click();
  await page.locator("input[type=file]").setInputFiles({ name: "notes.zip", mimeType: "application/zip", buffer: archive });
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page).toHaveURL(/\/p\//, { timeout: 20_000 });
  await expect(page.getByText("This project is not a Vite app")).toBeVisible();

  await page.getByRole("tab", { name: "Git" }).click();
  await expect(page.getByRole("heading", { name: "GitHub is not connected" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up to connect" })).toBeVisible();

  const projectId = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`/p/${projectId}/deploy`);
  await expect(page.getByRole("heading", { name: "Pre-flight" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("link", { name: "Sign up to connect" })).toBeVisible();

  const blocked = await page.request.post("/api/deploy", {
    data: { projectId, subdomain: "guest-app" },
  });
  expect(blocked.status()).toBe(403);

  const state = await page.request.get(`/api/github/state?projectId=${projectId}`);
  expect(state.ok()).toBeTruthy();
  const key = ((await state.json()) as { publicKey: string }).publicKey;
  const wrong = await page.request.post("/api/public/agents/run", {
    headers: { origin: "http://localhost:3000", "x-architect-key": "not-a-real-key" },
    data: { agentName: "Manager", input: "hello" },
  });
  expect(wrong.status()).toBe(401);
  const foreign = await page.request.post("/api/public/agents/run", {
    headers: { origin: "https://evil.example", "x-architect-key": key },
    data: { agentName: "Manager", input: "hello" },
  });
  expect(foreign.status()).toBe(403);

  let limited = 0;
  for (let attempt = 0; attempt < 31; attempt += 1) {
    const response = await page.request.post("/api/public/agents/run", {
      headers: { origin: "http://localhost:3000", "x-architect-key": key },
      data: { agentName: "Manager", input: "hello" },
    });
    limited = response.status();
  }
  expect(limited).toBe(429);

  const oversized = await page.request.post("/api/import/zip", {
    multipart: {
      file: { name: "big.zip", mimeType: "application/zip", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) },
    },
  });
  expect(oversized.status()).toBe(413);
  expect(await oversized.text()).toContain("500 files and 5 MB");
});
