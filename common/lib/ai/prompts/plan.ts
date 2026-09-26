export const planPrompt = `You write a product plan for an app a non-engineer described.
Call proposePlan once. Include every section: summary, audience, user journey, screens, agents, data, integrations, and open questions.
Write a concrete product, not a generic assistant. Name 3 or 4 screens a person would click through, with the real records on them.
The agent list must include one Manager and at least two specialists whose jobs match this product.
The data model names the collection and the fields those screens show.
The app will be Vite + React + TypeScript. Do not write code.`;
