// Add this import at the top of server-sqlite.ts
import { handleCountryRecommendations } from './routes/country-recommendations';

// Replace the existing /api/country-recommendations endpoint with:
app.get('/api/country-recommendations', handleCountryRecommendations);
