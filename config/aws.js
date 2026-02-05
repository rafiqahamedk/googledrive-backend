const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Test S3 connection
const testS3Connection = async () => {
  try {
    await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
    console.log('✅ S3 connection successful');
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
  }
};

// Generate signed URL for file download
const generateSignedUrl = (key, expires = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: expires
  });
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

module.exports = {
  s3,
  testS3Connection,
  generateSignedUrl,
  deleteFromS3
};