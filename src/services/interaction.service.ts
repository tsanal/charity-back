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
  date: Date | string;
  duration?: string;
  notes?: string;
  personId: number;
  account: number;
}): Promise<Interaction> => {
  // Parse the date and set it to start of day in UTC
  const interactionDate = new Date(interactionData.date);
  // Set the time to noon UTC to avoid any timezone shifting
  interactionDate.setUTCHours(12, 0, 0, 0);

  return prisma.interaction.create({
    data: {
      name: interactionData.name,
      method: interactionData.method,
      type: interactionData.type,
      date: interactionDate,
      duration: interactionData.duration,
      notes: interactionData.notes ?? null,
      personId: interactionData.personId,
      account: interactionData.account
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
 * Get paginated interactions with filters
 */
const getInteractions = async (
  filter: {
    id?: number;
    name?: string;
    type?: string;
    method?: string;
    date?: string;
    duration?: string;
    notes?: string;
    account?: number;
  },
  options: {
    sortBy?: string;
    limit?: number;
    page?: number;
    sortType?: 'asc' | 'desc';
  } = {}
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  // Handle date filter with timezone consideration
  let dateFilter = {};
  if (filter.date) {
    const startDate = new Date(filter.date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(filter.date);
    endDate.setUTCHours(23, 59, 59, 999);

    dateFilter = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
  }

  const where: Prisma.InteractionWhereInput = {
    AND: [
      filter.id ? { id: Number(filter.id) } : {},
      filter.name ? { name: { contains: filter.name } } : {},
      filter.type ? { type: { contains: filter.type } } : {},
      filter.method ? { method: { contains: filter.method } } : {},
      dateFilter,
      filter.duration ? { duration: { contains: filter.duration } } : {},
      filter.notes ? { notes: { contains: filter.notes } } : {},
      filter.account
        ? {
            account: {
              in: await prisma.$queryRaw<Array<{ account: number }>>`
            SELECT account 
            FROM Interaction 
            WHERE CAST(account AS CHAR) LIKE ${`%${filter.account}%`}
          `.then((results) => results.map((r) => r.account))
            }
          }
        : {}
    ]
  };

  const [interactions, total] = await Promise.all([
    prisma.interaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [options.sortBy || 'date']: options.sortType || 'desc'
      }
    }),
    prisma.interaction.count({ where })
  ]);

  // Format dates in the response
  const formattedInteractions = interactions.map((interaction) => ({
    ...interaction,
    date: interaction.date.toISOString().split('T')[0] // Return date in YYYY-MM-DD format
  }));

  return {
    data: formattedInteractions,
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
    account?: number; // Add account field
    notes?: string; // Remove optional marker since it's required
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
    ...(updateData.description && { notes: updateData.description }), // Map description to notes
    ...(updateData.account && { account: updateData.account }),
    ...(updateData.notes && { notes: updateData.notes })
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

/**
 * Export interactions data as CSV
 * @returns {Promise<string>} CSV string
 */
const exportInteractionsToCSV = async (): Promise<string> => {
  // Get all interactions without any filters
  const interactions = await prisma.interaction.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
      person: {
        select: {
          name: true
        }
      }
    }
  });

  // Define CSV headers - including all relevant fields
  const headers = [
    'Account',
    'Person Name',
    'Interaction Name',
    'Method',
    'Type',
    'Date',
    'Duration',
    'Notes'
  ];

  // Convert data to CSV rows
  const rows = interactions.map((interaction) => [
    interaction.account,
    interaction.person?.name || '',
    interaction.name,
    interaction.method,
    interaction.type,
    interaction.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    interaction.duration || '',
    interaction.notes || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

export default {
  createInteraction,
  getInteractions,
  getInteractionById,
  updateInteraction,
  deleteInteraction,
  exportInteractionsToCSV
};
