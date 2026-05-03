const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { validateFile } = require('../validators/document.validators');

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      const dir = path.join(os.tmpdir(), 'us360-document-uploads');
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '-')}`);
    }
  }),
  limits: {
    fileSize: Number(process.env.DOCUMENT_MAX_FILE_SIZE_MB || 25) * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    try {
      validateFile({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: 1
      });
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  }
});

module.exports = {
  singleDocumentUpload: upload.single('file'),
  multipleDocumentUpload: upload.array('files', 10)
};
