import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { personService } from '../services';

/**
 * Create a new person
 */
const createPerson = catchAsync(async (req, res) => {
  const { name, email, street, city, phone, state, zip, relationshipType, account } = req.body;
  const person = await personService.createPerson(
    name,
    email,
    street,
    city,
    phone,
    state,
    zip,
    relationshipType,
    account
  );
  res.status(httpStatus.CREATED).send(person);
});

/**
 * Get all persons with filtering and pagination
 */
const getPersons = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'email', 'city', 'state', 'relationshipType']);
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

export default {
  createPerson,
  getPersons,
  getPerson,
  updatePerson,
  deletePerson
};
