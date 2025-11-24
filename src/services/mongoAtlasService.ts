import { Request, Response } from 'express';
import {HTMLNodeParser, Document, SentenceSplitter } from 'llamaindex';
import { VoyageAIClient } from 'voyageai';
import AttractionModel from '../models/attraction.model';
import qs from 'qs';
import { sleep } from '../utils/utils';

// Initialize the Voyage AI client
const voyageClient = new VoyageAIClient({apiKey: process.env.VOYAGE_API_KEY});

// Set index name
const vector_index_name = 'attractions_vector_index';
const autocomplete_index_name = 'attractions_autocomplete_index';

/**
 * 1. getEmbedding(text) - Generates an embedding for a given text using Voyage AI.
 * @param {string[]|string} chunks The input chunks of text to embed.
 * @returns {Promise<Array<number>>} The generated embedding vector.
 */

export const getEmbedding = async (chunks: string[]|string): Promise<number[]> => {
  if (!chunks) {
    throw new Error('Text input is required to generate an embedding.');
  }

  try {
    const result = await voyageClient.embed({
      input: chunks,
      model: 'voyage-3-large', // Or another Voyage AI model
    });

    if(result.data && result.data[0] && result.data[0].embedding){
        const embeddings = result.data[0].embedding;
        //console.log("embeddings:", embeddings);
        return embeddings;
    } else {
        return [];
    }
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding from Voyage AI.');
  }
};

export const parseHTMLDocument = async(html: string): Promise<string[]> => {
    try {
        const html_parser = new HTMLNodeParser();

        const document = new Document({
            text: html,
        });

        const nodes = await html_parser.getNodesFromDocuments([document]);

        const textSplitter = new SentenceSplitter();
        const chunks = textSplitter.splitText(nodes[0].text);
        //console.log("chunks:",chunks);

        return chunks;

    } catch (error) {
        console.error('Error in parseHTMLDocument:', error);
        return [];
    }
};

/**
 * 2. createEmbeddings() - Iterates through attractions and generates embeddings for them.
 * This is a one-time process to enrich your data.
 */
export const createEmbeddings = async () => {
  console.log('Starting to create embeddings for attractions...');
  try {
    const attractionsToUpdate = await AttractionModel.find({ embedding: { $exists: false } }).limit(150);

    if (attractionsToUpdate.length === 0) {
        console.log('All attractions already have embeddings.');
        return;
    }

    console.log("attractionsToUpdate:",attractionsToUpdate.length);

    attractionsToUpdate.forEach(async (attraction) => {
      try {
        const textToEmbed = []
        textToEmbed.push(`Name: ${attraction.name}.`);
        textToEmbed.push(`Address: ${attraction.address}`);
        textToEmbed.push(`Description: ${attraction.description}`);
        textToEmbed.push(`Categories: ${attraction.categories}`);
      
        if(attraction.wikipedia_content){
            const wiki_content = await parseHTMLDocument(attraction.wikipedia_content);
            textToEmbed.push(...wiki_content);
        }

        const embedding = await getEmbedding(textToEmbed);
        attraction.embedding = embedding;
        await attraction.save();
        console.log(`Successfully created embedding for ${attraction.name}:`);
        await sleep(100);

      } catch (error) {
        console.error(`Failed to create embedding for ${attraction.name}:`, error);
      }
    });

    console.log(`Successfully created and saved embeddings for ${attractionsToUpdate.length} attractions.`);
  } catch (error) {
    console.error('Error in createEmbeddings:', error);
  }
};

/**
 * 3. createVectorIndex() - Instructions for creating the vector search index in MongoDB Atlas.
 * NOTE: This is NOT an in-code function. You must manually create this index in the
 * MongoDB Atlas UI or via the MongoDB shell.
 * Here is the JSON configuration you will need for the index.
 */

export const createIndex = async (index_name: string, indexDefinition: any) => {
  console.log(`Trying create index ${index_name}`);
  const indexes = await AttractionModel.listSearchIndexes();
  if (!indexes.map(i => i.name).includes(index_name)) {
      await AttractionModel.createSearchIndex(indexDefinition);
      console.log(`Index ${index_name} created`);
  } else {
      console.log(`Index ${index_name} already exists`);
  }
};

