import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectToDatabase } from './database/mongo'; // Import the database connection function
import attractionsRouter from './routes/attraction.routes'; // Import the attractions routes
import itinerariesRouter from './routes/itinerary.routes';
import usersRouter from './routes/user.routes';

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the attractions router
app.use('/attractions', attractionsRouter);

// Mount the itinerary router
app.use('/itineraries', itinerariesRouter);

// Mount the user router
app.use('/users', usersRouter);

// Basic error handling middleware (you can expand on this)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Function to start the server, including database connection
const startServer = async () => {
    try {
        // Connect to the database
        await connectToDatabase();
        console.log('Connected to the database');

        // Start the Express server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        //  Handle the error appropriately (e.g., exit the process, retry connection)
        process.exit(1);
    }
};

// Start the server
startServer();
