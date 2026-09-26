export const themePresets = {
  minimal: { name: "Minimal", bg: "#ffffff", text: "#1f2330", accent: "#4f46e5", font: "Inter, sans-serif" },
  editorial: { name: "Editorial", bg: "#f7f4ee", text: "#221e1a", accent: "#8c3a2f", font: "Georgia, serif" },
  midnight: { name: "Midnight", bg: "#12141c", text: "#f3f5f8", accent: "#8b93ff", font: "Inter, sans-serif" },
  "soft-pastel": { name: "Soft Pastel", bg: "#f8f5ff", text: "#2c2640", accent: "#7c6cf0", font: "Inter, sans-serif" },
  corporate: { name: "Corporate", bg: "#f4f7fb", text: "#152033", accent: "#1d4e89", font: "Inter, sans-serif" },
  terminal: { name: "Terminal", bg: "#10140f", text: "#d6f5d6", accent: "#3dd68c", font: "ui-monospace, monospace" },
  "warm-paper": { name: "Warm Paper", bg: "#fff8f0", text: "#3a2a22", accent: "#c56a2d", font: "Georgia, serif" },
  "bold-neon": { name: "Bold Neon", bg: "#0e0f14", text: "#f5f7ff", accent: "#e11d74", font: "Inter, sans-serif" },
} as const;

export type ThemePresetId = keyof typeof themePresets;

export function themeCss(preset: ThemePresetId = "minimal"): string {
  const theme = themePresets[preset];
  return `:root {
  --app-bg: ${theme.bg};
  --app-text: ${theme.text};
  --app-accent: ${theme.accent};
  --app-font: ${theme.font};
}
body { margin: 0; background: var(--app-bg); color: var(--app-text); font-family: var(--app-font); }
main { max-width: 72rem; margin: 0 auto; padding: 2rem 1.25rem; }
button { background: var(--app-accent); color: white; border: 0; border-radius: 6px; padding: 0.5rem 0.75rem; }
`;
}
