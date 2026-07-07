import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth';
import issuesRoutes from './routes/issues';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
