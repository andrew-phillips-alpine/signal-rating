const env = require('../../config/env');
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));

async function sendErrorAlert(context) {
  if (!env.formEndpoint) {
    console.warn('FORM_ENDPOINT not configured; skipping alert');
    return;
  }

  const payload = {
    app: env.appName,
    message: context.message || 'Unhandled error',
    stack: context.stack,
    timestamp: new Date().toISOString(),
    meta: context.meta || {}
  };

  try {
    await fetch(env.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send error alert', err);
  }
}

module.exports = { sendErrorAlert };
