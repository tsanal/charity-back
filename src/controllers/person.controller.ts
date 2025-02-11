import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { personService } from '../services';

/**
 * Create a new person
 */
const createPerson = catchAsync(async (req, res) => {
  const {
    account,
    name,
    street,
    city,
    state,
    zip,
    relationshipType,
    county,
    race,
    gender,
    upliftStatus,
    isDeleted
  } = req.body;
  console.log('createPerson', req.body);
  const person = await personService.createPerson(
    account,
    name,
    street,
    city,
    state,
    zip,
    relationshipType,
    county,
    race,
    gender,
    upliftStatus,
    isDeleted
  );
  res.status(httpStatus.CREATED).send(person);
});

/**
 * Get all persons with filtering and pagination
 */
const getPersons = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'name',
    'street',
    'city',
    'state',
    'relationshipType',
    'upliftStatus',
    'gender',
    'race',
    'isDeleted',
    'account',
    'county',
    'zip',
    'isDeleted'
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortType']);
  const result = await personService.queryPersons(filter, options);
  res.send(result);
});

/**
 * Get person by id
 */
const getPerson = catchAsync(async (req, res) => {
  const person = await personService.getPersonById(Number(req.params.personId));
  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }
  res.send(person);
});

/**
 * Update person by id
 */
const updatePerson = catchAsync(async (req, res) => {
  const person = await personService.updatePersonById(Number(req.params.personId), req.body);
  res.send(person);
});

/**
 * Delete person by id
 */
const deletePerson = catchAsync(async (req, res) => {
  await personService.deletePersonById(Number(req.params.personId));
  res.status(httpStatus.NO_CONTENT).send();
});

const softDeletePerson = catchAsync(async (req, res) => {
  await personService.softDeletePersonById(Number(req.params.personId));
  res.status(httpStatus.NO_CONTENT).send();
});

const restorePerson = catchAsync(async (req, res) => {
  await personService.restorePersonById(Number(req.params.personId));
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Export persons data as CSV
 */
const exportPersonsCSV = catchAsync(async (req, res) => {
  const csvContent = await personService.exportPersonsToCSV();

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=all_persons.csv');

  res.send(csvContent);
});

export default {
  createPerson,
  getPersons,
  getPerson,
  updatePerson,
  deletePerson,
  softDeletePerson,
  restorePerson,
  exportPersonsCSV
};
