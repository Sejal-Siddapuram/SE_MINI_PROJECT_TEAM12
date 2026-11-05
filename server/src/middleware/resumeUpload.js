const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

/**
 * Resume upload checks (FR-03, SR-05, SAD 3.7):
 * - PDF only, at most 2 MB
 * - the file must really be a PDF (starts with "%PDF-"), not just named .pdf
 * - stored outside the public folders under a random name; only the name is saved in MongoDB
 */
const MAX_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => cb(null, `${req.user.id}-${crypto.randomUUID()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const isPdfName = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (file.mimetype !== 'application/pdf' || !isPdfName) {
      return cb(new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only PDF files can be uploaded.'));
    }
    return cb(null, true);
  },
}).single('resume');

function startsWithPdfSignature(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    return buffer.toString('ascii') === '%PDF-';
  } finally {
    fs.closeSync(fd);
  }
}

function resumeUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof AppError) return next(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(413, 'FILE_TOO_LARGE', 'The resume must be 2 MB or smaller.'));
      }
      return next(new AppError(400, 'UPLOAD_ERROR', 'The file could not be uploaded.'));
    }
    if (!req.file) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Choose a PDF file to upload.', [
        { field: 'resume', message: 'Choose a PDF file to upload.' },
      ]));
    }
    // A renamed .exe still says "application/pdf"; check the actual file contents
    if (!startsWithPdfSignature(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return next(new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'This file is not a valid PDF.'));
    }
    return next();
  });
}

module.exports = { resumeUpload, UPLOAD_DIR, MAX_BYTES };
