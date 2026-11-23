import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { pool } from './config/db';
import { env } from './config/env';
import { isR2Configured } from './config/r2';
import { adminRouter } from './routes/admin.routes';
import { publicRouter } from './routes/public.routes';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(',').map((s) => s.trim()),
  })
);
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'genda-core',
      database: 'connected',
      r2Configured: isR2Configured(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'genda-core',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[genda-core error]', err);
  const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
  res.status(500).json({ error: message });
});

app.listen(env.port, () => {
  console.log(`genda-core rodando na porta ${env.port}`);
});
