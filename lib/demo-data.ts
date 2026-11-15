import { DiscoveredOpportunitySchema } from "./validation";
import { mapDiscoveredOpportunity, type Citation, type MappedOpportunity } from "./opportunity-mapper";

/**
 * DEMO MODE dataset.
 *
 * These are real, publicly known Canadian and US non-dilutive funding
 * programs (names, funders, and program URLs are accurate as of this
 * project's writing) used here as labeled sample data so the app is fully
 * explorable with no API key and no cost. Amounts/deadlines are kept
 * intentionally general ("Rolling", "Program dependent", a commonly-cited
 * cap) rather than a specific current date, because program details change
 * and this data is NOT re-verified on a schedule — exactly the kind of
 * claim the live research flow is supposed to verify, not this seed file.
 *
 * Each entry is written in the same shape the AI discovery step must
 * produce, then run through the same validation + mapping pipeline as live
 * results. That means: if this file doesn't pass `DiscoveredOpportunitySchema`,
 * the app won't start — demo data is held to the same bar as model output.
 */

interface RawDemoOpportunity {
  grant_name: string;
  funder_name: string;
  program_url: string;
  country: "Canada" | "United States" | "Canada/US";
  region: string;
  category: string;
  funding_type: string;
  amount: string;
  deadline: string;
  source: string;
  applicant_type: string;
  eligibility_summary: string;
  fit_score: "High" | "Medium" | "Low";
  urgency: string;
  initial_fit_guess: "Likely" | "Possible" | "Unlikely";
  discovery_note: string;
  application_angle: string;
  citations: Citation[];
}

