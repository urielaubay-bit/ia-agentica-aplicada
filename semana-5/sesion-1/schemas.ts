import { z } from "zod";

export const executiveReport = z.object({
  headline: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()).min(1).max(5),
  risks: z.array(z.string()).max(4),
  recommendedActions: z.array(z.object({
    action: z.string(), rationale: z.string(), expectedImpact: z.string(),
  })).min(1).max(4),
});
