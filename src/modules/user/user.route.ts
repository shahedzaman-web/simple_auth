import { Router } from 'express';

import userController from './user.controller';
import { validate } from '../../middlewares/validate.middleware';
import { body } from 'express-validator';

const router = Router();

const registrationValidation = [
    body('name').isString().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
];

router.post('/register',
    validate(registrationValidation),
    userController.register);
router.post('/login', validate(loginValidation), userController.login);
router.post('/verify-email', userController.verifyEmail);

export default router;