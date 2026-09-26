const textTypes = new Set(["text/plain", "text/csv", "application/csv"]);

export function extractText(file: { name: string; type: string; bytes: Buffer }): string {
  const name = file.name.toLowerCase();
  const asText = name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".md") || textTypes.has(file.type);
  if (asText) return file.bytes.toString("utf8");
  const printable = file.bytes.toString("latin1").replace(/[^\t\n\r\x20-\x7e]+/g, " ").replace(/ {2,}/g, " ").trim();
  return printable.slice(0, 20_000);
}
