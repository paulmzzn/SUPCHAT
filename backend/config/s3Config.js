import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure AWS SDK with explicit credentials
const s3Config = {
  region: process.env.AWS_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Create S3 service object with explicit configuration
const s3 = new AWS.S3(s3Config);

// S3 bucket name - CHANGED TO MATCH YOUR ENV VARIABLE
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Log configuration status (without revealing sensitive data)
console.log(`S3 Configuration: Region=${s3Config.region}, Bucket=${BUCKET_NAME}, Credentials: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);

// Update the uploadToS3 function to return the correct URL format
export const uploadToS3 = async (file, folder = 'workspaces') => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !BUCKET_NAME) {
    throw new Error("AWS credentials or bucket name not configured");
  }

  try {
    const fileContent = file.buffer;
    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: file.mimetype
    };
    
    console.log(`Attempting to upload to S3 bucket: ${BUCKET_NAME}`);
    
    // Upload to S3
    await s3.upload(params).promise();
    
    // Construct the correct URL format with region
    const region = process.env.AWS_REGION || 'us-east-1';
    const correctUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;
    
    console.log(`Generated S3 URL: ${correctUrl}`);
    return correctUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

// Also update the deleteFromS3 function to handle the correct URL format
export const deleteFromS3 = async (url) => {
  if (!url) {
    console.warn("No URL provided, skipping delete");
    return false;
  }
  
  try {
    // Extract the key from the region-specific URL format
    // Example: https://REDACTED.s3.us-east-1.amazonaws.com/workspaces/banners/file.png
    
    // Find the position after the bucket name and region in the URL
    const bucketWithRegionPattern = `${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
    
    // Extract the key (everything after the bucket and region)
    const startPos = url.indexOf(bucketWithRegionPattern);
    if (startPos === -1) {
      throw new Error("Invalid S3 URL format");
    }
    
    const key = url.substring(startPos + bucketWithRegionPattern.length);
    
    if (!key) {
      throw new Error("Invalid S3 URL - could not extract key");
    }
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return false;
  }
};

export default s3;