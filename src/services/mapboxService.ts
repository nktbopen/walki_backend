// mapboxService.ts

import polyline from '@mapbox/polyline';
import { MapboxGeocodingResult, MapboxIsochroneResult, MapboxOptimizationResult} from '../interfaces/interfaces'; // Define types (see below)

//import { MAPBOX_ACCESS_TOKEN} from "@env";

const MAPBOX_GEOCODE_API_BASE_URL = 'https://api.mapbox.com/search/geocode/v6';
const MAPBOX_ISOCHRONE_API_BASE_URL = 'https://api.mapbox.com/isochrone/v1';
const MAPBOX_OPTIMIZATION_API_URL = 'https://api.mapbox.com/optimized-trips/v1';
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoibmt0YiIsImEiOiJjazhscjEwanEwZmYyM25xbzVreWMyYTU1In0.dcztuEUgjlhgaalrc_KLMw';

export const searchLocationByName = async (searchTerm: string): Promise<MapboxGeocodingResult[]> => {
  try {
    const response = await fetch(
      `${MAPBOX_GEOCODE_API_BASE_URL}/forward?q=${encodeURIComponent(searchTerm)}&access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true` //&types=place,locality,neighborhood` // Include locality (city)
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox Geocoding API Error: ${response.status} - ${errorText}`);
    }

    const data: { features: MapboxGeocodingResult[] } = await response.json(); // Type the response
    //console.log(data.features);
    return data.features; // Return the features array

  } catch (error) {
    console.error('Error in searchLocations:', error);
    return [];
  }
};

export const searchLocationByCoords = async (coords: number[]): Promise<MapboxGeocodingResult[]> => {
  try {
    const response = await fetch(
      `${MAPBOX_GEOCODE_API_BASE_URL}/reverse?longitude=${encodeURIComponent(coords[0])}&latitude=${encodeURIComponent(coords[1])}&access_token=${MAPBOX_ACCESS_TOKEN}&types=address`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox Geocoding API Error: ${response.status} - ${errorText}`);
    }

    const data: { features: MapboxGeocodingResult[] } = await response.json(); // Type the response
    //console.log(data.features);
    return data.features; // Return the features array

  } catch (error) {
    console.error('Error in searchLocations:', error);
    return [];
  }
};

export const retrieveIsochrone = async (coords: string, contours: string): Promise<MapboxIsochroneResult[]> => {
  try {
    const response = await fetch(
      `${MAPBOX_ISOCHRONE_API_BASE_URL}/mapbox/walking/${encodeURIComponent(coords)}?contours_minutes=${encodeURIComponent(contours)}&polygons=true&access_token=${MAPBOX_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox Isochrone API Error: ${response.status} - ${errorText}`);
    }

    const data: { features: MapboxIsochroneResult[] } = await response.json(); // Type the response
    return data.features; // Return the features array

  } catch (error) {
    console.error('Error in retrieveIsochrone:', error);
    return [];
  }
};

export const retrieveOptimizedRoute = async (coords: string): Promise<MapboxOptimizationResult|undefined> => {
  try {
    const response = await fetch(
      `${MAPBOX_OPTIMIZATION_API_URL}/mapbox/walking/${encodeURIComponent(coords)}?annotations=duration&roundtrip=false&source=first&destination=last&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapbox Optimization API Error: ${response.status} - ${errorText}`);
    }

    const data: MapboxOptimizationResult = await response.json(); // Type the response
    
    const decoded = polyline.decode(data.trips[0].geometry);
    const lngLatCoordinates: [number,number][] = decoded.map((coord) => [coord[1], coord[0]]);
    data.trips[0].coordinates = lngLatCoordinates;
    
    return data;

  } catch (error) {
    console.error('Error in retrieveOptimizedRoute:', error);
    return undefined;
  }
};