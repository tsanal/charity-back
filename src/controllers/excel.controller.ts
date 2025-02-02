import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { excelUploadService } from '../services';
import ApiError from '../utils/ApiError';

const uploadExcelFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload an excel file');
  }

  const result = await excelUploadService.uploadExcel(req.file.buffer);
  res.status(httpStatus.OK).send(result);
});

const validateExcelFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload an excel file');
  }

  const result = await excelUploadService.validateExcelFile(req.file.buffer);
  res.status(httpStatus.OK).send(result);
});

export default {
  uploadExcelFile,
  validateExcelFile
};
