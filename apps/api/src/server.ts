import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth';
import issuesRoutes from './routes/issues';
import kpisRoutes from './routes/kpis';
import usersRoutes from './routes/users';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://localhost:8080'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'A10 API',
    message: 'API is running'
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/kpis', kpisRoutes);
app.use('/api/users', usersRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`A10 API running on port ${port}`);
});
