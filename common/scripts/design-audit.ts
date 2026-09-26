import type { Page } from "@playwright/test";

export type DesignAudit = {
  bodyFont: string;
  accentButtons: number;
  lavender: number;
  unlabelledIconButtons: number;
};

export async function auditDesign(page: Page): Promise<DesignAudit> {
  return page.evaluate(() => {
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const accentButtons = [...document.querySelectorAll("button")].filter((element) => {
      const color = getComputedStyle(element).backgroundColor;
      return color === "rgb(79, 70, 229)" || color === "rgb(129, 140, 248)";
    }).length;
    const lavender = [...document.querySelectorAll("body *")].filter((element) => {
      const color = getComputedStyle(element).backgroundColor;
      return color === "rgb(250, 248, 255)" || color === "rgb(53, 37, 205)";
    }).length;
    const unlabelledIconButtons = [...document.querySelectorAll("button")].filter((element) => {
      const text = element.textContent?.replace(/\s+/g, "") ?? "";
      return text.length === 0 && !element.getAttribute("aria-label") && !element.getAttribute("title");
    }).length;
    return { bodyFont, accentButtons, lavender, unlabelledIconButtons };
  });
}
