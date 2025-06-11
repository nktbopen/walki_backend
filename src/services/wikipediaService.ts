//wikipediaService.ts

import { WikipediaPage} from '../interfaces/interfaces'; // Define types (see below)

export const getWikipediaData = async (wikipediaTag: string): Promise<WikipediaPage|null> => {
    const parts = wikipediaTag.split(':');
    if (parts.length !== 2) {
        console.error('Invalid Wikipedia tag format. Expected "language:pageTitle".');
        return null;
    }

    const lang = parts[0];
    const pageTitle = parts[1];

    const url = `https://${lang}.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(pageTitle)}&formatversion=2`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data:WikipediaPage = await response.json();

        if (data.parse && data.parse.text) {
            return data;
        } else {
            console.error('Invalid Wikipedia API response.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Wikipedia data:', error);
        return null;
    }
  }
  