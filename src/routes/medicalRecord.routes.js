import express from 'express';
import multer from 'multer';
import { getRecords, createRecord, deleteRecord } from '../controller/medicalRecord.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import path from 'path';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for PDF and images
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(verifyJWT);

router.route('/')
  .get(getRecords)
  .post(upload.single('file'), createRecord);

router.route('/:id')
  .delete(deleteRecord);

export default router;
