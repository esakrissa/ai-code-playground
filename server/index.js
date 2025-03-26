import express from 'express';
import { OpenAI } from 'openai';
import generateRouter from './api/generate';
import dotenv from 'dotenv';
import morgan from 'morgan';
// Configuration and initialization
let port;
try {
    dotenv.config();
    // Verify required environment variables
    if (!process.env.VITE_OPENAI_API_KEY) {
        throw new Error('Missing required environment variable: VITE_OPENAI_API_KEY');
    }
    port = Number(process.env.PORT) || 3001;
    // Initialize OpenAI client
    const openai = new OpenAI({
        apiKey: process.env.VITE_OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
}
catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
}
// Express app setup
const app = express();
// Add request logging
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', generateRouter);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Server startup
console.log(`Starting server on port ${port}...`);
const server = app.listen(port, '0.0.0.0', () => {
    const address = server.address();
    if (typeof address === 'string') {
        console.log(`Server listening on ${address}`);
    }
    else if (address) {
        console.log(`Server listening on ${address.address}:${address.port}`);
    }
    console.log(`API endpoints available at http://localhost:${port}/api/generate`);
});
// Process handlers
process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => process.exit(0));
});
// Handle server errors
server.on('error', (err) => {
    console.error('Server startup error:', err);
});
// Export for testing
export default app;
