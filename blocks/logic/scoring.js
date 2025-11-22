const path = require('path');
const fs = require('fs');
const { sendErrorAlert } = require('../communication/error-alert');

function loadQuestions() {
  const filePath = path.join(process.cwd(), 'public', 'wizard_questions.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function loadFixLibrary() {
  const filePath = path.join(process.cwd(), 'fix_library.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function formatMetricValue(metricName, value) {
  if (metricName.includes('Rate') || metricName.includes('Conversion') || metricName.includes('Retention')) {
    return `${Math.round(value * 100)}%`;
  } else if (metricName.includes('Time') || metricName.includes('Length') || metricName.includes('Period')) {
    return `${Math.round(value)} days`;
  } else if (metricName.includes('Ratio')) {
    return `${value.toFixed(1)}:1`;
  }
  return value.toFixed(2);
}

function detectPatterns(answers, pipelineScore, conversionScore, expansionScore) {
  const patterns = [];
  const pipelineRating = parseInt(answers.question_1_pipeline_health) || 3;
  const conversionRating = parseInt(answers.question_2_sales_conversion) || 3;
  const expansionRating = parseInt(answers.question_3_customer_success) || 3;
  const economicsRating = parseInt(answers.question_4_economics_and_efficiency) || 3;

  if (pipelineRating >= 4 && conversionRating <= 2) {
    patterns.push({ pattern: 'pipeline_conversion_gap', description: 'Strong pipeline but weak conversion - focus on sales enablement', priority: 'high' });
  }
  if (conversionRating >= 4 && expansionRating <= 2) {
    patterns.push({ pattern: 'leaky_bucket', description: 'Acquiring customers but losing them - prioritize customer success', priority: 'critical' });
  }
  if (pipelineRating <= 2 && conversionRating <= 2 && expansionRating <= 2) {
    patterns.push({ pattern: 'systematic_issues', description: 'Multiple weak areas suggest fundamental GTM challenges', priority: 'critical' });
  }
  if (economicsRating <= 2 && (pipelineRating >= 3 || conversionRating >= 3)) {
    patterns.push({ pattern: 'unit_economics_problem', description: 'Operations functional but economics unsustainable', priority: 'high' });
  }
  return patterns;
}

function calculateScores(answers) {
  try {
    const questions = loadQuestions().questions;
    const fixLibrary = loadFixLibrary();
    const pipelineRating = parseInt(answers.question_1_pipeline_health) || 3;
    const conversionRating = parseInt(answers.question_2_sales_conversion) || 3;
    const expansionRating = parseInt(answers.question_3_customer_success) || 3;
    const economicsRating = parseInt(answers.question_4_economics_and_efficiency) || 3;
    const topChallenge = answers.question_5_top_challenge || 'pipeline';

    const pipelineMetrics = questions.question_1_pipeline_health.maps_to_metrics[pipelineRating.toString()];
    const conversionMetrics = questions.question_2_sales_conversion.maps_to_metrics[conversionRating.toString()];
    const expansionMetrics = questions.question_3_customer_success.maps_to_metrics[expansionRating.toString()];
    const economicsMetrics = questions.question_4_economics_and_efficiency.maps_to_metrics[economicsRating.toString()];

    const pipelineScore =
      (pipelineMetrics.lead_velocity_rate / 0.12) * 0.25 +
      (pipelineMetrics.mql_to_sql_conversion / 0.28) * 0.25 +
      (pipelineMetrics.marketing_contribution_pipeline / 0.38) * 0.2 +
      (pipelineMetrics.pipeline_coverage_ratio / 3.8) * 0.15 +
      (pipelineMetrics.inbound_lead_volume_growth / 0.25) * 0.1 +
      (1 - pipelineMetrics.lead_response_time / 24) * 0.05;

    const conversionScore =
      (conversionMetrics.win_rate / 0.32) * 0.3 +
      (1 - conversionMetrics.sales_cycle_length / 180) * 0.2 +
      (conversionMetrics.sql_acceptance_rate / 0.9) * 0.15 +
      (conversionMetrics.demo_to_proposal_rate / 0.72) * 0.15 +
      (conversionMetrics.proposal_to_won_rate / 0.68) * 0.1 +
      (conversionMetrics.pipeline_conversion_rate / 0.42) * 0.1;

    const expansionScore =
      (expansionMetrics.nrr / 1.2) * 0.3 +
      (expansionMetrics.grr / 0.98) * 0.2 +
      (1 - expansionMetrics.churn_rate) * 0.2 +
      (expansionMetrics.expansion_revenue_growth / 0.28) * 0.15 +
      (expansionMetrics.nps / 58) * 0.1 +
      (1 - expansionMetrics.time_to_first_value / 60) * 0.05;

    let weights = { pipeline: 0.3, conversion: 0.3, expansion: 0.25, economics: 0.15 };
    const challengeWeightMap = { pipeline: 'pipeline', conversion: 'conversion', retention: 'expansion' };
    if (challengeWeightMap[topChallenge]) {
      const focus = challengeWeightMap[topChallenge];
      weights[focus] *= 1.15;
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      Object.keys(weights).forEach((k) => (weights[k] = weights[k] / total));
    }

    const economicsScore =
      (1 - economicsMetrics.cac_payback_period / 26) * 0.2 +
      (economicsMetrics.ltv_cac / 5.8) * 0.2 +
      (1 - economicsMetrics.burn_multiple / 4.0) * 0.15 +
      (1 - economicsMetrics.sales_rep_ramp_time / 6.5) * 0.1 +
      (economicsMetrics.quota_attainment / 0.88) * 0.15 +
      (economicsMetrics.magic_number / 1.25) * 0.1 +
      (economicsMetrics.rule_of_40 / 62) * 0.1;

    const overall =
      pipelineScore * weights.pipeline +
      conversionScore * weights.conversion +
      expansionScore * weights.expansion +
      economicsScore * weights.economics;

    const allMetrics = [
      { name: 'Lead Velocity Rate', score: pipelineMetrics.lead_velocity_rate / 0.12, loop: 'Pipeline', value: pipelineMetrics.lead_velocity_rate },
      { name: 'MQL to SQL Conversion', score: pipelineMetrics.mql_to_sql_conversion / 0.28, loop: 'Pipeline', value: pipelineMetrics.mql_to_sql_conversion },
      { name: 'Lead Response Time', score: 1 - pipelineMetrics.lead_response_time / 24, loop: 'Pipeline', value: pipelineMetrics.lead_response_time },
      { name: 'Win Rate', score: conversionMetrics.win_rate / 0.32, loop: 'Conversion', value: conversionMetrics.win_rate },
      { name: 'Sales Cycle Length', score: 1 - conversionMetrics.sales_cycle_length / 180, loop: 'Conversion', value: conversionMetrics.sales_cycle_length },
      { name: 'Net Revenue Retention', score: expansionMetrics.nrr / 1.2, loop: 'Expansion', value: expansionMetrics.nrr },
      { name: 'Churn Rate', score: 1 - expansionMetrics.churn_rate, loop: 'Expansion', value: expansionMetrics.churn_rate },
      { name: 'CAC Payback Period', score: 1 - economicsMetrics.cac_payback_period / 26, loop: 'Economics', value: economicsMetrics.cac_payback_period },
      { name: 'LTV:CAC Ratio', score: economicsMetrics.ltv_cac / 5.8, loop: 'Economics', value: economicsMetrics.ltv_cac }
    ];

    const priorityRecommendations = selectFixes(
      { Pipeline: pipelineScore, Conversion: conversionScore, Expansion: expansionScore },
      fixLibrary
    );

    return {
      overall_ssi: Math.max(0, Math.min(1, overall)),
      loop_scores: {
        Pipeline: Math.max(0, Math.min(1, pipelineScore)),
        Conversion: Math.max(0, Math.min(1, conversionScore)),
        Expansion: Math.max(0, Math.min(1, expansionScore))
      },
      priority_recommendations: priorityRecommendations,
      detected_patterns: detectPatterns(answers, pipelineScore, conversionScore, expansionScore)
    };
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'scoring' } });
    throw err;
  }
}

function selectFixes(loopScores, fixLibrary) {
  const loops = [
    { name: 'Pipeline', score: loopScores.Pipeline, key: 'pipeline_fixes' },
    { name: 'Conversion', score: loopScores.Conversion, key: 'conversion_fixes' },
    { name: 'Expansion', score: loopScores.Expansion, key: 'expansion_fixes' }
  ].sort((a, b) => a.score - b.score);

  const picks = [];
  loops.forEach((loop, idx) => {
    const fixes = fixLibrary[loop.key] || [];
    if (fixes.length === 0) return;
    const take = idx === 0 ? 2 : 1; // weakest gets 2 plays, others 1
    fixes.slice(0, take).forEach((fix) => {
      picks.push({
        name: fix.name,
        loop: loop.name,
        description: fix.description,
        impact: fix.impact || '',
        action: fix.implementation ? `Implement in ${fix.implementation}` : undefined
      });
    });
  });
  return picks;
}

module.exports = { calculateScores };
