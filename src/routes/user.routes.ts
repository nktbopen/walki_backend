import express from 'express';
import { signUp, signIn} from '../controllers/user.controller';

const router = express.Router();

// Route to create a new User
router.post('/signUp', signUp);

// Route to authenticate user
router.post('/signIn', signIn);

export default router;
