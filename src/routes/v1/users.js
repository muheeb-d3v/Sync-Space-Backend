import express from 'express';
import { signUp, signIn, updateProfile } from '../../controllers/userController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';
import { validate } from '../../validators/zodValidator.js';
import { userSignupSchema, userSigninSchema, userUpdateSchema } from '../../validators/userSchema.js';

const router = express.Router();

router.post('/signup', validate(userSignupSchema), signUp);
router.post('/signin', validate(userSigninSchema), signIn);
router.put('/profile', isAuthenticated, validate(userUpdateSchema), updateProfile);

export default router;
