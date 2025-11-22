const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { sendErrorAlert } = require('../communication/error-alert');

async function generatePdf(report) {
  const outputDir = path.join(process.cwd(), 'temp_pdfs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const filename = `alpine-gtm-report-${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, filename);

  const html = buildHtml(report);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
    return { filename, pdfPath };
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'pdf' } });
    throw err;
  }
}

function classify(score) {
  if (score >= 80) return 'dominant edge';
  if (score >= 65) return 'strong footing';
  if (score >= 50) return 'stabilize now';
  return 'critical focus';
}

function buildHtml(report) {
  const overall = Math.round((report.overall_ssi || 0) * 100);
  const pipeline = Math.round((report.loop_scores?.Pipeline || 0) * 100);
  const conversion = Math.round((report.loop_scores?.Conversion || 0) * 100);
  const expansion = Math.round((report.loop_scores?.Expansion || 0) * 100);
  const recommendations = report.priority_recommendations || [];
  const patterns = report.detected_patterns || [];

  const loops = [
    { name: 'Pipeline', score: pipeline, status: classify(pipeline), narrative: 'Stand up consistent demand, sharpen ICP, and tighten handoffs to keep pipeline predictable.' },
    { name: 'Conversion', score: conversion, status: classify(conversion), narrative: 'Shorten cycles and lift win rates with offer clarity, qualification rigor, and faster follow-up.' },
    { name: 'Expansion', score: expansion, status: classify(expansion), narrative: 'Reduce churn and unlock expansion by instrumenting health, accelerating time-to-value, and adding QBR rhythms.' }
  ];

  const weakestLoop = loops.slice().sort((a, b) => a.score - b.score)[0];

  return `
  <html>
    <head>
      <style>
        @page { margin: 0; }
        html { background: #00002c; }
        body { margin: 0; font-family: 'Montserrat', Arial, sans-serif; background: #00002c; color: #e5e7eb; }
        h1,h2,h3 { margin: 0 0 10px; color: #ffffff; }
        p { margin: 0 0 10px; color: #cdd2e1; line-height: 1.6; }
        .page { padding: 28px; }
        .cover { background: linear-gradient(135deg, #00002c 0%, #0b0b2f 60%, #0e1238 100%); border-radius: 18px; padding: 42px; }
        .score-hero { font-size: 90px; font-weight: 900; color: #00ffff; margin: 8px 0; }
        .tag { display: inline-block; padding: 6px 12px; border-radius: 999px; background: rgba(0,255,255,0.14); color: #00ffff; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(0,255,255,0.12); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .loop-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.12); border-radius: 12px; padding: 14px; }
        .section { page-break-after: always; }
        .list { list-style: none; padding: 0; margin: 0; }
        .list li { margin: 8px 0; }
        .rec-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .rec { background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.12); border-radius: 12px; padding: 12px; }
        .cta { margin-top: 12px; padding: 16px; text-align: center; border-radius: 12px; background: linear-gradient(135deg, #00ffff, #0060ff); font-weight: 800; }
        .cta a { color: #00002c; text-decoration: none; display: block; }
      </style>
    </head>
    <body>
      <div class="page section">
        <div class="cover">
          <div class="tag">Alpine Signal Rating</div>
          <h1 style="margin-top:12px;">GTM Diagnostic Report</h1>
          <p>Prepared for ${report.clientName || 'your company'}</p>
          <div class="score-hero">${overall}</div>
          <p>ASR™ across Pipeline, Conversion, and Expansion loops.</p>
          <div class="card">
            <h3>Executive Take</h3>
            <p>Your current GTM system shows <strong>${classify(overall)}</strong> characteristics. The most urgent recovery opportunity is in <strong>${weakestLoop.name}</strong>: ${weakestLoop.narrative}</p>
          </div>
        </div>
      </div>

      <div class="page section">
        <h2>Loop Health Snapshot</h2>
        <div class="grid">
          ${loops
            .map(
              (loop) => `
              <div class="loop-card">
                <div class="tag">${loop.name}</div>
                <h3>${loop.status}</h3>
                <p>${loop.narrative}</p>
              </div>
            `
            )
            .join('')}
        </div>
        <div class="card" style="margin-top:14px;">
          <h3>What to do first</h3>
          <p>Stabilize the weakest loop to stop leakage. Preserve the strongest loop by codifying what works. Sequence fixes to unlock compounding momentum.</p>
        </div>
      </div>

      <div class="page section">
        <h2>Priority Fixes</h2>
        <div class="rec-grid">
          ${recommendations
            .map(
              (rec) => `
              <div class="rec">
                <div class="tag">${rec.loop}</div>
                <h3>${rec.name}</h3>
                <p>${rec.description}</p>
                <p><strong>Action:</strong> Deliver this within 30 days to reverse the current trend.</p>
              </div>
            `
            )
            .join('')}
        </div>
        <div class="card" style="margin-top:14px;">
          <h3>Deploy these plays</h3>
          <ul class="list">
            <li>• Assign an owner and a two-week sprint per fix; confirm signal shift before moving on.</li>
            <li>• Pair each play with one KPI (win rate, retention, coverage) and review weekly.</li>
            <li>• Lock in what’s working in the strongest loop to prevent backslide.</li>
          </ul>
        </div>
      </div>

      <div class="page">
        <h2>Next Steps</h2>
        <div class="card">
          <p>Align GTM leaders on a 30-60-90 plan:</p>
          <ul class="list">
            <li>• 30 days: ship 1–2 fixes for the weakest loop; watch the KPI move.</li>
            <li>• 60 days: roll optimizations from the strongest loop into the middle performer.</li>
            <li>• 90 days: re-run ASR™ to quantify uplift and reprioritize.</li>
          </ul>
        </div>
        <div class="cta"><a href="https://calendly.com/thealpinesystem/gtm-assessment">Book a full GTM Diagnostic →</a></div>
      </div>
    </body>
  </html>
  `;
}

module.exports = { generatePdf };
