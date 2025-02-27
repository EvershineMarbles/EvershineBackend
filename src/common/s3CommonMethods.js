const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

// Create S3 client using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Function to upload object to S3
const putObject = async (data) => {
  try {
    const command = new PutObjectCommand(data);
    const response = await s3Client.send(command);

    if (response) {
      const { Bucket, Key } = data;
      return `https://${Bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${Key}`;
    }
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

module.exports = { putObject };