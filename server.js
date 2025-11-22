require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const env = require('./config/env');
const { calculateScores } = require('./blocks/logic/scoring');
const { save, readAll } = require('./blocks/storage/submissions');
const { generatePdf } = require('./blocks/logic/pdf');
const { sendErrorAlert } = require('./blocks/communication/error-alert');
const { wizardRequestSchema } = require('./blocks/shared/schemas');

const app = express();
const PORT = env.port || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
const outDir = path.join(process.cwd(), 'out');
app.use(express.static(outDir));

app.post('/api/wizard', (req, res) => {
  try {
    const parsed = wizardRequestSchema.parse(req.body);
    const results = calculateScores(parsed.answers || {});
    const clientId = parsed.client_id || `wizard_${Date.now()}`;
    const submission = {
      client_id: clientId,
      timestamp: new Date().toISOString(),
      client_name: parsed.client_name || parsed.answers?.company_name || 'Unknown',
      email: parsed.email || parsed.answers?.user_email || '',
      cohort: parsed.answers?.arr || 'unknown',
      sector: parsed.answers?.sector || 'unknown',
      employees: parsed.answers?.employees || 'unknown',
      answers: parsed.answers,
      scores: results.loop_scores,
      overall_ssi: results.overall_ssi,
      patterns: results.detected_patterns || []
    };
    save(submission);
    res.json({
      success: true,
      client_id: clientId,
      overall_ssi: results.overall_ssi,
      loop_scores: results.loop_scores,
      priority_recommendations: results.priority_recommendations,
      detected_patterns: results.detected_patterns
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.issues });
    }
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'api/wizard' } });
    res.status(503).json({ error: 'Failed to process submission' });
  }
});

app.get('/api/submissions', (req, res) => {
  try {
    const { cohort, sector, start_date, end_date } = req.query;
    let submissions = readAll();
    if (cohort) submissions = submissions.filter((s) => s.cohort === cohort);
    if (sector) submissions = submissions.filter((s) => s.sector === sector);
    if (start_date) submissions = submissions.filter((s) => new Date(s.timestamp) >= new Date(start_date));
    if (end_date) {
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
      submissions = submissions.filter((s) => new Date(s.timestamp) <= end);
    }
    res.json({ submissions, total: submissions.length });
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'api/submissions' } });
    res.status(503).json({ error: 'Failed to read submissions' });
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const body = req.body || {};
    const results = body;
    const { filename, pdfPath } = await generatePdf(results);
    const downloadUrl = `/api/downloads/${filename}`;
    res.json({ filename, downloadUrl });
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'api/generate-pdf' } });
    res.status(503).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/downloads/:file', (req, res) => {
  const pdfPath = path.join(process.cwd(), 'temp_pdfs', req.params.file);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(pdfPath);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Alpine Signal Rating API is running' });
});

app.get('/signal-rating.html', (req, res) => {
  const target = path.join(outDir, 'signal-rating.html');
  if (fs.existsSync(target)) return res.sendFile(target);
  return res.status(404).send('Not found');
});

app.get('*', (req, res) => {
  const preferred = path.join(outDir, 'signal-rating.html');
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(preferred)) {
    res.sendFile(preferred);
  } else if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
