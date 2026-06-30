import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { metricsHandler, metricsMiddleware } from './middleware/metrics';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import organizationsRoutes from './modules/organizations/organizations.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import candidatesRoutes from './modules/candidates/candidates.routes';
import resumesRoutes from './modules/resumes/resumes.routes';
import applicationsRoutes from './modules/applications/applications.routes';
import notesRoutes from './modules/notes/notes.routes';
import tagsRoutes from './modules/tags/tags.routes';
import aiRoutes from './modules/ai/ai.routes';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^https?:\/\/(localhost|13\.211\.245\.10|ae125093641f24af4ac30286ca1ced7e-720528369\.ap-southeast-2\.elb\.amazonaws\.com|a0a1344ed1d264414b183cd01040cdc2-551043906\.ap-southeast-2\.elb\.amazonaws\.com)(:\d+)?$/.test(origin)) {

        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

const uploadsPath = path.resolve(__dirname, '..', config.uploadDir);
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.get('/metrics', metricsHandler);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/ai', aiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
