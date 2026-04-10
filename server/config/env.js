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
};

module.exports = {
  parseAllowedOrigins,
  validateEnv,
};
