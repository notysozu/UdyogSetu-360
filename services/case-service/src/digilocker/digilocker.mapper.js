function mapDigiLockerDocument(document) {
  return {
    documentType: document.documentType,
    uri: document.uri,
    issuerName: document.issuerName,
    digilockerDocumentId: document.digilockerDocumentId,
    storageProvider: 'digilocker_reference'
  };
}

module.exports = { mapDigiLockerDocument };
