// attractionsController.ts

import { Request, Response } from 'express';
import {Attraction, OverpassElement, WikipediaPage} from '../interfaces/interfaces';
import { retrieveIsochrone, searchLocationByCoords} from '../services/mapboxService';
import { getTouristAttractions } from '../services/overpassService';
import { getWikidataItem } from '../services/wikidataService';
import { generateDescription, } from '../services/geminiService';
import { getWikipediaData } from '../services/wikipediaService';
import qs from 'qs';
import AttractionModel from '../models/attraction.model';
import { Polygon} from 'geojson';
import { parseMongoBbox, parseLocation } from '../utils/utils';
import { autocompleteSearch, vectorSearch } from '../services/mongoAtlasService';

const convertOverpassToAttractions = async (overpassItems: OverpassElement[]): Promise<Attraction[]> => {
    const attractions: Attraction[] = [];

    for (const item of overpassItems) {
        const osm_id: number = item.id;
        let name: string|undefined;
        let coordinates: number[] | undefined;
        let address: string|undefined;
        let categories: string[]|undefined;
        let description: string|undefined;
        let wikidata: string|undefined;
        let wikipedia: string|undefined;
        let wikimedia: string|undefined;
        let images: string[]|undefined = [];
        let website: string|undefined;
        const dml_type: string = 'I';

        // Coordinates
        if (item.lat && item.lon) {
            coordinates = [item.lon, item.lat];
        } else if (item.center && item.center.lat && item.center.lon) {
            coordinates = [item.center.lon, item.center.lat];
        }

        if (item && item.tags) {
            // Name
            if (item.tags.name){
                name = item.tags.name;
            }
            // Description
            if (item.tags.description){
                description = item.tags.description;
            }
            // Wikidata
            if (item.tags.wikidata){
                wikidata = item.tags.wikidata;
            }
            // Wikipedia
            if (item.tags.wikipedia){
                wikipedia = item.tags.wikipedia;
            }
            // Wikimedia
            if (item.tags.wikimedia_commons){
                wikimedia = item.tags.wikimedia_commons;
            }
            // Website
            if (item.tags.website){
                website = item.tags.website;
            }
            
        }

        // Categories:
        if (item.categories){
            categories = item.categories;
        }

        const attraction = {
            osm_id,
            name,
            coordinates,
            address,
            categories,
            description,
            wikidata,
            wikipedia,
            wikimedia,
            images,
            website,
            dml_type,
        };

        if (attraction) {
          attractions.push(attraction);
        }
      }

    return attractions;
}

const enrichAttractionsFromDB = async (attractions: Attraction[]) => {
    // Extract osm_ids from the input attractions
    const osmIds = attractions.map(a => a.osm_id); 
    const existingAttractions = await getAttractionsByOsmIds(osmIds);

    // Create a map for efficient lookup of attractions by osm_id
    const existingAttractionMap = new Map(existingAttractions.map(a => [a.osm_id, a]));

    //  Iterate through the input attractions and populate data from the database
    attractions.map(attraction => {
        const existing = existingAttractionMap.get(attraction.osm_id);
        if (existing) {
            //  Merge data from the database into the attraction object.  Prioritize existing data.
            attraction.address = existing.address;
            attraction.description = existing.description;
            attraction.images = existing.images;
            attraction.dml_type = 'U'; //attraction.dml_type = undefined;
        }
    });
}

const enrichAttractionAddresses = async (attractions: Attraction[])=> {
    attractions.forEach(async (a) => {
        try {
            if (!a.address && a.coordinates){
                const results = await searchLocationByCoords(a.coordinates);
                if(results.length == 1){
                    a.address = results[0].properties.full_address;
                    a.dml_type = 'U';
                }
            } 
        } catch (error) {
            console.error('Error in enrichAttractionAddresses:', error);
        }
    });
}

const enrichAttractionDescriptions = async (attractions: Attraction[])=> {

    // Reduce attraction attributes for llm
    const attractionsForLLM: Attraction[] = [];
    attractions.forEach((a) => {
        if(!a.description){
            attractionsForLLM.push({
                osm_id: a.osm_id,
                name: a.name,
                description: a.description,
                address: a.address,
                coordinates: a.coordinates,
                categories: a.categories,
            });
        }
    });

    if(attractionsForLLM.length > 0){
        // Retrieve refined attractions from LLM
        const llmResults = await generateDescription(JSON.stringify(attractionsForLLM));

        if(llmResults){
            const descriptions: Attraction[] = JSON.parse(llmResults);
            attractions.forEach((a) => {
                const description = descriptions.find((d) => d.osm_id === a.osm_id);
                a.description = description?.description;
                a.dml_type = 'U';
            });
        }
    }
}

