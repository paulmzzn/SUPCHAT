import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure AWS SDK with explicit credentials for Scaleway
const s3Config = {
  region: process.env.SCW_REGION || 'fr-par',
  endpoint: process.env.SCW_ENDPOINT || 'https://s3.fr-par.scw.cloud/',
  credentials: {
    accessKeyId: process.env.SCW_ACCESS_KEY_ID || 'SCW2E3VS5F51RVG9WQJA',
    secretAccessKey: process.env.SCW_SECRET_ACCESS_KEY || '9dee615d-2a3e-4f47-aabd-728a5eec1438'
  },
  s3ForcePathStyle: true // Required for Scaleway S3 compatibility
};

// Create S3 service object with explicit configuration
const s3 = new AWS.S3(s3Config);

// S3 bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Log configuration status (without revealing sensitive data)
console.log(`S3 Configuration: Region=${s3Config.region}, Bucket=${BUCKET_NAME}, Endpoint=${s3Config.endpoint}, Credentials: ${s3Config.credentials.accessKeyId ? 'Set' : 'Not set'}`);

// Update the uploadToS3 function to return the correct URL format for Scaleway
export const uploadToS3 = async (file, folder = 'workspaces') => {
  if (!s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey || !BUCKET_NAME) {
    throw new Error("Scaleway S3 credentials or bucket name not configured");
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
    
    console.log(`Attempting to upload to Scaleway S3 bucket: ${BUCKET_NAME}`);
    
    // Upload to S3
    await s3.upload(params).promise();
    
    // Construct the correct URL format for Scaleway S3
    const correctUrl = `${s3Config.endpoint}${BUCKET_NAME}/${fileName}`.replace(/([^:])\/\/+/g, '$1/');
    
    console.log(`Generated Scaleway S3 URL: ${correctUrl}`);
    return correctUrl;
  } catch (error) {
    console.error("Error uploading to Scaleway S3:", error);
    throw error;
  }
};

// Update the deleteFromS3 function to handle Scaleway S3 URL format
export const deleteFromS3 = async (url) => {
  if (!url) {
    console.warn("No URL provided, skipping delete");
    return false;
  }
  
  try {
    // Extract the key from Scaleway S3 URL format
    // Example: https://s3.fr-par.scw.cloud/bucket-name/workspaces/file.png
    let key;
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract the part after the bucket name
    const bucketPrefix = `/${BUCKET_NAME}/`;
    if (pathname.startsWith(bucketPrefix)) {
      key = pathname.substring(bucketPrefix.length);
    } else {
      // Alternative approach: try to find the key after the last occurrence of bucket name
      const pathParts = pathname.split('/').filter(Boolean);
      const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        key = pathParts.slice(bucketIndex + 1).join('/');
      } else {
        throw new Error(`Could not extract key from URL: ${url}`);
      }
    }
    
    if (!key) {
      throw new Error("Invalid Scaleway S3 URL - could not extract key");
    }
    
    console.log(`Deleting object with key: ${key} from bucket: ${BUCKET_NAME}`);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting from Scaleway S3:", error);
    return false;
  }
};

export default s3;