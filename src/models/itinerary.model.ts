// src/models/itinerary.ts

import mongoose, { Schema, Document } from 'mongoose';
import { Itinerary, ItineraryItem } from '../interfaces/interfaces';

// Define the ItineraryItem schema
const ItineraryItemSchema: Schema = new Schema({
    attractionId: { type: String, required: true }, //  Reference to the Attraction
    sequence: { type: Number, required: true },       //  Order of the item in the itinerary
    is_last: { type: Boolean, required: false },
    name: { type: String },
    duration: { type: String },
    audio: { type: String },
    coordinates: { type: [Number] },
    description: { type: String },
    text: { type: String },
    images: { type: [String], required: false },
}, { _id: false });

// Define the schema using function notation
const itinerarySchema = new Schema({
    title: { type: String, required: false,},
    duration: { type: Number, required: false,},
    distance: { type: Number, required: false,},
    routeCoordinates: { type: [[Number,Number]], required: false,},
    itineraryItems: { type: [ItineraryItemSchema], required: false,},
}, { timestamps: true }); // Add timestamps (createdAt, updatedAt)

// Create the model
const ItineraryModel = mongoose.model<Itinerary>('Itinerary', itinerarySchema);

export default ItineraryModel;