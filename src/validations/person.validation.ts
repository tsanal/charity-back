import Joi from 'joi';

const createPerson = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().allow(''),
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    phone: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zip: Joi.string().allow(''),
    relationshipType: Joi.string().allow(''),
    account: Joi.number().integer().optional().allow(null)
  })
};

const getPersons = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    relationshipType: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getPerson = {
  params: Joi.object().keys({
    personId: Joi.number().integer()
  })
};

const updatePerson = {
  params: Joi.object().keys({
    personId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      email: Joi.string().email(),
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      phone: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zip: Joi.string().allow(''),
      relationshipType: Joi.string().allow('')
    })
    .min(1)
};

const deletePerson = {
  params: Joi.object().keys({
    personId: Joi.number().integer()
  })
};

export default {
  createPerson,
  getPersons,
  getPerson,
  updatePerson,
  deletePerson
};
