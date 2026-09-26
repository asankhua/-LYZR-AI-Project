import { inflateRawSync } from "node:zlib";
import { MAX_IMPORT_BYTES } from "@/lib/github/filter";

export type ZipFile = { path: string; content: string };

function crc32(buffer: Buffer): number {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

export function createStoredZip(files: ZipFile[]): Buffer {
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
    central.writeUInt16LE(0, 10);
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

export function readZip(buffer: Buffer): ZipFile[] {
  if (buffer.length > MAX_IMPORT_BYTES) throw new Error("This import is over the limit of 500 files and 5 MB. Choose a smaller folder.");
  let end = -1;
  const start = Math.max(0, buffer.length - 22 - 65535);
  for (let index = buffer.length - 22; index >= start; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      end = index;
      break;
    }
  }
  if (end < 0) throw new Error("That file is not a zip archive.");
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  const files: ZipFile[] = [];
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("That zip archive is incomplete.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressed = buffer.readUInt32LE(cursor + 20);
    const uncompressed = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const path = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    cursor += 46 + nameLength + extraLength + commentLength;
    if (path.endsWith("/")) continue;
    total += uncompressed;
    if (total > MAX_IMPORT_BYTES) throw new Error("This import is over the limit of 500 files and 5 MB. Choose a smaller folder.");
    const nameAtLocal = buffer.readUInt16LE(localOffset + 26);
    const extraAtLocal = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + nameAtLocal + extraAtLocal;
    const raw = buffer.subarray(dataOffset, dataOffset + compressed);
    const bytes = method === 0 ? raw : method === 8 ? inflateRawSync(raw) : null;
    if (!bytes) continue;
    if (bytes.includes(0)) continue;
    files.push({ path, content: bytes.toString("utf8") });
  }
  return files;
}
