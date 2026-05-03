class StorageProviderInterface {
  async initialise() {
    return this;
  }

  async healthCheck() {
    throw new Error('healthCheck not implemented');
  }

  async putObject() {
    throw new Error('putObject not implemented');
  }

  async getObject() {
    throw new Error('getObject not implemented');
  }

  async deleteObject() {
    throw new Error('deleteObject not implemented');
  }

  async objectExists() {
    throw new Error('objectExists not implemented');
  }

  async createSignedUploadUrl() {
    throw new Error('createSignedUploadUrl not implemented');
  }

  async createSignedDownloadUrl() {
    throw new Error('createSignedDownloadUrl not implemented');
  }

  async copyObject() {
    throw new Error('copyObject not implemented');
  }

  async getObjectMetadata() {
    throw new Error('getObjectMetadata not implemented');
  }
}

module.exports = { StorageProviderInterface };
