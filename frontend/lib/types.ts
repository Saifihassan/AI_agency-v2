export type Workspace = {
  id: string;
  name: string;
  website: string;
  industry: string;
  profile: CompanyProfile | null;
  createdAt: string;
};

export type CompanyProfile = {
  company_name?: string;
  website?: string;
  industry?: string;
  company_summary?: string;
  description?: string;
  products_services?: string[];
  target_audience?: string;
  brand_voice?: string;
  value_proposition?: string;
  keywords?: string[];
};

export type CampaignPlan = {
  business_summary: string;
  target_audience: string;
  campaign_goal: string;
  campaign_angle: string;
  tone_of_voice: string;
  key_selling_points: string[];
  primary_cta: string;
  platforms: string[];
};

export type CampaignAssets = {
  campaign_strategy?: string;
  marketing_copy?: string;
  email_copy?: string;
  social_posts?: string[];
  cta_suggestions?: string[];
  hashtags?: string[];
};

export type Source = { title: string; url: string; publisher: string };

export type Finding = {
  title: string;
  explanation: string;
  why_it_matters: string;
  evidence: string[];
  sources: Source[];
};

export type ResearchAnalysis = {
  report_title: string;
  research_topic: string;
  executive_summary: string;
  findings: Finding[];
};

export type StrategyRecommendation = {
  title: string;
  description: string;
  business_impact: string;
};

export type StrategyQuickWin = { title: string; action_steps: string[] };

export type StrategyReport = {
  strategic_overview: string;
  prioritized_recommendations: StrategyRecommendation[];
  quick_wins: StrategyQuickWin[];
  long_term_opportunities: { title: string; description: string }[];
  conclusion: string;
};

export type NewsArticle = {
  title: string;
  category: string;
  source: string;
  url: string;
  published_date: string;
  summary: string;
};

export type MarketIntelligenceReport = {
  generated_at: string;
  one_liner_headlines: { headline: string; url: string }[];
  categorized_news: { category: string; articles: NewsArticle[] }[];
  market_trends: { title: string; description: string }[];
  opportunities: { title: string; description: string }[];
};

export type ProspectAnalysis = {
  company_summary: string;
  target_audience: string;
  current_positioning: string;
  identified_pain_points: string[];
  outreach_angle: string;
  value_proposition: string;
  service_offered: string;
};

export type OutreachSequence = {
  tone: string;
  subject_lines: string[];
  cold_email: string;
  follow_up_email_1: string;
  follow_up_email_2: string;
  call_to_action: string;
};

export type CompanySnapshot = {
  company_name: string;
  company_overview: string;
  industry: string;
  target_audience: string;
  market_position: string;
  core_differentiator: string;
};

export type CompetitiveAnalysis = {
  company_snapshot: CompanySnapshot;
  strengths: string[];
  weaknesses: string[];
  opportunities: { title: string; description: string }[];
  recommended_strategy: string;
};

export type ModuleKind =
  | "studio"
  | "research"
  | "news"
  | "outreach"
  | "competitor";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_type: "chat" | "content_post" | "error" | "pending";
};

export type ManagerResponse = {
  response_type: "chat" | "content_post";
  message: string;
};

export type ModuleResultMap = {
  research: { research: ResearchAnalysis; strategy: StrategyReport };
  news: MarketIntelligenceReport;
  outreach: {
    prospect_analysis: ProspectAnalysis;
    outreach_sequence: OutreachSequence;
  };
  competitor: CompetitiveAnalysis;
  studio: ManagerResponse;
};
