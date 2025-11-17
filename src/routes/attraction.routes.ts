
import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware'; 
import {getAttractionsByLocation, getAllAttractions, getAttractions, autocomplete, getAttractionArticle} from '../controllers/attractions.controller';

const router = express.Router();

// Define routes for attractions
router.get('/', verifyToken, getAllAttractions); // GET attractions

router.get('/getAttractionsByLocation', verifyToken, getAttractionsByLocation); // GET attractions

router.get('/getAttractions', verifyToken, getAttractions); // GET attractions

router.get('/autocomplete', verifyToken, autocomplete); // GET autocomplete

router.get('/getAttractionArticle', verifyToken, getAttractionArticle); // GET getAttractionArticle

export default router;
