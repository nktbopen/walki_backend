
import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware'; 
import {getAttractionsByLocation, getAllAttractions,} from '../controllers/attractions.controller';

const router = express.Router();

// Define routes for attractions
router.get('/', verifyToken, getAllAttractions); // GET attractions

router.get('/getAttractionsByLocation', verifyToken, getAttractionsByLocation); // GET attractions


export default router;
