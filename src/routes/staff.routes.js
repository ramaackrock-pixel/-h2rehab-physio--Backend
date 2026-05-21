import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
    getAllStaff, 
    addStaff, 
    updateStaff, 
    deleteStaff,
    selfCheckIn,
    selfCheckOut,
    getMyProfile
} from '../controller/staff.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(verifyJWT);

router.route('/profile/me').get(getMyProfile);
router.route('/attendance/check-in').post(selfCheckIn);
router.route('/attendance/check-out').post(selfCheckOut);

router.route('/')
    .get(getAllStaff)
    .post(upload.single('degreeCertificate'), addStaff);

router.route('/:id')
    .put(upload.single('degreeCertificate'), updateStaff)
    .delete(deleteStaff);

export default router;
