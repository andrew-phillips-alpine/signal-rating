const { z } = require('zod');

const answerSchema = z.object({
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

const wizardRequestSchema = z.object({
  answers: answerSchema,
  client_name: z.string().optional(),
  client_id: z.string().optional(),
  email: z.string().optional()
});

module.exports = { answerSchema, wizardRequestSchema };
