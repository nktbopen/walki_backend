//interfaces.ts
import { Document, Types } from 'mongoose';

// Define the User interface
interface User {
    email: string;
    password: string; // Storing hashed password
    itineraries?: Types.ObjectId[];
    language: string;
}

interface Translations {
    en_US?: string;
    ru_RU?: string;
}

interface Itinerary {
  title?: string;
  duration?: number;
  distance?: number;
  description?: string;
  routeCoordinates?: [number,number][];
  itineraryItems: ItineraryItem[];
}

interface ItineraryItem {
  attractionId: string;
  sequence: number; 
  is_last: boolean;
  name?: string;
  duration?: string;
  audio?: any;
  coordinates?: number[];
  description?: string;
  text: Translations;
  images?: string[];
}

interface ItineraryChatHistory {
    itineraryId: string;
    history?: string[];
}

interface Attraction {
    osm_id: number;
    name?: string;
    coordinates?: number[];
    address?: string;
    categories?: string[];
    description?: string;
    wikidata?: string;
    wikipedia?: string;
    wikipedia_content?: string;
    wikimedia?: string;
    images?: string[];
    website?: string;
    embedding?: number[];
    dml_type?: string;
    article: Translations;
}

interface OverpassElement {
    type: string;
    categories?: string[];
    id: number;
    lat?: number;
    lon?: number;
    center?: {
      lat: number;
      lon: number;
    };
    tags?: {
      [key: string]: string;
    };
  }

interface WikidataItem {
    id: string;
    type: string;
    labels: { [key: string]: { language: string; value: string } };
    descriptions: { [key: string]: { language: string; value: string } };
    aliases: { [key: string]: { language: string; value: string[] } };
    statements: { [key: string]: [{id: string; property: {id:string; data_type:string;}; value: {type: string; content: string;}}] };
    sitelinks: { [key: string]: { site: string; title: string; badges: string[] } };
}

interface MapboxGeocodingResult {
  id: string; // Unique identifier for the place
  geometry: {
    type: string; // "Point"
    coordinates: [number, number]; // [longitude, latitude]
  };
  context?: [ // Contextual information (e.g., city, region, country)
    {
      id: string;
      short_code?: string;
      wikidata?: string;
      text: string;
      type: string;
    }
  ];
  properties: {
    wikidata?: string; // Wikidata ID (if available)
    type: string; // "Feature"
    place_type: string[]; // Array of place types (e.g., ["place", "city"])
    relevance: number; // Relevance score (0-1)
    full_address: string; // Name of the place (e.g., "London")
    name: string; // Full place name (e.g., "London, England")
    place_formatted: string;
  };
}

interface MapboxIsochroneResult {
  type: string;
  geometry: GeoJSON.Polygon;
  properties: {
    contour: number;
  };
}

interface MapboxOptimizationResult {
  code: string;
  waypoints: OptimizationWaypoint[];
  trips: OptimizationTrip[];
}

interface OptimizationWaypoint {
  name: string;
  location: [number, number];
  waypoint_index: number;
  trips_index: number;
}

interface OptimizationLeg {
  summary: string;
  weight: number;
  duration: number;
  steps: any[]; // You might want to define a more specific interface for steps if needed
  distance: number;
}

interface OptimizationTrip {
  geometry: string;
  coordinates?: [number,number][],
  legs: OptimizationLeg[];
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
}

interface WikipediaPage {
  parse: {
      title: string;
      pageid: number;
      revid: number;
      text: string;
  };
}

interface retrieveAttractionsResult {
  attractions?: Attraction[], 
  categories?: {
    category: string, 
    attractions: Attraction[]
  }[]
}

interface GenerateAudioScriptParams {
  attractionName?: string, 
  topic?: string,
  topicDescription?: string, 
  itineraryItemsList?: string, 
  wikipediaData: string,
  language?: string,
}

export type {
    User,
    Translations,
    Attraction, 
    OverpassElement, 
    WikidataItem, 
    MapboxGeocodingResult, 
    MapboxIsochroneResult, 
    MapboxOptimizationResult, 
    Itinerary, 
    ItineraryItem, 
    ItineraryChatHistory, 
    WikipediaPage, 
    retrieveAttractionsResult,
    GenerateAudioScriptParams
  };