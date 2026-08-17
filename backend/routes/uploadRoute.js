import path from 'path';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import config from '../config';
import { isAuth, isAdmin } from '../util';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Only JPEG, PNG and WebP images are allowed.'));
};

// Random name + extension derived from the mime type: never trust
// file.originalname, which can contain path traversal sequences.
const randomFileName = (file) => {
  const extension = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype.split('/')[1];
  return `${crypto.randomBytes(16).toString('hex')}.${extension}`;
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, randomFileName(file));
  },
});

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

const router = express.Router();

router.post('/', isAuth, isAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No image uploaded.' });
  }
  return res.send(`/uploads/${path.basename(req.file.filename)}`);
});

aws.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
});
const s3 = new aws.S3();
const storageS3 = multerS3({
  s3,
  bucket: config.S3_BUCKET,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key(req, file, cb) {
    cb(null, randomFileName(file));
  },
});
const uploadS3 = multer({
  storage: storageS3,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
router.post('/s3', isAuth, isAdmin, uploadS3.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No image uploaded.' });
  }
  return res.send(req.file.location);
});
export default router;
