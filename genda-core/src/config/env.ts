import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  timezone: process.env.APP_TIMEZONE || 'America/Sao_Paulo',
  jwtSecret: process.env.JWT_SECRET || 'genda-dev-jwt-secret-2026',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || 'suporte@genda-app.com.br',
  },
  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    bucket: process.env.R2_BUCKET || 'genda-dev',
    region: process.env.R2_REGION || 'auto',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },
};
