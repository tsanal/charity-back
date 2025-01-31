import { Person, Prisma, relationshipType, gender, upliftStatus } from '@prisma/client';
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
  account: number,
  name: string,
  street?: string,
  city?: string,
  state?: string,
  zip?: string,
  relationshipType?: relationshipType | null,
  county?: string,
  race?: string,
  gender?: gender | null,
  upliftStatus?: upliftStatus | null,
  isDeleted?: boolean
): Promise<Person> => {
  return prisma.person.create({
    data: {
      name,
      street,
      city,
      state,
      zip,
      relationshipType: relationshipType || null,
      account,
      county,
      race,
      gender: gender || null,
      upliftStatus: upliftStatus || null,
      isDeleted
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
  filter: {
    account?: number | number[];
    name?: string;
    race?: string;
    street?: string;
    city?: string;
    zip?: string;
    state?: string;
    county?: string;
    upliftStatus?: upliftStatus | upliftStatus[];
    gender?: gender | gender[];
    relationshipType?: relationshipType | relationshipType[];
  },
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  },
  keys: Key[] = [
    'id',
    'name',
    'street',
    'city',
    'state',
    'zip',
    'relationshipType',
    'account',
    'gender',
    'upliftStatus',
    'race',
    'county',
    'isDeleted'
  ] as Key[]
): Promise<{ results: Pick<Person, Key>[]; totalCount: number }> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? 'desc';

  const where: Prisma.PersonWhereInput = {
    ...(filter.account && {
      account: typeof filter.account === 'number' ? filter.account : { in: filter.account }
    }),
    ...(filter.name && { name: { contains: filter.name } }),
    ...(filter.race && { race: { contains: filter.race } }),
    ...(filter.street && { street: { contains: filter.street } }),
    ...(filter.city && { city: { contains: filter.city } }),
    ...(filter.zip && { zip: { contains: filter.zip } }),
    ...(filter.state && { state: { contains: filter.state } }),
    ...(filter.county && { county: { contains: filter.county } }),
    ...(filter.upliftStatus && {
      upliftStatus:
        typeof filter.upliftStatus === 'string' ? filter.upliftStatus : { in: filter.upliftStatus }
    }),
    ...(filter.gender && {
      gender: typeof filter.gender === 'string' ? filter.gender : { in: filter.gender }
    }),
    ...(filter.relationshipType && {
      relationshipType:
        typeof filter.relationshipType === 'string'
          ? filter.relationshipType
          : { in: filter.relationshipType }
    })
  };

  const totalCount = await prisma.person.count({ where });

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
    'street',
    'city',
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

const softDeletePersonById = async (personId: number): Promise<Person | null> => {
  const person = await getPersonById(personId);
  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  const deletedPerson = await prisma.person.update({
    where: { id: personId },
    data: { isDeleted: true }
  });

  return deletedPerson;
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
  deletePersonById,
  softDeletePersonById
};
