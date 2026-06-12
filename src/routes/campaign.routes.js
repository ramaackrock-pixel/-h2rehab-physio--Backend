import express from 'express';
import multer from 'multer';
import { sendCampaign, getCampaignStatus, resetCampaignBadges } from '../controller/campaign.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import path from 'path';

const router = express.Router();

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
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.use(verifyJWT);

router.route('/status').get(getCampaignStatus);
router.route('/send-all').post(upload.single('image'), sendCampaign);
router.route('/reset-badges').post(resetCampaignBadges);

export default router;
