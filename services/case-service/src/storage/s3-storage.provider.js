const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { StorageProviderInterface } = require('./storage-provider.interface');

class S3StorageProvider extends StorageProviderInterface {
  constructor(config = {}) {
    super();
    this.config = config;
    this.bucket = config.bucket || process.env.S3_BUCKET;
    this.client = new S3Client({
      region: config.region || process.env.S3_REGION || 'ap-south-1',
      endpoint: config.endpoint || process.env.S3_ENDPOINT,
      forcePathStyle: String(config.forcePathStyle ?? process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
      credentials: {
        accessKeyId: config.accessKey || process.env.S3_ACCESS_KEY,
        secretAccessKey: config.secretKey || process.env.S3_SECRET_KEY
      }
    });
  }

  async healthCheck() {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: '__healthcheck__' })).catch(() => {});
      return { ok: true, provider: 's3', bucket: this.bucket };
    } catch (error) {
      return { ok: false, provider: 's3', bucket: this.bucket, message: error.message };
    }
  }

  async putObject({ objectKey, body, contentType, metadata = {} }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        Metadata: metadata
      })
    );
    return { bucket: this.bucket, objectKey };
  }

  async getObject({ objectKey }) {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    return result;
  }

  async deleteObject({ objectKey }) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    return { deleted: true };
  }

  async objectExists({ objectKey }) {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      return true;
    } catch (_error) {
      return false;
    }
  }

  async createSignedUploadUrl({ objectKey, contentType, expiresInSeconds, metadata = {} }) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
      Metadata: metadata
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    return { url, method: 'PUT', objectKey, expiresInSeconds };
  }

  async createSignedDownloadUrl({ objectKey, expiresInSeconds, responseContentDisposition }) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ResponseContentDisposition: responseContentDisposition
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    return { url, method: 'GET', objectKey, expiresInSeconds };
  }

  async copyObject({ sourceKey, destinationKey }) {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      })
    );
    return { copied: true };
  }

  async getObjectMetadata({ objectKey }) {
    const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    return result.Metadata || {};
  }
}

module.exports = { S3StorageProvider };
