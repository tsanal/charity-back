import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { interactionService } from '../services';

/**
 * Create a new interaction
 */
const createInteraction = catchAsync(async (req, res) => {
  const { name, method, date, type, duration, notes, personId, account } = req.body;
  const interaction = await interactionService.createInteraction({
    name,
    method,
    date,
    type,
    duration,
    notes,
    personId,
    account
  });
  res.status(httpStatus.CREATED).send(interaction);
});

/**
 * Get all interactions with filtering and pagination
 */
const getInteractions = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'id',
    'name',
    'type',
    'method',
    'date',
    'duration',
    'notes',
    'account'
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortType']);
  const result = await interactionService.getInteractions(filter, {
    page: Number(options.page) || 1,
    limit: Number(options.limit) || 10,
    sortBy: options.sortBy as string | undefined,
    sortType: (options.sortType as 'asc' | 'desc') || 'desc'
  });
  res.send(result);
});

/**
 * Get interaction by id
 */
const getInteraction = catchAsync(async (req, res) => {
  const interaction = await interactionService.getInteractionById(Number(req.params.interactionId));
  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }
  res.send(interaction);
});

/**
 * Update interaction by id
 */
const updateInteraction = catchAsync(async (req, res) => {
  const interaction = await interactionService.updateInteraction(
    Number(req.params.interactionId),
    req.body
  );
  res.send(interaction);
});

/**
 * Delete interaction by id
 */
const deleteInteraction = catchAsync(async (req, res) => {
  await interactionService.deleteInteraction(Number(req.params.interactionId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createInteraction,
  getInteractions,
  getInteraction,
  updateInteraction,
  deleteInteraction
};
