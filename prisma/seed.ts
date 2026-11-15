import { PrismaClient } from "@prisma/client";
import { demoOpportunities } from "../lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${demoOpportunities.length} demo opportunities...`);

  for (const opp of demoOpportunities) {
    await prisma.opportunity.upsert({
      where: { programUrl_grantName: { programUrl: opp.programUrl, grantName: opp.grantName } },
      update: {},
      create: {
        grantName: opp.grantName,
        funderName: opp.funderName,
        programUrl: opp.programUrl,
        country: opp.country,
        region: opp.region,
        category: opp.category,
        fundingType: opp.fundingType,
        applicantType: opp.applicantType,
        sourceType: opp.sourceType,
        amount: opp.amount,
        deadline: opp.deadline,
        urgency: opp.urgency,
        eligibilitySummary: opp.eligibilitySummary,
        discoveryNote: opp.discoveryNote,
        applicationAngle: opp.applicationAngle,
        aiFitScore: opp.aiFitScore,
        aiEligibilityGuess: opp.aiEligibilityGuess,
        missingFields: JSON.stringify(opp.missingFields),
        discoverySource: opp.discoverySource,
        citations: {
          create: opp.citations.map((c) => ({ url: c.url, title: c.title }))
        }
      }
    });
  }

  const existingProfile = await prisma.orgProfile.findUnique({ where: { id: "default" } });
  if (!existingProfile) {
    console.log("Seeding a sample organization profile (demo)...");
    await prisma.orgProfile.create({
      data: {
        id: "default",
        orgName: "Sample Co. (demo profile — edit me)",
        orgType: "Startup",
        country: "Canada",
        region: "Ontario",
        stage: "Early revenue",
        teamSize: "3",
        description:
          "Example profile: an early-stage software company with modest revenue, based in Ontario. Replace this with your own organization's details on the Profile page.",
        fundingNeeded: "CAD $25,000–$75,000"
      }
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
