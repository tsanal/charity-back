import { Interaction, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';

/**
 * Create an interaction
 */
const createInteraction = async (interactionData: {
  name: string;
  method: string;
  type: string;
  date: Date | string; // Accept both Date object and string
  duration?: string; // Optional field for duration in seconds or minutes
  notes?: string; // Optional field for additional notes
  personId: number; // Required foreign key
}): Promise<Interaction> => {
  // Ensure the `date` is a valid Date object
  const interactionDate =
    typeof interactionData.date === 'string'
      ? new Date(interactionData.date)
      : interactionData.date;

  return prisma.interaction.create({
    data: {
      name: interactionData.name,
      method: interactionData.method,
      type: interactionData.type,
      date: interactionDate,
      duration: interactionData.duration, // Ensure compatibility with `Int?`
      notes: interactionData.notes ?? null, // Optional field
      personId: interactionData.personId // Foreign key
    }
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
    date?: string | Date; // Allow both string and Date for flexibility
    type?: string;
    duration?: string; // Allow string or number for duration
    description?: string; // Map to the `notes` field
  }
): Promise<Interaction> => {
  // Fetch the existing interaction
  const interaction = await getInteractionById(id);

  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }

  // Transform input fields as necessary
  const updatedData: Prisma.InteractionUpdateInput = {
    ...(updateData.name && { name: updateData.name }),
    ...(updateData.method && { method: updateData.method }),
    ...(updateData.date && {
      date: typeof updateData.date === 'string' ? new Date(updateData.date) : updateData.date
    }),
    ...(updateData.type && { type: updateData.type }),
    ...(updateData.duration && {
      duration: updateData.duration
    }),
    ...(updateData.description && { notes: updateData.description }) // Map description to notes
  };

  return prisma.interaction.update({
    where: { id },
    data: updatedData
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
