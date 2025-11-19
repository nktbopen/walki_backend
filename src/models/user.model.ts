import mongoose, { Schema, Document, } from 'mongoose';
import { User} from '../interfaces/interfaces';

// Define the User schema
const UserSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures email addresses are unique
        lowercase: true, // Stores emails in lowercase
        trim: true, // Removes whitespace from both ends of a string
    },
    password: {
        type: String,
        required: true,
    },
     itineraries: [{
        type: Schema.Types.ObjectId,
        ref: 'Itinerary', // This tells Mongoose which model to use when populating
    }],
    language: {
        type: String,
        default: 'en_US',
    }
    // Add other schema definitions for additional fields
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
});

// Define the model interface (optional, but recommended for better type safety)
export interface UserInterface extends User, Document {}

// Create and export the User model
const UserModel = mongoose.model<User>('User', UserSchema);

export default UserModel;
