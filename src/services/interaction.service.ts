import { Interaction } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';

/**
 * Create an interaction
 */
const createInteraction = async (interactionData: {
  name: string;
  method: string;
  date: string;
  type: string;
  duration: string;
  description: string;
}): Promise<Interaction> => {
  return prisma.interaction.create({
    data: interactionData
  });
};

/**
 * Get interaction by id
 */
const getInteractionById = async (id: number): Promise<Interaction | null> => {
  return prisma.interaction.findUnique({
    where: { id }
  });
};

/**
 * Get paginated interactions
 */
const getInteractions = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [interactions, total] = await Promise.all([
    prisma.interaction.findMany({
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      }
    }),
    prisma.interaction.count()
  ]);

  return {
    data: interactions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update interaction by id
 */
const updateInteraction = async (
  id: number,
  updateData: {
    name?: string;
    method?: string;
    date?: string;
    type?: string;
    duration?: string;
    description?: string;
  }
): Promise<Interaction> => {
  const interaction = await getInteractionById(id);

  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }

  return prisma.interaction.update({
    where: { id },
    data: updateData
  });
};

/**
 * Delete interaction by id
 */
const deleteInteraction = async (id: number): Promise<void> => {
  const interaction = await getInteractionById(id);

  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }

  await prisma.interaction.delete({
    where: { id }
  });
};

export default {
  createInteraction,
  getInteractions,
  getInteractionById,
  updateInteraction,
  deleteInteraction
};
