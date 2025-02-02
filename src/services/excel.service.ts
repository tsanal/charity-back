import { relationshipType, gender, upliftStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import personService from './person.service';
import prisma from '../client';

interface ExcelPerson {
  account: number;
  name: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  relationshipType?: string;
  county?: string;
  race?: string;
  gender?: string;
  upliftStatus?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  batchResults: Array<{
    batchNumber: number;
    processed: number;
    success: number;
    failed: number;
  }>;
  contactsWithInteractions: Array<{
    id: number;
    name: string;
    account: number;
    interactionCount: number;
  }>;
}

const BATCH_SIZE = 100; // Number of records to process in each batch

const normalizeData = (data: ExcelPerson): ExcelPerson => {
  return {
    ...data,
    relationshipType:
      data.relationshipType?.toUpperCase() === 'DONOR'
        ? 'Donor'
        : data.relationshipType?.toUpperCase() === 'PARTICIPANT'
        ? 'Participant'
        : data.relationshipType?.toUpperCase() === 'OUTREACH'
        ? 'Outreach'
        : data.relationshipType?.toUpperCase() === 'VOLUNTEER'
        ? 'Volunteer'
        : data.relationshipType?.toUpperCase() === 'GRANT'
        ? 'Grant'
        : data.relationshipType?.toUpperCase() === 'VENDOR'
        ? 'Vendor'
        : data.relationshipType?.toUpperCase() === 'MEDIA'
        ? 'Media'
        : '',
    gender:
      data.gender?.toUpperCase() === 'MALE'
        ? 'Male'
        : data.gender?.toUpperCase() === 'FEMALE'
        ? 'Female'
        : '',
    upliftStatus:
      data.upliftStatus?.toUpperCase() === 'ACTIVE'
        ? 'Active'
        : data.upliftStatus?.toUpperCase() === 'INACTIVE'
        ? 'Inactive'
        : data.upliftStatus?.toUpperCase() === 'PROSPECTIVE'
        ? 'Prospective'
        : ''
  };
};

const validatePersonData = (data: Partial<ExcelPerson>): string | null => {
  if (!data.name) {
    return 'Name is required';
  }
  if (!data.account || isNaN(Number(data.account))) {
    return 'Valid account number is required';
  }

  if (
    data.relationshipType &&
    data.relationshipType !== '' &&
    !Object.values(relationshipType).includes(data.relationshipType as relationshipType)
  ) {
    return `Invalid relationship type. Must be one of: ${Object.values(relationshipType).join(
      ', '
    )}`;
  }
  if (data.gender && data.gender !== '' && !Object.values(gender).includes(data.gender as gender)) {
    return `Invalid gender. Must be one of: ${Object.values(gender).join(', ')}`;
  }
  if (
    data.upliftStatus &&
    data.upliftStatus !== '' &&
    !Object.values(upliftStatus).includes(data.upliftStatus as upliftStatus)
  ) {
    return `Invalid uplift status. Must be one of: ${Object.values(upliftStatus).join(', ')}`;
  }

  return null;
};

const processBatch = async (
  batch: ExcelPerson[],
  updateExisting: boolean,
  batchNumber: number
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}> => {
  const batchResult = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>
  };

  // First, find all duplicate accounts in the database
  const duplicateAccounts = await prisma.person.groupBy({
    by: ['account'],
    having: {
      account: {
        _count: {
          gt: 1
        }
      }
    }
  });

  // Remove duplicates keeping the most recently updated record
  for (const dup of duplicateAccounts) {
    const records = await prisma.person.findMany({
      where: { account: dup.account },
      orderBy: { id: 'desc' }
    });

    // Keep the first record (most recent) and delete others
    const [, ...remove] = records;
    if (remove.length > 0) {
      await prisma.person.deleteMany({
        where: {
          id: {
            in: remove.map((r) => r.id)
          }
        }
      });
    }
  }

  // Create a Set to track account numbers we've seen in this batch
  const processedAccounts = new Set<number>();

  for (const [index, rawRow] of batch.entries()) {
    try {
      const row = normalizeData(rawRow);
      const error = validatePersonData(row);
      if (error) {
        throw new Error(error);
      }

      const accountNumber = Number(row.account);

      // Check if we've already processed this account in current batch
      if (processedAccounts.has(accountNumber)) {
        throw new Error(`Duplicate account number ${accountNumber} found in import file`);
      }

      const existingPerson = await personService.getPersonByAccount(accountNumber);

      if (existingPerson) {
        if (!updateExisting) {
          throw new Error(`Account number ${accountNumber} already exists in database`);
        }
        await personService.updatePersonById(existingPerson.id, {
          name: row.name,
          street: row.street,
          city: row.city,
          state: row.state,
          zip: row.zip,
          relationshipType: row.relationshipType as relationshipType,
          county: row.county,
          race: row.race,
          gender: row.gender as gender,
          upliftStatus: row.upliftStatus as upliftStatus,
          account: accountNumber
        });
      } else {
        await personService.createPerson(
          accountNumber,
          row.name,
          row.street,
          row.city,
          row.state,
          row.zip,
          row.relationshipType as relationshipType,
          row.county,
          row.race,
          row.gender as gender,
          row.upliftStatus as upliftStatus
        );
      }

      processedAccounts.add(accountNumber);
      batchResult.success++;
    } catch (error) {
      batchResult.failed++;
      batchResult.errors.push({
        row: batchNumber * BATCH_SIZE + index + 2,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  return batchResult;
};

const validateExcelFile = async (fileBuffer: Buffer): Promise<void> => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    if (workbook.SheetNames.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file must contain at least one sheet');
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      raw: false,
      defval: null,
      header: 1 // Use 1-based array of values for first row
    });

    if (data.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file is empty');
    }

    // Get headers from first row and normalize them
    const headers = (data[0] as string[]).map((header) => header?.toString().toLowerCase().trim());

    const requiredColumns = ['account', 'name'];
    const missingColumns = requiredColumns.filter(
      (required) => !headers.some((header) => header?.includes(required.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Missing required columns: ${missingColumns.join(', ')}`
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Excel file format');
  }
};

const uploadExcel = async (fileBuffer: Buffer): Promise<UploadResult> => {
  await validateExcelFile(fileBuffer);

  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const headerMapping = {
    'Account Number': 'account',
    Name: 'name',
    'Primary Street': 'street',
    'Primary City': 'city',
    'Primary State': 'state',
    'Primary Zip Code': 'zip',
    'County of Residence': 'county',
    Gender: 'gender',
    Race: 'race',
    'Relationship Type': 'relationshipType',
    'UPLIFT Status': 'upliftStatus'
  };

  const rawData = XLSX.utils.sheet_to_json<ExcelPerson>(worksheet, {
    defval: null,
    header: Object.values(headerMapping),
    raw: true
  });

  // Get all valid account numbers from import file
  const importedAccounts = rawData
    .filter((row) => row.account && row.name?.trim() && !isNaN(Number(row.account)))
    .map((row) => Math.floor(Number(row.account)));

  // First, delete contacts that are not in Excel AND have no interactions
  await prisma.person.deleteMany({
    where: {
      AND: [
        { account: { notIn: importedAccounts } }, // Not in Excel file
        { interactions: { none: {} } } // No interactions
      ]
    }
  });

  // Get list of contacts with interactions for reporting
  const contactsWithInteractions = await prisma.person.findMany({
    where: {
      AND: [{ account: { notIn: importedAccounts } }, { interactions: { some: {} } }]
    },
    select: {
      id: true,
      name: true,
      account: true,
      _count: {
        select: { interactions: true }
      }
    }
  });

  // Process the data in batches
  const data = rawData.filter((row) => row.name?.trim() || row.account);
  const result: UploadResult = {
    success: 0,
    failed: 0,
    errors: [],
    batchResults: [],
    contactsWithInteractions: contactsWithInteractions.map((contact) => ({
      id: contact.id,
      name: contact.name,
      account: contact.account,
      interactionCount: contact._count.interactions
    }))
  };

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE);
    const batchResult = await processBatch(batch, true, batchNumber);

    result.success += batchResult.success;
    result.failed += batchResult.failed;
    result.errors.push(...batchResult.errors);

    result.batchResults.push({
      batchNumber: batchNumber + 1,
      processed: batch.length,
      success: batchResult.success,
      failed: batchResult.failed
    });
  }

  return result;
};

export default {
  uploadExcel,
  validateExcelFile
};
