import Joi from 'joi';

const createInteraction = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    method: Joi.string().required(),
    date: Joi.date().required(),
    type: Joi.string().required(),
    duration: Joi.string(),
    notes: Joi.string(),
    personId: Joi.number().integer().required(),
    account: Joi.number()
  })
};

const getInteractions = {
  query: Joi.object().keys({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    method: Joi.string(),
    date: Joi.string(),
    duration: Joi.string(),
    notes: Joi.string(),
    account: Joi.number(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sortType: Joi.string().valid('asc', 'desc')
  })
};

const getInteraction = {
  params: Joi.object().keys({
    interactionId: Joi.number().integer()
  })
};

const updateInteraction = {
  params: Joi.object().keys({
    interactionId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      method: Joi.string(),
      date: Joi.string(),
      type: Joi.string(),
      duration: Joi.string(),
      description: Joi.string(),
      account: Joi.number(),
      notes: Joi.string()
    })
    .min(1)
};

const deleteInteraction = {
  params: Joi.object().keys({
    interactionId: Joi.number().integer()
  })
};

export default {
  createInteraction,
  getInteractions,
  getInteraction,
  updateInteraction,
  deleteInteraction
};
