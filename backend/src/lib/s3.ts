import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { config } from '../config';

const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export async function uploadToS3(
  file: Express.Multer.File,
  orgId: string,
): Promise<{ key: string; url: string }> {
  const ext = path.extname(file.originalname);
  const key = `resumes/${orgId}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const url = `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;

  return { key, url };
}
