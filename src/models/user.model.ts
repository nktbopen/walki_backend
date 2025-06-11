import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the User interface
export interface User extends Document {
    email: string;
    password: string; // Storing hashed password
    itineraries?: Types.ObjectId[];
}

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
        ref: 'Itinerary' // This tells Mongoose which model to use when populating
    }],
    // Add other schema definitions for additional fields
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
});

// Create and export the User model
const UserModel = mongoose.model<User>('User', UserSchema);

export default UserModel;
