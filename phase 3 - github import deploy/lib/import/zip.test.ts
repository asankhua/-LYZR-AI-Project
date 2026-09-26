import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createStoredZip, readZip } from "@/lib/import/zip";

describe("zip import", () => {
  it("reads a stored archive", () => {
    const zip = createStoredZip([
      { path: "package.json", content: '{"name":"demo"}\n' },
      { path: "src/App.tsx", content: "export const App = 1;\n" },
    ]);
    expect(readZip(zip)).toEqual([
      { path: "package.json", content: '{"name":"demo"}\n' },
      { path: "src/App.tsx", content: "export const App = 1;\n" },
    ]);
  });

  it("reads a deflated entry", () => {
    const content = "export const value = 1;\n";
    const name = Buffer.from("src/main.ts");
    const data = deflateRawSync(Buffer.from(content));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    const offset = 30 + name.length + data.length;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(1, 8);
    end.writeUInt16LE(1, 10);
    end.writeUInt32LE(46 + name.length, 12);
    end.writeUInt32LE(offset, 16);
    const zip = Buffer.concat([local, name, data, central, name, end]);
    expect(readZip(zip)).toEqual([{ path: "src/main.ts", content }]);
  });

  it("refuses an archive over 5 MB", () => {
    expect(() => readZip(Buffer.alloc(5 * 1024 * 1024 + 1))).toThrow(/500 files and 5 MB/);
  });
});
