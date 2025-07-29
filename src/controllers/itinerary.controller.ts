import { Request, Response } from 'express';
import ItineraryModel  from '../models/itinerary.model'; // Import the Mongoose model
import {Itinerary, Attraction} from '../interfaces/interfaces';
import AttractionModel from '../models/attraction.model'; 
import { retrieveOptimizedRoute } from '../services/mapboxService';
import { enrichWikipediaData, retrieveAttractions } from './attractions.controller';
import { generateTextFromWiki,suggestAttractions } from '../services/geminiService';
import { synthesizeSpeech } from '../services/textToSpeechService';
import User from '../models/user.model'; 
import qs from 'qs';
import {distance} from '@turf/turf'

/**
 * Converts an array of attractions (from the request) into an array of ItineraryItems.
 *
 * @param attractions An array of attraction objects from the database.
 * @param duration The overall duration of the itinerary.
 * @returns An array of ItineraryItem objects.
 */
const convertAttractionsToItinerary = async (attractions: any[], startPointCoords: string): Promise<Itinerary|null> => {
    //  Basic validation:  Ensure attractions is an array and has elements.
    if (!Array.isArray(attractions) || attractions.length === 0) {
        return null; // Or throw an error:  throw new Error("Attractions array is empty or invalid");
    }

    attractions.forEach((a) => {
        a.distance = distance(startPointCoords.split(',').map(Number), a.coordinates, { units: 'kilometers' });
    });

    attractions = attractions.sort((a, b) => a.distance - b.distance);
    // Get optimized route through selected points
    let coordsStr = "";
    const attractionCoords = attractions.map(a => a.coordinates?.join(','));
    if(startPointCoords){
        coordsStr = startPointCoords+";";
    } 
    coordsStr += attractionCoords.join(';');

    const optimizedCoords = await retrieveOptimizedRoute(coordsStr);

    if(!optimizedCoords){
        return null;
    }
    const duration = optimizedCoords.trips[0].duration;
    const dist = optimizedCoords.trips[0].distance;
    const waypoints = optimizedCoords.waypoints;
    const routeCoordinates = optimizedCoords.trips[0].coordinates;

    const itineraryItems =  attractions.map((attraction, index) => {
        let sequence;
        if(startPointCoords){
            sequence = waypoints[index+1].waypoint_index;
        } else {
            sequence = waypoints[index].waypoint_index + 1;
        }
        
        return {
            attractionId: attraction._id, //  Use attraction._id from the database
            sequence: sequence,
            name: attraction.name,
            duration: `5 min`,
            coordinates: attraction.coordinates,
            description: attraction.description, // Example
            is_last: sequence == attractions.length - 1, 
            images: attraction.images,
        };
    }).sort((a, b) => a.sequence - b.sequence);

    return {
        routeCoordinates: routeCoordinates,
        itineraryItems: itineraryItems,
        duration: Math.round(duration/60),
        distance: Math.round(dist),
        title: `${itineraryItems[0].name} - ${itineraryItems.at(-1)?.name}`
    }
};

/**
 * Store Itinerary object in the database, including its ItineraryItems.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @returns A promise that resolves to the newly created Itinerary object (from the database).
 */
export const storeItinerary = async (req: Request, res: Response) => {
     try {
        // Ensure the user is authenticated (req.user should be populated by verifyToken middleware)
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
            return;
        }

        const { itineraryData } = req.body;

        // Create the Itinerary object
        const itinerary = new ItineraryModel(itineraryData);

        // Save the itinerary to the database
        const savedItinerary = await itinerary.save();

        // 3. Associate the itinerary with the authenticated user
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (user) {
            // Ensure 'itineraries' array exists on the user document
            if (!user.itineraries) {
                user.itineraries = [];
            }
            user.itineraries.push(savedItinerary._id); // Add the new itinerary's _id
            await user.save(); // Save the updated user document
        } else {
            console.log(`User with ID ${userId} not found after creating itinerary ${savedItinerary._id}. Itinerary created but not linked to user.`);
        }

        // Respond with the created itinerary
        res.status(201).json(savedItinerary._id); // 201 Created

     } catch (error) {
        // Handle errors (e.g., validation errors, database errors)
        console.error('Error storing itinerary:', error);
        res.status(500).json({ error: 'Failed to store itinerary', details: error });
    }
};


/**
 * Creates a new Itinerary object in the database, including its ItineraryItems.
 * The attractions are taken from the database, based on the ids provided in the request.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @returns A promise that resolves to the newly created Itinerary object (from the database).
 */
