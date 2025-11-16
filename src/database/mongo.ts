import mongoose from 'mongoose';
import loadConfig from '../config';
import { createVectorIndex, createAutocompleteIndex } from '../services/mongoAtlasService';

let config: any;

const connectToDatabase = async () => {
  try {
    config = await loadConfig();
    const dbUrl = await config.mongo.url;
    await mongoose.connect(dbUrl);

    // creating Indexes
    await createVectorIndex();
    await createAutocompleteIndex();

    console.log('Successfully connected to MongoDB');

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error; //  Re-throw the error to be handled by the caller (app.ts)
  }
};

export { connectToDatabase };
