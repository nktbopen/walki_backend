// src/models/itinerary.ts

import mongoose, { Schema, Document } from 'mongoose';
import { Itinerary, } from '../interfaces/interfaces';

const TranslationsSchema = new mongoose.Schema({
  en_US: {
    type: String,
  },
  ru_RU: {
    type: String,
  },
}, { _id: false });

// Define the ItineraryItem schema
const ItineraryItemSchema: Schema = new Schema({
    attractionId: { type: String, required: true }, //  Reference to the Attraction
    sequence: { type: Number, required: true },       //  Order of the item in the itinerary
    is_last: { type: Boolean, required: false },
    name: { type: String },
    duration: { type: String },
    audio: { type: String },
    coordinates: { type: [Number], index: '2dsphere' },
    description: { type: String },
    text: { type: TranslationsSchema, required: true ,  default: {}},
    images: { type: [String], required: false },
}, { _id: false });

// Define the schema using function notation
const itinerarySchema = new Schema({
    title: { type: String, required: false,},
    description: { type: String, required: false,},
    duration: { type: Number, required: false,},
    distance: { type: Number, required: false,},
    routeCoordinates: { type: [[Number,Number]], required: false,},
    itineraryItems: { type: [ItineraryItemSchema], required: false,},
}, { timestamps: true }); // Add timestamps (createdAt, updatedAt)

// Create the model
const ItineraryModel = mongoose.model<Itinerary>('Itinerary', itinerarySchema);

export default ItineraryModel;