// wikidataService.ts
import { WikidataItem} from '../interfaces/interfaces'; // Define types (see below)

const WIKIDATA_API_BASE_URL = 'https://www.wikidata.org/w/rest.php/wikibase/v1';

export const getWikidataItem = async (qid: string): Promise<WikidataItem|null> => {
    const url = `${WIKIDATA_API_BASE_URL}/entities/items/${qid}`;
    const headers = {
      'Content-Type': 'application/json',
      //'Authorization': `${WIKIDATA_ACCESS_TOKEN}`,
    };
  
    try {
      const response = await fetch(url, { headers });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data: WikidataItem = await response.json();
    //   console.log(data);
      return data;
    } catch (error) {
      console.error('Error fetching Wikidata item:', error);
      return null;
    }
  }
  