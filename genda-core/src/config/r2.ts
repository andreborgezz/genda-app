import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { env } from './env';

export function isR2Configured(): boolean {
  return Boolean(
    env.r2.endpoint &&
      env.r2.bucket &&
      env.r2.accessKeyId &&
      env.r2.secretAccessKey
  );
}

function getR2Client(): S3Client {
  return new S3Client({
    region: env.r2.region,
    endpoint: env.r2.endpoint,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey,
    },
  });
}

export async function uploadImageToR2(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
}): Promise<{ key: string; url: string }> {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 não configurado. Defina R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env do genda-core.'
    );
  }

  const ext = path.extname(params.originalName) || '.png';
  const folder = (params.folder || 'uploads').replace(/^\/+|\/+$/g, '');
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.mimeType,
    })
  );

  const baseUrl = (env.r2.publicUrl || `${env.r2.endpoint}/${env.r2.bucket}`).replace(
    /\/+$/,
    ''
  );
  return {
    key,
    url: `${baseUrl}/${key}`,
  };
}