const enrichAttractionImages = async (attractions: Attraction[]) => {
    for (const a of attractions) {
        try {
            if(a.images?.length == 0 && a.wikidata){
                const result = await getWikidataItem(a.wikidata);
                if(result && result.statements && result.statements.P18){
                    result.statements.P18.forEach((item:any)=>{
                        if(item.property.data_type === "commonsMedia"){
                            a.images?.push(item.value.content);
                            a.dml_type = 'U';
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error in searchLocations:', error);
        }
    };
}

export const enrichWikipediaData = async (attraction: Attraction) => {
    try {
        if(attraction.wikipedia){
            const result = await getWikipediaData(attraction.wikipedia);
            attraction.wikipedia_content = result?.parse.text;
        } else {
            console.info('Error in retrieveWikipediaData: Empty wikipedia title');
        }
    } catch (error) {
        console.error('Error in retrieveWikipediaData:', error);
    }
}

export const getAttractionsByOsmIds = async (osmIds: number[]): Promise<Attraction[]> => {
    try {
        // Use the $in operator to find attractions with OSM IDs in the provided array.
        const attractions = await AttractionModel.find({
            osm_id: { $in: osmIds },
        }).exec(); //  Use .exec() to return a proper Promise

        return attractions;
    } catch (error) {
        console.error('Error retrieving attractions by OSM IDs:', error);
        throw error; //  Re-throw the error to be handled by the caller
    }
};

const storeAttractions = async (attractions: Attraction[]): Promise<Attraction[]> => {
    const storedAttractions: Attraction[] = [];
    for (const attraction of attractions.filter(a => a.dml_type && ['I', 'U'].includes(a.dml_type))) {
        try {
            // Use findOne to find  attraction
            const existingAttraction: Attraction|null = await AttractionModel.findOneAndUpdate(
                { osm_id: attraction.osm_id },  // Filter by osm_id
                {
                    osm_id: attraction.osm_id,
                    name: attraction.name,
                    coordinates: attraction.coordinates,
                    address: attraction.address,
                    categories: attraction.categories,
                    description: attraction.description,
                    wikidata: attraction.wikidata,
                    wikipedia: attraction.wikipedia,
                    wikipedia_content: attraction.wikipedia_content,
                    wikimedia: attraction.wikimedia,
                    images: attraction.images,
                    website: attraction.website,
                },
                { upsert: true}
            ).exec();
            if(existingAttraction){
                storedAttractions.push(existingAttraction);
            }
        
        } catch (error) {
            // Handle errors, such as validation errors or database connection errors.
            console.error('Error storing attraction:', attraction, error);
        }
    }
    return storedAttractions;
}

export const getAllAttractions = async (req: Request, res: Response) => {
    try {
        const attractions = await AttractionModel.find().exec();
        res.status(200).json(attractions);
    } catch (error) {
        console.error("Error getting all attractions", error);
        res.status(500).json({ error: 'Failed to retrieve attractions' });
    }
}

export const retrieveAttractions = async (coordinates: Polygon):Promise<Attraction[]> => {
    try {
        //const overpassAttractions = await getTouristAttractions(coordinates, ['TOURIST_ATTRACTION', 'ARTWORK', 'MUSEUMS', 'MONUMENT', 'HISTORY', 'ARCHAELOGICAL_SITE', 'RUINS']);
        const overpassAttractions = await getTouristAttractions(coordinates, 'ALL');
        
        // Convert overpass elements into Attractions
        const attractions = await convertOverpassToAttractions(overpassAttractions);

        //attractions.splice(10); // for testing purposes

        // Enrich attractions from DB
        await enrichAttractionsFromDB(attractions);

        // Enrich description from llm
        await enrichAttractionDescriptions(attractions);

        // Enrich attraction addresses
        await enrichAttractionAddresses(attractions);

        // Enrich attractions with images
        await enrichAttractionImages(attractions);

        // Store attractions
        const storedAttractions = await storeAttractions(attractions);
        
        return storedAttractions;
    } catch (error) {
        console.error('Error in searchLocations:', error);
        return [];
    }
};

export const getAttractionsByLocation = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });
        
        const locationCoords = query.locationCoords;
        const duration = query.duration;

        //Get isochrone from the start location
        const isochrone = await retrieveIsochrone(locationCoords as string, duration as string);

        if(isochrone && isochrone[0] && isochrone[0].geometry){
            const coordinates = isochrone[0].geometry;
            // Get attractions
            const attractions = await retrieveAttractions(coordinates);

            // Store attractions
            if (attractions && attractions.length > 0){
                res.status(200).json(attractions);
            } else {
                console.error('No attractions found:');
                res.status(200).json([]);
            }
        } else {
            console.error("Unable to retrieve isochrone");
            res.status(500).json({ error: 'Unable to retrieve isochrone' });
        }
            
    } catch (error) {
        console.error('Error in searchLocations:', error);
        res.status(500).json({ error: 'Failed to retrieve attractions' });
    }
};

const bboxToGeoJSONPolygon = (bbox: string): Polygon => {
    const [minX, minY, maxX, maxY] = bbox.split(',').map(c => parseFloat(c));
    // GeoJSON Polygon coordinates must form a closed loop, meaning the first
    // and last coordinate pair must be identical.
    const coordinates: number[][][] = [
        [
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY],
            [minX, minY], // Closing the polygon
        ],
    ];

    return {
        type: 'Polygon',
        coordinates: coordinates,
    };
};

