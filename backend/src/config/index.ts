import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/recruitflow',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'recruitflow-ai',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  groqApiKey:       process.env.GROQ_API_KEY || '',
  groqModel:        process.env.GROQ_MODEL || 'llama3-70b-8192',
  uploadDir:        process.env.UPLOAD_DIR || '../uploads',
  nodeEnv:          process.env.NODE_ENV || 'development',
  s3: {
    region:          process.env.AWS_REGION || 'ap-southeast-2',
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucket:          process.env.AWS_S3_BUCKET_NAME || '',
  } as const,
} as const;
