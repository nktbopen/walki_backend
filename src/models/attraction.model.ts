// src/models/attraction.ts

import mongoose, { Schema, Document } from 'mongoose';
import { Attraction, } from '../interfaces/interfaces';

const TranslationsSchema = new mongoose.Schema({
  en_US: {
    type: String,
  },
  ru_RU: {
    type: String,
  },
}, { _id: false });

// Define the schema using function notation
const attractionSchema = new Schema({
    osm_id: { type: Number, required: true},
    name: { type: String, required: false },
    coordinates: { type: [Number], required: false, index: '2dsphere'},
    address: { type: String, required: false },
    categories: { type: [String], required: false },
    description: { type: String, required: false },
    wikidata: { type: String, required: false },
    wikipedia: { type: String, required: false },
    wikipedia_content: { type: String, required: false },
    wikimedia: { type: String, required: false },
    images: { type: [String], required: false },
    website: { type: String, required: false },
    embedding: {type: [Number], required: false},
    article: { type: TranslationsSchema, default: {} },
}, { timestamps: true }); // Add timestamps (createdAt, updatedAt)

// Define the model interface (optional, but recommended for better type safety)
export interface AttractionInterface extends Attraction, Document {}

// Create the model
const AttractionModel = mongoose.model<Attraction>('Attraction', attractionSchema);

export default AttractionModel;