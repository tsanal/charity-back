import { Person, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';

/**
 * Get person by account
 * @param {number} account
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Person, Key> | null>}
 */
const getPersonByAccount = async <Key extends keyof Person>(
  account: number,
  keys: Key[] = [
    'id',
    'name',
    'email',
    'street',
    'city',
    'phone',
    'state',
    'zip',
    'relationshipType',
    'account'
  ] as Key[]
): Promise<Pick<Person, Key> | null> => {
  return prisma.person.findFirst({
    where: { account },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<Person, Key> | null>;
};

/**
 * Create a person
 * @param {Object} personData
 * @returns {Promise<Person>}
 */
const createPerson = async (
  name: string,
  email?: string,
  street?: string,
  city?: string,
  phone?: string,
  state?: string,
  zip?: string,
  relationshipType?: string,
  account?: number
): Promise<Person> => {
  // Check if account is provided and already exists
  if (account && (await getPersonByAccount(account))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Account already exists');
  }

  return prisma.person.create({
    data: {
      name,
      email: email?.trim() || null,
      street,
      city,
      phone,
      state,
      zip,
      relationshipType,
      account
    }
  });
};

/**
 * Query for persons with pagination and sorting
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Pick<Person, Key>[]>}
 */
const queryPersons = async <Key extends keyof Person>(
  filter: Record<string, any>,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  },
  keys: Key[] = [
    'id',
    'name',
    'email',
    'street',
    'city',
    'phone',
    'state',
    'zip',
    'relationshipType',
    'account'
  ] as Key[]
): Promise<{ results: Pick<Person, Key>[]; totalCount: number }> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? 'desc';

  const where: Record<string, any> = Object.entries(filter).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = {
        contains: value
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const totalCount = await prisma.person.count({
    where
  });

  const persons = await prisma.person.findMany({
    where,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined
  });

  return { results: persons as Pick<Person, Key>[], totalCount };
};

/**
 * Get person by id
 * @param {number} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Person, Key> | null>}
 */
const getPersonById = async <Key extends keyof Person>(
  id: number,
  keys: Key[] = [
    'id',
    'name',
    'email',
    'street',
    'city',
    'phone',
    'state',
    'zip',
    'relationshipType',
    'account'
  ] as Key[]
): Promise<Pick<Person, Key> | null> => {
  return prisma.person.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  }) as Promise<Pick<Person, Key> | null>;
};

/**
 * Update person by id
 * @param {number} personId
 * @param {Object} updateBody
 * @returns {Promise<Person>}
 */
const updatePersonById = async <Key extends keyof Person>(
  personId: number,
  updateBody: Prisma.PersonUpdateInput,
  keys: Key[] = [
    'id',
    'name',
    'email',
    'street',
    'city',
    'phone',
    'state',
    'zip',
    'relationshipType',
    'account'
  ] as Key[]
): Promise<Pick<Person, Key> | null> => {
  const person = await getPersonById(personId);
  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  // Check if updating account number and if it already exists
  if (updateBody.account && typeof updateBody.account === 'number') {
    const existingPerson = await getPersonByAccount(updateBody.account);
    if (existingPerson && existingPerson.id !== personId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Account already exists');
    }
  }

  const updatedPerson = await prisma.person.update({
    where: { id: personId },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
  });
  return updatedPerson as Pick<Person, Key> | null;
};

/**
 * Delete person by id
 * @param {number} personId
 * @returns {Promise<Person>}
 */
const deletePersonById = async (personId: number): Promise<Person> => {
  const person = await getPersonById(personId);
  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }
  await prisma.person.delete({ where: { id: personId } });
  return person;
};

export default {
  createPerson,
  queryPersons,
  getPersonById,
  getPersonByAccount,
  updatePersonById,
  deletePersonById
};
