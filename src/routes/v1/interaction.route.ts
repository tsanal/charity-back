import express from 'express';
import validate from '../../middlewares/validate';
import { interactionController } from '../../controllers';
import interactionValidation from '../../validations/interaction.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageUsers'),
    validate(interactionValidation.createInteraction),
    interactionController.createInteraction
  )
  .get(
    auth('getUsers'),
    validate(interactionValidation.getInteractions),
    interactionController.getInteractions
  );

router
  .route('/:interactionId')
  .get(
    auth('getUsers'),
    validate(interactionValidation.getInteraction),
    interactionController.getInteraction
  )
  .patch(
    auth('manageUsers'),
    validate(interactionValidation.updateInteraction),
    interactionController.updateInteraction
  )
  .delete(
    auth('manageUsers'),
    validate(interactionValidation.deleteInteraction),
    interactionController.deleteInteraction
  );

export default router;
