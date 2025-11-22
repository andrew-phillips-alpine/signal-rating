const env = {
  appName: process.env.APP_NAME || 'alpine-signal-rating',
  formEndpoint: process.env.FORM_ENDPOINT || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  emailTo: process.env.EMAIL_TO || '',
  port: parseInt(process.env.PORT || '3000', 10)
};

module.exports = env;