export const createItinerary = async (req: Request, res: Response) => {
    try {
        // Ensure the user is authenticated (req.user should be populated by verifyToken middleware)
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
            return;
        }

        const { attractionIds, startPointCoords, title } = req.body;

        // Input validation: Check for required data
        if (!attractionIds) {
            res.status(400).json({ error: 'Missing required fields: attractionIds' });
            return;
        }
        if (!Array.isArray(attractionIds)) {
            res.status(400).json({ error: 'attractionIds must be an array' });
            return;
        }
        if (attractionIds.length === 0) {
            res.status(400).json({ error: 'attractionIds array cannot be empty' });
            return;
        }

        // 1.  Retrieve attractions from the database based on the provided IDs
        const attractionsFromDb = await AttractionModel.find({ osm_id: { $in: attractionIds } });

        // 2. Convert attractions to itinerary items
        const itineraryData = await convertAttractionsToItinerary(attractionsFromDb,startPointCoords);

        // Create the Itinerary object
        const itinerary = new ItineraryModel(itineraryData);

        // Adjust title if presents
        if(title){
            itinerary.title = title;
        }        

        // Save the itinerary to the database
        const savedItinerary = await itinerary.save();

        // 3. Associate the itinerary with the authenticated user
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (user) {
            // Ensure 'itineraries' array exists on the user document
            if (!user.itineraries) {
                user.itineraries = [];
            }
            user.itineraries.push(savedItinerary._id); // Add the new itinerary's _id
            await user.save(); // Save the updated user document
            //console.log(`Itinerary ${savedItinerary._id} added to user ${userId}`);
        } else {
            console.log(`User with ID ${userId} not found after creating itinerary ${savedItinerary._id}. Itinerary created but not linked to user.`);
            // You might want to handle this more robustly, e.g., log an error or rollback
        }

        // Respond with the created itinerary
        res.status(201).json(savedItinerary._id); // 201 Created
    } catch (error) {
        // Handle errors (e.g., validation errors, database errors)
        console.error('Error creating itinerary:', error);
        res.status(500).json({ error: 'Failed to create itinerary', details: error });
    }
};

/**
 * Retrieves an itinerary by its ID.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @returns A promise that resolves to the itinerary data.
 */
export const getItineraryById = async (req: Request, res: Response) => {
    try {
        const itineraryId = req.params.id;

        // Input validation: Check if itineraryId is provided
        if (!itineraryId) {
            res.status(400).json({ error: 'Itinerary ID is required' });
            return;
        }

        // Fetch the itinerary from the database using the provided ID
        const itinerary = await ItineraryModel.findById(itineraryId);

        if (!itinerary) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        res.status(200).json(itinerary);
    } catch (error) {
        // Handle errors (e.g., invalid ID format, database errors)
        console.error('Error getting itinerary by ID:', error);
        res.status(500).json({ error: 'Failed to retrieve itinerary', details: error });
    }
};

/**
* Retrieves all itineraries from the database.
*
* @param req The Express Request object.
* @param res The Express Response object.
* @returns A promise that resolves to a list of all itineraries.
*/
export const getItineraries = async (req: Request, res: Response) => {
    try {
        // Fetch all itineraries from the database
        const itineraries = await ItineraryModel.find();
        res.status(200).json(itineraries);
    } catch (error) {
        // Handle errors (e.g., database errors)
        console.error('Error getting all itineraries:', error);
        res.status(500).json({ error: 'Failed to retrieve itineraries', details: error });
    }
};

