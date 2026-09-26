export const ideas = [
  {
    title: "Lead Nurturing Agent",
    description: "Enriches inbound leads from forms, researches company profiles, and drafts follow-ups.",
    chips: ["Researcher", "Writer"],
    saved: "Saves ~15 hrs/wk",
    prompt:
      "Build a lead nurturing agent that enriches inbound leads, researches the company, and drafts a follow-up email.",
  },
  {
    title: "Smart Knowledge Base",
    description: "Answers the same customer questions from Notion and Zendesk, with sources.",
    chips: ["Doc Crawler", "Synthesizer"],
    saved: "Saves ~18 hrs/wk",
    prompt:
      "Build a knowledge base agent that answers repeated customer questions from our docs, and shows the source.",
  },
  {
    title: "Market Digest",
    description: "Monitors competitor launches and filings, and delivers a weekly brief.",
    chips: ["Web Scraper", "Summarizer"],
    saved: "Saves ~10 hrs/wk",
    prompt: "Build a weekly market digest that watches competitor launches and summarizes what changed.",
  },
];

export const templates = [
  { name: "Customer Support Bot", agents: 3, prompt: "A customer support bot that triages tickets and drafts replies." },
  { name: "Sales Outreach", agents: 4, prompt: "A sales outreach app that researches accounts and drafts first emails." },
  { name: "Invoice Analyzer", agents: 2, prompt: "An invoice analyzer that extracts line items and flags mismatches." },
  { name: "Candidate Screening", agents: 3, prompt: "A candidate screening app that summarizes resumes against a role." },
  { name: "Content Calendar", agents: 2, prompt: "A content calendar that drafts a week of posts from a topic." },
];
