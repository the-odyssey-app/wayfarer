const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Ensure the request is a POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 4. Get the Google Maps API key from environment variables
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set on the proxy server.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // 5. Forward the request to the Google Places API
    const googleApiUrl = 'https://places.googleapis.com/v1/places:searchText';

    const response = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // The client (Nakama) will pass the field mask it needs
        'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || 'places.id,places.displayName,places.formattedAddress'
      },
      body: JSON.stringify(req.body) // Vercel automatically parses the body
    });

    // 6. Check if the fetch was successful
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google API Error: ${response.status} ${response.statusText}`, errorBody);
      return res.status(response.status).json({
        error: 'Failed to fetch from Google Places API.',
        details: errorBody
      });
    }

    // 7. Stream the response from Google back to the original caller
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy internal error:', error);
    return res.status(500).json({ error: 'An internal error occurred.' });
  }
};
