import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(
      `RecruitFlow AI server running on port ${config.port} in ${config.nodeEnv} mode`,
    );
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
