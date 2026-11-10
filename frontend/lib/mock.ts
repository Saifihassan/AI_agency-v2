import type {
  CompanyProfile,
  CompetitiveAnalysis,
  ManagerResponse,
  MarketIntelligenceReport,
  ModuleKind,
  ModuleResultMap,
  OutreachSequence,
  ProspectAnalysis,
  ResearchAnalysis,
  StrategyReport,
  Workspace,
} from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const now = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

export const mockProfile = (workspaces: Workspace[]): CompanyProfile => {
  const w = workspaces[0];
  return {
    company_name: w?.name ?? "Acme Inc",
    website: w?.website ?? "acme.com",
    industry: w?.industry ?? "SaaS",
    company_summary:
      "A fast-moving company solving a real operational problem for its customers. This is a mock profile — the backend will generate a real one from your website.",
    description:
      "Acme builds tools that remove manual work from day-to-day operations. The product is aimed at small teams who need results without extra headcount.",
    products_services: ["Core Platform", "Automation Suite", "Analytics"],
    target_audience: "Founders and operators of small-to-mid companies",
    brand_voice: "Professional, confident, no fluff",
    value_proposition: "Ship faster with less manual work and fewer tools.",
    keywords: ["automation", "productivity", "operations", "software"],
  };
};

export const mockResearch = (
  topic: string,
  depth: string,
): { research: ResearchAnalysis; strategy: StrategyReport } => ({
  research: {
    report_title: `Research Report: ${topic}`,
    research_topic: topic,
    executive_summary: `This is a mock analysis of ${topic} at ${depth} depth. It summarises the current state, the main players, and the direction the market is moving. The backend agent will produce the real report grounded in live web research.`,
    findings: [
      {
        title: "Market is consolidating around a few leaders",
        explanation:
          "Top three players hold the majority share while smaller tools compete on niche workflows.",
        why_it_matters:
          "Entering with a generalised product is hard; differentiation matters more than features.",
        evidence: ["Top 3 hold ~70% of active users", "Others average <5% share each"],
        sources: [
          {
            title: "Industry Report 2026",
            url: "#",
            publisher: "Mock Source",
          },
        ],
      },
      {
        title: "Buyers expect automation by default",
        explanation:
          "Manual configuration is now a negative differentiator in most sales conversations.",
        why_it_matters:
          "Position the product around self-running workflows rather than feature completeness.",
        evidence: ["70% of buyers mention automation first", "Setup time is a top-3 objection"],
        sources: [{ title: "Buyer Survey", url: "#", publisher: "Mock Source" }],
      },
    ],
  },
  strategy: {
    strategic_overview:
      "Mock overview: compete on speed-to-value rather than breadth. Own a specific workflow end to end and expand from there.",
    prioritized_recommendations: [
      {
        title: "Lead with one flagship workflow",
        description:
          "Pick the highest-frequency workflow, make it self-running, and market that single outcome.",
        business_impact: "Higher conversion and cleaner positioning",
      },
      {
        title: "Publish research, not ads",
        description:
          "Weekly insights in the target niche outperform paid acquisition for this category.",
        business_impact: "Lower CAC, compounding inbound",
      },
    ],
    quick_wins: [
      {
        title: "Audit homepage promise",
        action_steps: [
          "Rewrite hero to a single outcome",
          "Add 3 proof bullets",
          "Add time-to-value metric",
        ],
      },
    ],
    long_term_opportunities: [
      {
        title: "Category ownership",
        description:
          "Become the default name for this workflow in the niche through consistent publishing.",
      },
    ],
    conclusion:
      "Specified focus beats broad feature sets. The backend report will ground every point in sourced research.",
  },
});

export const mockNews = (industry: string): MarketIntelligenceReport => ({
  generated_at: `${now()} IST`,
  one_liner_headlines: [
    {
      headline: "AI agents move from demo to production across the " + industry + " sector",
      url: "#",
    },
    {
      headline: "Buyers consolidate tools; all-in-one platforms gain share",
      url: "#",
    },
    {
      headline: "Search traffic shifts to AI answer engines",
      url: "#",
    },
  ],
  categorized_news: [
    {
      category: "AI & Agents",
      articles: [
        {
          title: "Agent adoption doubles among mid-market teams",
          category: "AI, Marketing",
          source: "Mock Daily",
          url: "#",
          published_date: "Nov 2026",
          summary:
            "A mock article placeholder. The real pipeline researches live news via searxng, DuckDuckGo and Tavily, then analyses it.",
        },
      ],
    },
    {
      category: "Marketing",
      articles: [
        {
          title: "Content budgets shift toward owned channels",
          category: "Marketing, SEO",
          source: "Mock Post",
          url: "#",
          published_date: "Nov 2026",
          summary:
            "Placeholder summary. The market analyst agent will headline, categorise and extract opportunities here.",
        },
      ],
    },
  ],
  market_trends: [
    {
      title: "Workflow-first products beat feature-first products",
      description:
        "Agencies win by selling outcomes that run themselves, not dashboards.",
    },
  ],
  opportunities: [
    {
      title: "Package automation as a fixed-scope product",
      description:
        "Sell 'one workflow automated' as a productised offer with a fixed price.",
    },
  ],
});

