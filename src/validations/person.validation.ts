import Joi from 'joi';
import { relationshipType, gender, upliftStatus } from '@prisma/client';

const createPerson = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zip: Joi.string().allow(''),
    relationshipType: Joi.string()
      .allow('')
      .valid(
        '',
        relationshipType.Donor,
        relationshipType.Participant,
        relationshipType.Outreach,
        relationshipType.Volunteer,
        relationshipType.Grant
      ),
    account: Joi.number().required(),
    county: Joi.string().allow(''),
    race: Joi.string().allow(''),
    gender: Joi.string().allow('').valid('', gender.Female, gender.Male),
    upliftStatus: Joi.string()
      .allow('')
      .valid('', upliftStatus.Active, upliftStatus.Inactive, upliftStatus.Prospective),
    isDeleted: Joi.boolean()
  })
};

const getPersons = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    street: Joi.string(),
    relationshipType: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    upliftStatus: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    gender: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    account: Joi.alternatives().try(Joi.number(), Joi.array().items(Joi.number())),
    race: Joi.string(),
    county: Joi.string(),
    zip: Joi.string(),
    isDeleted: Joi.boolean(),
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
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zip: Joi.string().allow(''),
      relationshipType: Joi.string().allow(''),
      upliftStatus: Joi.string().allow(''),
      race: Joi.string().allow(''),
      gender: Joi.string().allow(''),
      county: Joi.string().allow('')
    })
    .min(1)
};

const deletePerson = {
  params: Joi.object().keys({
    personId: Joi.number().integer()
  })
};
const softDeletePerson = {
  params: Joi.object().keys({
    personId: Joi.number().integer()
  })
};

export default {
  createPerson,
  getPersons,
  getPerson,
  updatePerson,
  deletePerson,
  softDeletePerson
};
