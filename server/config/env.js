const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];

const parseAllowedOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const validateEnv = () => {
  const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    const productionVars = ['SMTP_HOST', 'SMTP_FROM', 'CLIENT_URL', 'ALLOWED_ORIGINS'];
    const missingProductionVars = productionVars.filter((key) => !process.env[key]);
    if (missingProductionVars.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingProductionVars.join(', ')}`);
    }
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters in production');
    }
    if (parseAllowedOrigins(process.env.ALLOWED_ORIGINS).includes('*')) {
      throw new Error('ALLOWED_ORIGINS must list explicit origins in production');
    }
  }
};

module.exports = {
  parseAllowedOrigins,
  validateEnv,
};
