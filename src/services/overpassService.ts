// overpassService.ts

import { AttractionCategories } from '../constants/AttractionCategories';
import { OverpassElement} from '../interfaces/interfaces'; // Define types (see below)

const OVERPASS_API_BASE_URL = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
// const OVERPASS_API_BASE_URL = 'https://overpass-api.de/api/interpreter';

const mapboxToOsmGeoJsonPolygon = (mapboxPolygon: GeoJSON.Polygon): GeoJSON.Polygon | null => {
    if (
      !mapboxPolygon ||
      mapboxPolygon.type !== 'Polygon' ||
      !Array.isArray(mapboxPolygon.coordinates) ||
      mapboxPolygon.coordinates.length !== 1 ||
      !Array.isArray(mapboxPolygon.coordinates[0])
    ) {
      return null; // Invalid GeoJSON Polygon
    }
  
    const osmCoordinates: number[][] = mapboxPolygon.coordinates[0].map(coord => {
      if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
        return null; // Invalid coordinate pair
      }
      return [coord[1], coord[0]];
    }).filter(coord => coord !== null) as number[][];
  
    if (osmCoordinates.length !== mapboxPolygon.coordinates[0].length){
      return null; // one or more coordinate pairs were invalid
    }
  
    return {
      type: 'Polygon',
      coordinates: [osmCoordinates],
    };
};

const calculateBbox = (geojson: GeoJSON.Polygon): [number,number,number,number]|null => {
    if (!geojson || !geojson.coordinates || geojson.type !== 'Polygon') {
      return null; // Invalid GeoJSON
    }
  
    const coordinates = geojson.coordinates[0]; // Get the coordinates of the polygon
  
    if (!coordinates || coordinates.length === 0) {
      return null; // No coordinates found
    }
  
    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];
  
    for (const coord of coordinates) {
      const lng = coord[0];
      const lat = coord[1];
  
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  
    return [minLng, minLat, maxLng, maxLat]; // [minLng, minLat, maxLng, maxLat]
};

const deduplicateElements = (elements: OverpassElement[]): OverpassElement[] => {
    const deduplicatedElements: { [id: number]: OverpassElement } = {};
  
    for (const element of elements) {
      if (deduplicatedElements[element.id]) {
        // Element already exists, combine categories
        const existingElement = deduplicatedElements[element.id];
  
        if (element.categories) {
          if (!existingElement.categories) {
            existingElement.categories = [];
          }
  
          for (const category of element.categories) {
            if (!existingElement.categories.includes(category)) {
              existingElement.categories.push(category);
            }
          }
        }
      } else {
        // Element doesn't exist, add it to the deduplicated list
        deduplicatedElements[element.id] = { ...element }; // Create a shallow copy
      }
    }
  
    // Convert the object back to an array
    return Object.values(deduplicatedElements);
};

const send_overpass_query = async (category: {name: string, rule:string}, polygonBbox:[number,number,number,number], coordinates: string): Promise<OverpassElement[]>  => {
    try {
        const query = `
        [out:json][timeout:30][bbox:${polygonBbox}];
        (
            (
                ${category.rule}
            )->.a;
            nwr.a(poly:"${coordinates}")->.b;
            nwr.b["wikipedia"]->.c;
        );
        .c out tags center;`;
        //console.log(query);
        const params = new URLSearchParams({ data: query });
        const response = await fetch(`${OVERPASS_API_BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data: {elements: OverpassElement[] } = await response.json();

        if (data && data.elements) {
            data.elements.forEach((e)=>{e.categories=[category.name]});
            return data.elements;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error retrieving tourist attractions:', error);
        return [];
    }
}

const sleep = (ms: number):Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getTouristAttractions = async (geojsonPolygon: GeoJSON.Polygon, categories: string[]|string): Promise<OverpassElement[]> => {
    if (!geojsonPolygon || geojsonPolygon.type !== 'Polygon' || !geojsonPolygon.coordinates || geojsonPolygon.coordinates.length === 0) {
        throw new Error('Invalid GeoJSON Polygon');
    }

    const osmPolygon = mapboxToOsmGeoJsonPolygon(geojsonPolygon);

    if(!osmPolygon){
        throw new Error('Invalid GeoJSON Polygon');
    }

    const polygonBbox = calculateBbox(osmPolygon);
    const coordinates = osmPolygon.coordinates[0].map(coord => coord.join(' ')).join(' ');
    const categoryQueries = categories === 'ALL' ? AttractionCategories : AttractionCategories.filter(r => categories.includes(r.name));

    let result: OverpassElement[] = [];

    if(polygonBbox && coordinates && categoryQueries) {
        for (const category of categoryQueries) {
            try {
                  console.log("send_overpass_query");
                  const overpassData = await send_overpass_query(category, polygonBbox, coordinates);
                  if (overpassData) {
                    result = result.concat(overpassData);
                  }
                  await sleep(100);
            } catch (error) {
                console.error(`Error fetching data for category ${category.name}:`, error);
            }
        }
    }

    return deduplicateElements(result);
};