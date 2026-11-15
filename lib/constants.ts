// Fixed vocabularies shared by validation, prompts, UI filters, and the eval
// harness. Keeping these in one place is what lets us validate model output
// strictly instead of accepting arbitrary strings.

export const COUNTRIES = ["Canada", "United States", "Canada/US"] as const;

export const CATEGORIES = [
  "Startup",
  "Nonprofit",
  "Research",
  "Small Business",
  "Youth",
  "Women",
  "BIPOC",
  "Climate",
  "Tech",
  "Arts",
  "Mixed"
] as const;

export const FUNDING_TYPES = ["Grant", "Loan", "Prize", "Accelerator", "Tax Credit", "Other"] as const;

export const SOURCE_TYPES = [
  "Government website",
  "Foundation website",
  "Accelerator",
  "University",
  "Nonprofit",
  "Other"
] as const;

export const FIT_SCORES = ["High", "Medium", "Low"] as const;

export const ELIGIBILITY_GUESSES = ["Likely", "Possible", "Unlikely"] as const;

export const URGENCY_LEVELS = ["Closing Soon", "Open", "Rolling", "Unknown", "Closed"] as const;

export const REVIEW_STATUSES = ["unreviewed", "verified", "uncertain", "rejected"] as const;

export const OPPORTUNITY_STATUSES = ["new", "reviewed", "applying", "applied", "rejected", "saved"] as const;

export const DISCOVERY_SOURCES = ["demo", "live"] as const;

export const ORG_TYPES = ["Startup", "Small business", "Nonprofit", "Social enterprise", "Research", "Other"] as const;

export const ORG_STAGES = ["Idea", "Early revenue", "Growth", "Established"] as const;

// Fields the research/evaluation steps consider "load-bearing" for a human
// decision. If the model can't confirm one of these, it goes into
// missingFields rather than being silently defaulted.
export const CRITICAL_FIELDS = ["amount", "deadline", "eligibilitySummary"] as const;
