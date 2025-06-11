// config.developemts.ts
import dotenv from 'dotenv'; 

dotenv.config(); 

export default {
    // Example:  Turn on detailed logging in development
    logging: true,
    mongo: { 
        url: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@walki-dev.fqjsrav.mongodb.net/walki-dev?retryWrites=true&w=majority&appName=walki-dev`
    }
};
