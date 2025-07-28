import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Assuming you'll use JWTs for authentication after signup
import User from '../models/user.model'; // Adjust path to your User Mongoose model
// Ensure your User model has 'email' and 'password' fields defined

// Define a secret key for JWT (should be in environment variables in a real app)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use a strong, random key in production

/**
 * Handles user registration (sign-up) with email and password.
 * Hashes the password and saves the new user to the database.
 * Upon successful registration, it can optionally generate a JWT for immediate login.
 *
 * @param req The Express Request object, expecting 'email' and 'password' in the body.
 * @param res The Express Response object.
 */
export const signUp = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Input Validation
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Basic email format validation (can be more robust with a library like 'validator')
        if (!/\S+@\S+\.\S+/.test(email)) {
            res.status(400).json({ message: 'Invalid email format.' });
            return;
        }

        // Basic password strength validation (e.g., minimum length)
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters long.' });
            return;
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'User with that email already exists.' }); // 409 Conflict
            return;
        }

        // 3. Hash the password
        // The saltRounds determine how much processing power it will take to hash the password.
        // A higher number means more secure, but slower. 10-12 is a common range.
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Create a new user instance
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        // 5. Save the new user to the database
        const savedUser = await newUser.save();

        // 6. Optional: Generate a JWT for immediate login after successful registration
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email },
            JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 1 hour
        );

        // 7. Respond with success
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: savedUser._id,
                email: savedUser.email,
                // Do NOT send the hashed password back to the client
            },
            token, // Send the JWT for immediate authentication
        });

    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Failed to retrieve itinerary', details: error });
    }
};

/**
 * Handles user login (sign-in) with email and password.
 * Verifies the provided credentials against the database.
 * Upon successful authentication, it generates and returns a JWT.
 *
 * @param req The Express Request object, expecting 'email' and 'password' in the body.
 * @param res The Express Response object.
 */
export const signIn = async (req: Request, res: Response) => {
    try {
        console.log("signIn");
        const { email, password } = req.body;

        // 1. Input Validation
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // 2. Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            // Use a generic message to prevent username enumeration attacks
            res.status(401).json({ message: 'Invalid credentials.' });
            return
        }

        // 3. Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Use a generic message to prevent password enumeration attacks
            res.status(401).json({ message: 'Invalid credentials.' });
            return
        }

        // 4. Optional: Check if the user account is verified (if you have an email verification step)
        // if (!user.isVerified) {
        //     return res.status(403).json({ message: 'Please verify your email address to log in.' });
        // }

        // 5. Generate a JWT for the authenticated user
        const token = jwt.sign(
            { id: user._id, email: user.email }, // Payload: user ID and email
            JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 1 hour
        );

        // 6. Respond with success message, user info (excluding password), and the JWT
        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user._id,
                email: user.email,
                // Add any other user-specific data you want to send back (e.g., username, role)
            },
            token, // Send the JWT to the client
        });

    } catch (error) {
        console.error('Error during user sign-in:', error);
        res.status(500).json({ error: 'Failed to retrieve itinerary', details: error });
    }
};