const prospect: ProspectAnalysis = {
  company_summary:
    "Mock summary of the prospect's business. The prospect analyzer agent researches the site and builds the real one.",
  target_audience: "SMB founders and marketing leads",
  current_positioning: "Generic positioning around 'productivity'",
  identified_pain_points: [
    "Manual lead qualification eats hours daily",
    "No consistent follow-up process",
    "Content production is ad-hoc",
  ],
  outreach_angle:
    "Automate one painful workflow in a week — proof before commitment",
  value_proposition:
    "A working automation in days, not a retainer discussion in months",
  service_offered: "Custom AI automation",
};

const sequence: OutreachSequence = {
  tone: "Direct",
  subject_lines: [
    "The workflow eating your mornings",
    "One automated workflow, one week",
    "[Company] + 10 hours back per week",
  ],
  cold_email:
    "Mock cold email. Hi {name}, noticed [Company] does X manually — I automate exactly that with AI agents. Last week I set one up that runs a full lead-qualification loop without a human. Worth 15 minutes to see if it fits [Company]?",
  follow_up_email_1:
    "Mock follow-up 1. Quick note — the automation I mentioned takes ~5 days to build and then runs itself. If timing is off, happy to send a 2-min Loom instead.",
  follow_up_email_2:
    "Mock follow-up 2. Closing the loop — here's the workflow breakdown most teams ask about: [link]. If useful, I'll build the first one for [Company] at a fixed fee.",
  call_to_action: "Book a 15-min call",
};

export const mockOutreach = (website: string, service: string, tone: string) => ({
  prospect_analysis: { ...prospect, service_offered: service },
  outreach_sequence: { ...sequence, tone },
});

const mockCompetitor = (website: string): CompetitiveAnalysis => ({
  company_snapshot: {
    company_name: website.replace(/^https?:\/\//, "").split("/")[0],
    company_overview:
      "Mock snapshot of the competitor. The competitor agent researches their site and market for the real analysis.",
    industry: "Software",
    target_audience: "SMB teams",
    market_position: "Challenger",
    core_differentiator: "Speed of shipping and a strong brand voice",
  },
  strengths: ["Strong content engine", "Fast release cadence", "Clear positioning"],
  weaknesses: ["No automation offering", "Long onboarding", "Weak niche SMB presence"],
  opportunities: [
    {
      title: "Own the automation angle",
      description:
        "Position directly against their manual workflow with a self-running alternative.",
    },
    {
      title: "Attack onboarding time",
      description:
        "Time-to-value in days is the clearest wedge against their weeks-long setup.",
    },
  ],
  recommended_strategy:
    "Mock strategy: do not out-feature them. Out-speed them — package one automated outcome, publish weekly research in their niche, and win the profile of the automation-first buyer.",
});

export const mockStudio = (prompt: string): ManagerResponse => ({
  response_type: "content_post",
  message:
    "This is a mock studio response for: \"" +
    prompt +
    "\"\n\n---\n\nThe real manager agent plans from your workspace profile and live research, then returns finished copy here.\n\nLinkedIn post:\nMost 'AI consultants' sell theory. I ship one working automation per week. Here's #4.\n\nEmail subject: The workflow eating your mornings\n",
});

export const mockRun = async <K extends ModuleKind>(
  kind: K,
  payload: Record<string, unknown>,
  workspaces: Workspace[] = [],
): Promise<ModuleResultMap[K]> => {
  await wait(900 + Math.random() * 700);
  return fallbackFor(kind, payload, workspaces) as ModuleResultMap[K];
};

function fallbackFor(
  kind: ModuleKind,
  payload: Record<string, unknown>,
  workspaces: Workspace[],
): unknown {
  switch (kind) {
    case "research":
      return mockResearch(
        String(payload.topic ?? "your topic"),
        String(payload.depth ?? "quick"),
      );
    case "news":
      return mockNews(
        String(payload.industry ?? "technology"),
      );
    case "outreach":
      return mockOutreach(
        String(payload.website ?? ""),
        String(payload.service ?? ""),
        String(payload.tone ?? "Direct"),
      );
    case "competitor":
      return mockCompetitor(String(payload.website ?? ""));
    case "studio":
      return mockStudio(String(payload.message ?? ""));
    default:
      throw new Error("unknown module");
  }
}