const RAW_DEMO_OPPORTUNITIES: RawDemoOpportunity[] = [
  {
    grant_name: "Canada Digital Adoption Program",
    funder_name: "Government of Canada (ISED)",
    program_url: "https://ised-isde.canada.ca/site/canada-digital-adoption-program/en",
    country: "Canada",
    region: "National",
    category: "Small Business",
    funding_type: "Grant",
    amount: "Up to CAD $15,000",
    deadline: "Rolling / program dependent",
    source: "Government website",
    applicant_type: "Small business",
    eligibility_summary: "Supports eligible Canadian businesses adopting digital tools, with advisory support for implementation.",
    fit_score: "High",
    urgency: "Rolling",
    initial_fit_guess: "Likely",
    discovery_note: "Strong fit for small businesses looking to improve digital operations.",
    application_angle: "Position the project around measurable digital adoption and operational efficiency.",
    citations: [{ url: "https://ised-isde.canada.ca/site/canada-digital-adoption-program/en", title: "Canada Digital Adoption Program — ISED" }]
  },
  {
    grant_name: "Business Scale-up and Productivity Program",
    funder_name: "FedDev Ontario",
    program_url: "https://feddev-ontario.canada.ca/en/funding-southern-ontario/business-scale-and-productivity-southern-ontario",
    country: "Canada",
    region: "Ontario",
    category: "Startup",
    funding_type: "Loan",
    amount: "Repayable contribution, amount varies by project",
    deadline: "Program dependent",
    source: "Government website",
    applicant_type: "Growing business",
    eligibility_summary: "Supports high-growth businesses in southern Ontario scaling productivity and market expansion.",
    fit_score: "Medium",
    urgency: "Unknown",
    initial_fit_guess: "Possible",
    discovery_note: "Useful for companies with clear growth, revenue traction, and scaling plans.",
    application_angle: "Lead with job creation, productivity gains, and regional economic impact.",
    citations: [{ url: "https://feddev-ontario.canada.ca/en/funding-southern-ontario/business-scale-and-productivity-southern-ontario", title: "Business Scale-up and Productivity — FedDev Ontario" }]
  },
  {
    grant_name: "Industrial Research Assistance Program (IRAP)",
    funder_name: "National Research Council Canada",
    program_url: "https://nrc.canada.ca/en/support-technology-innovation",
    country: "Canada",
    region: "National",
    category: "Tech",
    funding_type: "Grant",
    amount: "Varies by project; non-repayable contribution",
    deadline: "Rolling",
    source: "Government website",
    applicant_type: "Small or medium technology business",
    eligibility_summary: "Advisory services and financial support for Canadian SMEs developing and commercializing technology.",
    fit_score: "High",
    urgency: "Rolling",
    initial_fit_guess: "Likely",
    discovery_note: "Strong fit for technical founders with an innovation project and a named Industrial Technology Advisor.",
    application_angle: "Emphasize technical risk, innovation novelty, and a clear commercialization plan.",
    citations: [{ url: "https://nrc.canada.ca/en/support-technology-innovation", title: "Industrial Research Assistance Program (IRAP) — NRC" }]
  },
  {
    grant_name: "Futurpreneur Startup Program",
    funder_name: "Futurpreneur Canada",
    program_url: "https://futurpreneur.ca/en/programs/start-up-program/",
    country: "Canada",
    region: "National",
    category: "Youth",
    funding_type: "Loan",
    amount: "Up to CAD $60,000 combined financing",
    deadline: "Rolling",
    source: "Nonprofit",
    applicant_type: "Entrepreneur aged 18–39",
    eligibility_summary: "Financing and mentorship for young Canadian entrepreneurs starting a business.",
    fit_score: "High",
    urgency: "Rolling",
    initial_fit_guess: "Likely",
    discovery_note: "Good fit for a youth-led founding team at the pre-revenue or early-revenue stage.",
    application_angle: "Lead with the founder's story and a concrete 2-year business plan.",
    citations: [{ url: "https://futurpreneur.ca/en/programs/start-up-program/", title: "Start-Up Program — Futurpreneur Canada" }]
  },
  {
    grant_name: "Mitacs Accelerate",
    funder_name: "Mitacs",
    program_url: "https://www.mitacs.ca/our-programs/accelerate/",
    country: "Canada",
    region: "National",
    category: "Research",
    funding_type: "Grant",
    amount: "CAD $15,000 per unit (typically 6 months of research)",
    deadline: "Rolling",
    source: "Nonprofit",
    applicant_type: "Company partnering with an academic researcher",
    eligibility_summary: "Co-funds applied research internships pairing graduate students/postdocs with industry partners.",
    fit_score: "Medium",
    urgency: "Rolling",
    initial_fit_guess: "Possible",
    discovery_note: "Relevant if the project has a defined R&D question an academic partner could help answer.",
    application_angle: "Frame the ask around a specific research problem, not general hiring.",
    citations: [{ url: "https://www.mitacs.ca/our-programs/accelerate/", title: "Mitacs Accelerate" }]
  },
  {
    grant_name: "Ontario Trillium Foundation Community Grants",
    funder_name: "Ontario Trillium Foundation",
    program_url: "https://otf.ca/our-grants",
    country: "Canada",
    region: "Ontario",
    category: "Nonprofit",
    funding_type: "Grant",
    amount: "Varies by grant stream",
    deadline: "Program dependent — see intake schedule",
    source: "Foundation website",
    applicant_type: "Nonprofit or charitable organization",
    eligibility_summary: "Supports Ontario nonprofits delivering community, health, or environmental programs.",
    fit_score: "Medium",
    urgency: "Unknown",
    initial_fit_guess: "Possible",
    discovery_note: "Relevant for registered nonprofits with an Ontario-based program, not for-profit ventures.",
    application_angle: "Lead with measurable community outcomes and organizational capacity.",
    citations: [{ url: "https://otf.ca/our-grants", title: "Our Grants — Ontario Trillium Foundation" }]
  },
  {
    grant_name: "America's Seed Fund (SBIR/STTR)",
    funder_name: "U.S. Small Business Administration / participating federal agencies",
    program_url: "https://www.sbir.gov/",
    country: "United States",
    region: "National",
    category: "Tech",
    funding_type: "Grant",
    amount: "Phase I/II awards, amount varies by agency",
    deadline: "Rolling / agency-specific windows",
    source: "Government website",
    applicant_type: "Small business, R&D-focused",
    eligibility_summary: "Non-dilutive federal R&D funding for small businesses, administered across multiple agencies.",
    fit_score: "Medium",
    urgency: "Rolling",
    initial_fit_guess: "Possible",
    discovery_note: "Relevant for deep-tech or scientific R&D with commercialization potential.",
    application_angle: "Match the proposal to a specific agency's stated R&D priorities.",
    citations: [{ url: "https://www.sbir.gov/", title: "America's Seed Fund — SBIR.gov" }]
  },
  {
    grant_name: "NSF Small Business Innovation Research Program",
    funder_name: "National Science Foundation",
    program_url: "https://seedfund.nsf.gov/",
    country: "United States",
    region: "National",
    category: "Tech",
    funding_type: "Grant",
    amount: "Up to USD $2M across phases",
    deadline: "Rolling / submission windows",
    source: "Government website",
    applicant_type: "Deep tech startup",
    eligibility_summary: "Supports early-stage US startups developing high-risk, high-impact technology.",
    fit_score: "Medium",
    urgency: "Rolling",
    initial_fit_guess: "Possible",
    discovery_note: "Relevant for technical startups with defensible innovation and a commercialization pathway.",
    application_angle: "Emphasize technical novelty, market need, and commercialization pathway.",
    citations: [{ url: "https://seedfund.nsf.gov/", title: "America's Seed Fund powered by NSF" }]
  },
  {
    grant_name: "Amber Grant for Women",
    funder_name: "WomensNet",
    program_url: "https://ambergrantsforwomen.com/",
    country: "United States",
    region: "National",
    category: "Women",
    funding_type: "Grant",
    amount: "Monthly USD $10,000 grants; annual USD $25,000 grant",
    deadline: "Monthly",
    source: "Foundation website",
    applicant_type: "Women-owned business",
    eligibility_summary: "Monthly grant opportunity for women entrepreneurs, open to applicants in the US and Canada.",
    fit_score: "High",
    urgency: "Open",
    initial_fit_guess: "Likely",
    discovery_note: "Accessible application format for women founders with a clear business story.",
    application_angle: "Tell a concise founder story with a specific, concrete use of funds.",
    citations: [{ url: "https://ambergrantsforwomen.com/", title: "Amber Grant for Women" }]
  },
  {
    grant_name: "Comcast RISE Investment Fund",
    funder_name: "Comcast",
    program_url: "https://www.comcastrise.com/",
    country: "United States",
    region: "National",
    category: "Small Business",
    funding_type: "Grant",
    amount: "Not stated",
    deadline: "Unknown",
    source: "Other",
    applicant_type: "Small business owned by an entrepreneur from an underrepresented group",
    eligibility_summary: "Grant and marketing/technology support for eligible small businesses; exact current terms not confirmed by this search.",
    fit_score: "Low",
    urgency: "Unknown",
    initial_fit_guess: "Possible",
    discovery_note: "Included as a known program, but current eligibility window and award details need direct verification.",
    application_angle: "Not enough verified detail yet to recommend a specific angle.",
    citations: [{ url: "https://www.comcastrise.com/", title: "Comcast RISE" }]
  },
  {
    grant_name: "Cartier Women's Initiative",
    funder_name: "Cartier",
    program_url: "https://www.cartierwomensinitiative.com/",
    country: "Canada/US",
    region: "National",
    category: "Women",
    funding_type: "Prize",
    amount: "Not stated",
    deadline: "Unknown",
    source: "Foundation website",
    applicant_type: "Woman-led impact-driven business",
    eligibility_summary: "International fellowship and funding program for women entrepreneurs with an impact-driven business; current cycle dates not confirmed by this search.",
    fit_score: "Low",
    urgency: "Unknown",
    initial_fit_guess: "Possible",
    discovery_note: "Competitive, international program — treat as a stretch opportunity pending verification of the current cycle.",
    application_angle: "Not enough verified detail yet to recommend a specific angle.",
    citations: [{ url: "https://www.cartierwomensinitiative.com/", title: "Cartier Women's Initiative" }]
  },
  {
    grant_name: "Innovate BC Ignite Program",
    funder_name: "Innovate BC",
    program_url: "https://innovatebc.ca/programs/ignite/",
    country: "Canada",
    region: "British Columbia",
    category: "Research",
    funding_type: "Grant",
    amount: "Up to CAD $300,000 (matched funding)",
    deadline: "Program dependent — see intake schedule",
    source: "Government website",
    applicant_type: "BC-based company partnering with a research institute",
    eligibility_summary: "Matched funding for BC companies co-developing technology with a public research institution.",
    fit_score: "Low",
    urgency: "Unknown",
    initial_fit_guess: "Unlikely",
    discovery_note: "Only relevant to BC-based applicants with a research partnership already in place.",
    application_angle: "Not applicable without a BC presence and an institutional research partner.",
    citations: [{ url: "https://innovatebc.ca/programs/ignite/", title: "Ignite Program — Innovate BC" }]
  },
  {
    grant_name: "Canada Summer Jobs",
    funder_name: "Employment and Social Development Canada",
    program_url: "https://www.canada.ca/en/employment-social-development/services/funding/canada-summer-jobs.html",
    country: "Canada",
    region: "National",
    category: "Youth",
    funding_type: "Grant",
    amount: "Wage subsidy, percentage varies by applicant type",
    deadline: "Annual intake — typically opens in winter",
    source: "Government website",
    applicant_type: "Employer hiring a student",
    eligibility_summary: "Wage subsidy for employers creating summer job placements for youth aged 15–30.",
    fit_score: "Low",
    urgency: "Unknown",
    initial_fit_guess: "Unlikely",
    discovery_note: "Only relevant if hiring a student for a summer placement, not general operating funding.",
    application_angle: "Not applicable unless the organization is hiring summer student staff.",
    citations: [{ url: "https://www.canada.ca/en/employment-social-development/services/funding/canada-summer-jobs.html", title: "Canada Summer Jobs" }]
  }
];

export const demoOpportunities: MappedOpportunity[] = RAW_DEMO_OPPORTUNITIES.map(({ citations, ...raw }) => {
  const validated = DiscoveredOpportunitySchema.parse(raw);
  return mapDiscoveredOpportunity(validated, citations, "demo");
});
