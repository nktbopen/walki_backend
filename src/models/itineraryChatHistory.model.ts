import mongoose, { Schema, Document, Types } from 'mongoose';
import {ItineraryChatHistory} from '../interfaces/interfaces';

// Define the User schema
const ItineraryChatHistorySchema: Schema = new Schema({
    itineraryId: {
        type: String,
        required: true,
        unique: true,
    },
     history: {
        type: [String],
        required: false,
    },
    // Add other schema definitions for additional fields
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
});

// Create and export the User model
const ItineraryChatHistoryModel = mongoose.model<ItineraryChatHistory>('ItineraryChatHistory', ItineraryChatHistorySchema);

export default ItineraryChatHistoryModel;
