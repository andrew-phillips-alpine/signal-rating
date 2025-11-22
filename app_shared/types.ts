import { z } from 'zod';

export const answerSchema = z.object({
  question_1_pipeline_health: z.string().optional(),
  question_2_sales_conversion: z.string().optional(),
  question_3_customer_success: z.string().optional(),
  question_4_economics_and_efficiency: z.string().optional(),
  question_5_top_challenge: z.string().optional(),
  arr: z.string().optional(),
  employees: z.string().optional(),
  sector: z.string().optional(),
  user_email: z.string().email().optional(),
  company_name: z.string().optional()
});

export const wizardRequestSchema = z.object({
  answers: answerSchema,
  client_name: z.string().optional(),
  client_id: z.string().optional(),
  email: z.string().optional()
});

export type WizardRequest = z.infer<typeof wizardRequestSchema>;

export const loopScoresSchema = z.object({
  Pipeline: z.number(),
  Conversion: z.number(),
  Expansion: z.number()
});

export const wizardResponseSchema = z.object({
  success: z.boolean(),
  client_id: z.string().optional(),
  overall_ssi: z.number(),
  loop_scores: loopScoresSchema,
  priority_recommendations: z
    .array(
      z.object({
        name: z.string(),
        score: z.number(),
        loop: z.string(),
        description: z.string()
      })
    )
    .optional(),
  detected_patterns: z
    .array(
      z.object({
        pattern: z.string(),
        description: z.string(),
        priority: z.string()
      })
    )
    .optional()
});

export type WizardResponse = z.infer<typeof wizardResponseSchema>;
