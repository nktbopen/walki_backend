import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define a secret key for JWT verification.
// In a production environment, this should be loaded from environment variables
// (e.g., process.env.JWT_SECRET) and kept highly secure.
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use the same secret key as in user.controller.ts

// Extend the Request interface to include a 'user' property
// This allows TypeScript to recognize req.user after the token is decoded
declare module 'express' {
    interface Request {
        user?: { id: string; email: string; [key: string]: any }; // Adjust type based on your JWT payload
    }
}

/**
 * Middleware to verify JSON Web Tokens (JWT) for authentication.
 * It expects the JWT in the 'Authorization' header as 'Bearer <token>'.
 * If the token is valid, it decodes the payload and attaches it to req.user.
 * Otherwise, it sends a 401 Unauthorized response.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @param next The Express NextFunction to pass control to the next middleware.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // Get the Authorization header from the request
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists
    if (authHeader) {
        // Extract the token (assuming format "Bearer <token>")
        const token = authHeader.split(' ')[1];

        // Verify the token using the secret key
        jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: any) => {
            if (err) {
                // If verification fails (e.g., token expired, invalid signature)
                console.error('JWT verification error:', err.message);
                return res.status(401).json({ message: 'Invalid or expired token.' });
            } else {
                // If verification is successful, attach the decoded payload to the request object
                req.user = decoded;
                // Pass control to the next middleware or route handler
                next();
            }
        });
    } else {
        // If no Authorization header is provided
        res.status(401).json({ message: 'No authentication token provided.' });
    }
};