// Example: http://192.168.1.137:3000/attractions/getAttractionsByBbox?locationBbox=-4.466641665626497,36.68639672966282,-4.337945831423212,36.76189590089815
export const importAttractionsByBbox = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });
        
        const locationBbox = query.locationBbox;
        const coordinates = bboxToGeoJSONPolygon(locationBbox as string);
        
        // Get attractions
        const attractions = await retrieveAttractions(coordinates);

        //  Fetch wikipedia content
        for (const attraction of attractions) {
            try {
                if(!attraction.wikipedia_content){
                    await enrichWikipediaData(attraction);
                }
            } catch (error) {
                console.error('Error in enreach wikipedia data', error);
            }
        };

        // Store and Return attractions
        if (attractions && attractions.length > 0){
            await storeAttractions(attractions);
            res.status(200).json(attractions);
        } else {
            console.error('No attractions found:');
            res.status(200).json([]);
        }
            
    } catch (error) {
        console.error('Error in searchLocations:', error);
        res.status(500).json({ error: 'Failed to retrieve attractions' });
    }
};

export const getAttractions = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });
        
        const reqCoords = query.locationCoords;
        const reqBbox = query.bbox;
        const queryText = query.q;

        let bbox;
        let locationCoords;

        // Parse bbox
        if(reqBbox) {
            bbox = parseMongoBbox(reqBbox as string);
        }

        // Parse location corrdinates
        if(reqCoords) {
            locationCoords = parseLocation(reqCoords as string);
        }

        // Get attractions
        const attractions = await vectorSearch(bbox, locationCoords, queryText as string);

        // Store and Return attractions
        if (attractions){
            res.status(200).json(attractions);
        } else {
            console.error('No attractions found:');
            res.status(204).json([]);
        }
            
    } catch (error) {
        console.error('Error in searchLocations:', error);
        res.status(500).json({ error: 'Failed to retrieve attractions' });
    }
};


export const autocomplete = async (req: Request, res: Response) => {
    try {
        const query = qs.parse(qs.stringify(req.query), { 
            ignoreQueryPrefix: true //removes the "?"
        });
        
        const reqBbox = query.bbox;
        const queryText = query.q;

        let bbox;
        // Parse bbox
        if(reqBbox) {
            bbox = parseMongoBbox(reqBbox as string);
        }

        // Get attractions
        const attractions = await autocompleteSearch(queryText as string, bbox);

        // Store and Return attractions
        if (attractions){
            res.status(200).json(attractions);
        } else {
            console.error('No attractions found:');
            res.status(204).json([]);
        }
            
    } catch (error) {
        console.error('Error in searchLocations:', error);
        res.status(500).json({ error: 'Failed to retrieve attractions' });
    }
};