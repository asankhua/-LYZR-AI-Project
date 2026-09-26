type FileNode = { file: { contents: string } };
type DirectoryNode = { directory: FileTree };
type FileTree = Record<string, FileNode | DirectoryNode>;

export function toFileTree(files: { path: string; content: string }[]): FileTree {
  const tree: FileTree = {};
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let cursor = tree;
    parts.forEach((part, index) => {
      const last = index === parts.length - 1;
      if (last) {
        cursor[part] = { file: { contents: file.content } };
        return;
      }
      const existing = cursor[part];
      if (!existing || !("directory" in existing)) cursor[part] = { directory: {} };
      const next = cursor[part];
      if (next && "directory" in next) cursor = next.directory;
    });
  }
  return tree;
}

export function parsePreviewLine(line: string): { message: string; file?: string } | null {
  if (!line.includes("Failed to resolve import") && !line.includes("[plugin:vite") && !line.includes("error TS")) return null;
  const file = line.match(/((?:src|components|pages)\/[\w./-]+\.tsx?)/)?.[1];
  return { message: line.trim(), file };
}