/**
 * Populates the 'text' property of an ItineraryItem with content
 * from Wikipedia, and saves the updated Itinerary.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const generateContent = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });

        const itineraryId = query.itineraryId;
        const attractionId = query.attractionId;

        // Input validation: Check for required IDs
        if (!itineraryId || !attractionId) {
            res.status(400).json({ error: 'Itinerary ID and Attraction ID are required' });
            return;
        }

        // Get itinerary and attraction
        const itinerary = await ItineraryModel.findById(itineraryId);
        if (!itinerary) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        const attraction = await AttractionModel.findById(attractionId);
        if (!attraction) {
            res.status(404).json({ error: 'Attraction not found' });
            return;
        }

        // Find the ItineraryItem within the itinerary's items
        const itineraryItem = itinerary.itineraryItems.find(item => item.attractionId === attractionId);
        if (!itineraryItem) {
            res.status(404).json({ error: 'Itinerary item not found' });
            return;
        }

        //  Get wikipedia data
        //  Fetch/generate wikipedia content
        if(!attraction.wikipedia_content){
            await enrichWikipediaData(attraction);
            await attraction.save(); // Save the attraction
        }

        // Generate text from Wikipedia content
        if(attraction.wikipedia_content && itineraryItem && !itineraryItem.text ){
            const textResult = await generateTextFromWiki(attraction.wikipedia_content, itineraryItem.sequence, itineraryItem.is_last);
            itineraryItem.text = textResult?.parts[0].text; // Assign to itineraryItem
            // Save the updated itinerary
            await itinerary.save();
        }
    
        res.status(200).json({ message: 'Content generated', itinerary });

    } catch (error) {
        console.error('Error in generateContent:', error);
        res.status(500).json({ error: 'Failed to generate content', details: error });
    }
};

/**
 * Generate 'audio' based on 'text' property of an ItineraryItem with content

 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const getAudio = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });

        const itineraryId = query.itineraryId;
        const attractionId = query.attractionId;

        // Input validation: Check for required IDs
        if (!itineraryId || !attractionId) {
            res.status(400).json({ error: 'Itinerary ID and Attraction ID are required' });
            return;
        }

        // Get itinerary and attraction
        const itinerary = await ItineraryModel.findById(itineraryId);
        if (!itinerary) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        // Find the ItineraryItem within the itinerary's items
        const itineraryItem = itinerary.itineraryItems.find(item => item.attractionId === attractionId);
        if (!itineraryItem) {
            res.status(404).json({ error: 'Itinerary item not found' });
            return;
        }

        // Generate audio from text
        if(!itineraryItem.text){
            res.status(500).json({ error: 'Failed to generate content: text is empty in itineraryItem' });
            return;
        }

        const audio = await synthesizeSpeech(itineraryItem.text);
        res.status(200).json({ message: 'Content generated', audioContent: audio });

    } catch (error) {
        console.error('Error in generateContent:', error);
        res.status(500).json({ error: 'Failed to generate content', details: error });
    }
};

/**
 * Retrieves all itineraries saved by the authenticated user.
 * The 'itineraries' attribute in the User model is populated with full Itinerary documents.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @returns A promise that resolves to an array of Itinerary documents.
 */
export const getUserItineraries = async (req: Request, res: Response) => {
    try {
        // Ensure the user is authenticated and their ID is available
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
            return;
        }

        const userId = req.user.id;

        // Find the user and populate their 'itineraries' field
        // The .populate('itineraries') call replaces the ObjectId references
        // with the actual Itinerary documents.
        const user = await User.findById(userId).populate('itineraries');

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        // Return the populated itineraries
        res.status(200).json(user.itineraries || []); // Return an empty array if no itineraries

    } catch (error) {
        console.error('Error fetching user itineraries:', error);
        res.status(500).json({ error: 'Failed to retrieve user itineraries.', details: error });
    }
};


/**
 * Generate itineraries suggest by AI
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @returns A promise that resolves to an array of Itinerary documents.
 */
export const getSuggestedItineraries = async (req: Request, res: Response) => {
    try {
        // Ensure the user is authenticated and their ID is available
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
            return;
        }

        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });

        const locationCoords = query.locationCoords;
        const duration = query.duration;

        // 1. Retrieve attractions
        const attractions = await retrieveAttractions(locationCoords as string, duration as string);

        // 2. Get suggestions
        const suggestions = await getSuggestions(attractions);

        // 3. Convert suggestions to itineraries
        const itineraries: Itinerary[] = [];

        for (const s of suggestions) {
            if (s.attraction_ids.length > 1) {
                const itineraryAttractions = attractions.filter(a => s.attraction_ids.map(i => i.osm_id).includes(a.osm_id));
                const itinearary = await convertAttractionsToItinerary(itineraryAttractions, locationCoords as string); // Await works here
                if (itinearary) {
                    itinearary.title = s.category;
                    itineraries.push(itinearary);
                }
            }
        }

        // Return the populated itineraries
        res.status(200).json(itineraries || []); // Return an empty array if no itineraries

    } catch (error) {
        console.error('Error retrieving itinerary suggestions:', error);
        res.status(500).json({ error: 'Failed to retrieve itinerary suggestions.', details: error });
    }
};

const getSuggestions = async (attractions: Attraction[]):Promise<{category: string, attraction_ids:[{osm_id: number, name: string}]}[]>  => {
    try {
        // Reduce attraction attributes for llm
        const attractionsForLLM: Attraction[] = [];

        attractions.forEach((a) => {
            attractionsForLLM.push({
                osm_id: a.osm_id,
                name: a.name,
                address: a.address,
                coordinates: a.coordinates,
                categories: a.categories,
            });
        });

        if(attractionsForLLM.length > 0){
            const cotegorizedAttractions: {category: string, attraction_ids:[{osm_id: number, name: string}]}[]|null = await suggestAttractions(JSON.stringify(attractionsForLLM));
            if(cotegorizedAttractions){
                return cotegorizedAttractions;
            } else{
                return [];
            }
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error categorizing attractions", error);
        return [];
    }
};