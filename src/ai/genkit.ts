import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if Google AI API Key is present
if (!process.env.GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY environment variable is not set. Genkit Google AI plugin might not function correctly.");
}


export const ai = genkit({
  plugins: [
    googleAI({
      // Read the API key from the GOOGLE_API_KEY environment variable.
      // Make sure to set this variable in your environment or a .env.local file.
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  logLevel: 'debug', // Enable debug logging for more detailed output
  flowStateStore: 'firebase', // Example if using Firebase for state persistence
  traceStore: 'firebase', // Example if using Firebase for tracing
  model: 'googleai/gemini-2.0-flash', // Keep the default model, can be overridden per call
});
