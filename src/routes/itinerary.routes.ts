
import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware'; 
import { getItineraries, getItineraryById, createItinerary, generateContent, getAudio, getUserItineraries, getSuggestedItineraries, storeItinerary, deleteItineraryById} from '../controllers/itinerary.controller';


const router = express.Router();

// Route to create a new itinerary
router.post('/', verifyToken, createItinerary);

// Route to get all itineraries
router.get('/all/', verifyToken, getItineraries); 

// Route to get all user's itineraries
router.get('/getUserItineraries', verifyToken, getUserItineraries);

// Route to generate audio
router.get('/getAudio', verifyToken, getAudio)

// Route to get an itinerary by ID
router.get('/id/:id', verifyToken, getItineraryById);

// Route to generate content for an itinerary item
router.post('/generateContent', verifyToken, generateContent);

// Route to get suggested itineraries 
router.get('/getSuggestedItineraries', verifyToken, getSuggestedItineraries);

// Route to get suggested itineraries 
router.post('/storeItinerary', verifyToken, storeItinerary);

// Route to get suggested itineraries 
router.delete('/:id', verifyToken, deleteItineraryById);

export default router;
