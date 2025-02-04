// import express from 'express';
// import auth from '../../middlewares/auth';
// import validate from '../../middlewares/validate';
// import { personValidation } from '../../validations';
// import { personController } from '../../controllers';

// const router = express.Router();

// router
//   .route('/')
//   .post(
//     auth('managePersons'),
//     validate(personValidation.createPerson),
//     personController.createPerson
//   )
//   .get(auth('getPersons'), validate(personValidation.getPersons), personController.getPersons);

// router
//   .route('/:personId')
//   .get(auth('getPersons'), validate(personValidation.getPerson), personController.getPerson)
//   .patch(
//     auth('managePersons'),
//     validate(personValidation.updatePerson),
//     personController.updatePerson
//   )
//   .delete(
//     auth('managePersons'),
//     validate(personValidation.deletePerson),
//     personController.deletePerson
//   );

// export default router;

import express from 'express';
import validate from '../../middlewares/validate';
import { personValidation } from '../../validations';
import { personController } from '../../controllers';
import auth from '../../middlewares/auth';

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), personController.createPerson)
  .get(auth('getUsers'), validate(personValidation.getPersons), personController.getPersons);

router
  .route('/:personId')
  .get(auth('getUsers'), validate(personValidation.getPerson), personController.getPerson)
  .patch(
    auth('manageUsers'),
    validate(personValidation.updatePerson),
    personController.updatePerson
  )
  .delete(
    auth('manageUsers'),
    validate(personValidation.deletePerson),
    personController.deletePerson
  )
  .put(
    auth('manageUsers'),
    validate(personValidation.softDeletePerson),
    personController.softDeletePerson
  );

router
  .route('/:personId/restore')
  .put(
    auth('manageUsers'),
    validate(personValidation.restorePerson),
    personController.restorePerson
  );

export default router;
