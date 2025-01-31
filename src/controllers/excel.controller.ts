import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { excelUploadService } from '../services';
import 'multer';

interface MulterRequest extends Request {
  file?: Express.Multer.File; // Correctly referencing Multer's File type
}

const uploadExcelFile = catchAsync(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'Please upload an Excel file' });
    return;
  }

  const updateExisting = req.body.updateExisting === 'true';
  const result = await excelUploadService.uploadExcel(req.file.buffer, updateExisting);

  res.status(httpStatus.OK).send({
    message: 'File processed successfully',
    summary: {
      totalProcessed: result.success + result.failed,
      successCount: result.success,
      failedCount: result.failed,
      batchResults: result.batchResults
    },
    errors: result.errors
  });
});

const validateExcelFile = catchAsync(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'Please upload an Excel file' });
    return;
  }

  await excelUploadService.validateExcelFile(req.file.buffer);
  res.status(httpStatus.OK).send({ message: 'File format is valid' });
});

export default {
  uploadExcelFile,
  validateExcelFile
};
