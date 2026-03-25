import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { SERVER_CONFIG } from "../constants/config";

const getEndpoint = () => {
  let endpoint = SERVER_CONFIG.S3_ENDPOINT;
  if (!endpoint) return undefined;

  // Ensure protocol is present
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `http://${endpoint}`;
  }

  // If endpoint doesn't have a port and S3_PORT is provided, append it
  const protocolEndIndex = endpoint.indexOf("//") + 2;
  if (SERVER_CONFIG.S3_PORT && !endpoint.includes(":", protocolEndIndex)) {
    return `${endpoint}:${SERVER_CONFIG.S3_PORT}`;
  }
  return endpoint;
};

export const s3Client = new S3Client({
  endpoint: getEndpoint(),
  region: SERVER_CONFIG.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: SERVER_CONFIG.S3_ACCESS_KEY,
    secretAccessKey: SERVER_CONFIG.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

export const getPresignedDownloadUrl = async (key: string) => {
  try {
    const bucketName = SERVER_CONFIG.S3_BUCKET;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return presignedUrl;
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const uploadFileToS3 = async (buffer: Buffer, originalFilename: string, contentType: string) => {
  const fileId = uuid();
  const key = `${fileId}-${originalFilename.replace(/\s+/g, "_")}`;
  
  const command = new PutObjectCommand({
    Bucket: SERVER_CONFIG.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
};

export const deleteFromS3 = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: SERVER_CONFIG.S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};
