import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware'; 
import { signUp, signIn, getInfo, updateInfo} from '../controllers/user.controller';

const router = express.Router();

// Route to create a new User
router.post('/signUp', signUp);

// Route to authenticate user
router.post('/signIn', signIn);

// Route to get user info
router.get('/getInfo', verifyToken, getInfo);

// Route to update user info
router.post('/updateInfo', verifyToken, updateInfo);

export default router;
