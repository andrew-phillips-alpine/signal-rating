const fs = require('fs');
const path = require('path');
const { sendErrorAlert } = require('../communication/error-alert');

const dataPath = path.join(process.cwd(), 'submissions_data.json');

function readAll() {
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'storage.read' } });
    return [];
  }
}

function save(submission) {
  const existing = readAll();
  existing.push(submission);
  try {
    fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));
  } catch (err) {
    sendErrorAlert({ message: err.message, stack: err.stack, meta: { scope: 'storage.write' } });
  }
}

module.exports = { readAll, save };
