const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 1. Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Ensure the request is a POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 4. Get the OpenRouter API key from environment variables
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set on the proxy server.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // 5. Forward the request to the OpenRouter API
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Build headers for OpenRouter API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://wayfarer.app', // For OpenRouter leaderboards (optional)
      'X-Title': 'Wayfarer' // For OpenRouter leaderboards (optional)
    };

    // Forward any additional headers from the request (like Cache-Control)
    if (req.headers['cache-control']) {
      headers['Cache-Control'] = req.headers['cache-control'];
    }

    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body) // Vercel automatically parses the body
    });

    // 6. Check if the fetch was successful
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenRouter API Error: ${response.status} ${response.statusText}`, errorBody);
      return res.status(response.status).json({
        error: 'Failed to fetch from OpenRouter API.',
        details: errorBody
      });
    }

    // 7. Stream the response from OpenRouter back to the original caller
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy internal error:', error);
    return res.status(500).json({ error: 'An internal error occurred.' });
  }
};

