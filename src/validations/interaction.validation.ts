import Joi from 'joi';

const createInteraction = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    method: Joi.string().required(),
    date: Joi.string().required(),
    type: Joi.string().required(),
    duration: Joi.string().required(),
    notes: Joi.string().required(),
    personId: Joi.number().integer().required()
  })
};

const getInteractions = {
  query: Joi.object().keys({
    name: Joi.string(),
    method: Joi.string(),
    type: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
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
      description: Joi.string()
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