export const createVectorIndex = async () => {
  const indexDefinition = {
    name: vector_index_name,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1024,
          similarity: 'cosine',
        },
      ],
    },
  };

  await createIndex(vector_index_name, indexDefinition);
};

export const createAutocompleteIndex = async () => {
  const indexDefinition = {
    name: autocomplete_index_name,
    definition: {
      /* search index definition fields */
      "mappings": {
        "dynamic": false,
          "fields": {
            "name": {
                "type": "autocomplete",
                "analyzer": "lucene.standard",
                "tokenization": "edgeGram",
                "minGrams": 3,
                "maxGrams": 5,
                "foldDiacritics": false
            }
        }
      }
    }
  };
  await createIndex(autocomplete_index_name, indexDefinition);
};

/**
 * 4. vectorQuery() - Defines and executes a sample vector search pipeline.
 * This function takes a user query and finds similar attractions.
 */
export const vectorSearch = async (bbox?: [[number,number],[number,number]], locationCoords?: [number,number], queryText?: string): Promise<any[]> => {

  try {
    const pipeline = [];

    if(queryText){
      // Generate the embedding for the user's search query
      const queryEmbedding = await exports.getEmbedding(queryText);
      pipeline.push(
        {
          $vectorSearch: {
            index: vector_index_name, // Must match the name of the index you created
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100, // Number of nearest neighbors to search
            limit: 15, // Number of results to return
          },
        }
      );
    }
    // Define the vector search aggregation pipeline
    if(bbox){
      pipeline.push(
        {
          $match: {
            coordinates: {
              $geoWithin:{
                $box: bbox,
              }
            }
          },
        }
      );
    }

    if(locationCoords){
      pipeline.push(
        {
          $match: {
            coordinates: {
              $geoWithin:{
                $centerSphere: [locationCoords, 1000/6378137], //query uses the Earth's equatorial radius in meters: 6,378,137 meters, to convert the 1000-meter radius to radians.
              }
            }
          },
        }
      );
    }

    pipeline.push(
      {
        // Optional: Project only necessary fields and calculate score
        $project: {
          _id: 1,
          osm_id: 1,
          name: 1,
          description: 1,
          address: 1,
          categories: 1,
          coordinates: 1,
          images: 1,
          article: 1,
          score: {
            $meta: 'vectorSearchScore',
          },
        },
      }, 
    );

    // Execute the aggregation pipeline
    const attractions = await AttractionModel.aggregate(pipeline);

    return attractions;
  } catch (error) {
    console.error('Error running vector search query:', error);
    return [];
  }
};

/**
 * autocompleteSearch() - Defines and executes a autocomplete search pipeline.
 * This function takes a user query and finds similar attractions.
 */
export const autocompleteSearch = async (queryText: string, bbox?: [[number,number],[number,number]]): Promise<any[]> => {

  try {
    const pipeline = [];

    // Generate the embedding for the user's search query
    pipeline.push(
      {
        $search: {
          index: autocomplete_index_name,  
          autocomplete: {
            query: queryText,
            path: 'name',
            tokenOrder: 'sequential',
            fuzzy: {
              maxEdits: 2,
              prefixLength: 2,
              maxExpansions: 50,
            },
          },
          highlight:{
            path: 'name'
          }
        },
      }
    );

    if(bbox){
      pipeline.push(
        {
          $match: {
            coordinates: {
              $geoWithin:{
                $box: bbox,
              }
            }
          },
        }
      );
    }

    pipeline.push({$limit: 5})

    pipeline.push(
      {
        // Optional: Project only necessary fields and calculate score
        $project: {
          _id: 1,
          osm_id: 1,
          name: 1,
          description: 1,
          address: 1,
          categories: 1,
          coordinates: 1,
          images: 1,
          article: 1,
          highlights: {
            $meta: 'searchHighlights'
          },
        },
      }, 
    );

    // Execute the aggregation pipeline
    const attractions = await AttractionModel.aggregate(pipeline);

    return attractions;
  } catch (error) {
    console.error('Error running vector search query:', error);
    return [];
  }
};