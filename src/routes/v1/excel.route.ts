import express from 'express';
import multer from 'multer';
import { excelController } from '../../controllers';
import auth from '../../middlewares/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an Excel file'));
    }
  }
});

router.route('/upload').post(auth(), upload.single('file'), excelController.uploadExcelFile);

router.route('/validate').post(auth(), upload.single('file'), excelController.validateExcelFile);

export default router;
