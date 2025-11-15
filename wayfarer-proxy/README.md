# Wayfarer Places API Proxy

This directory contains a simple Vercel serverless function to proxy requests to the Google Places API. This is a workaround for a suspected bug in the Nakama `httpRequest` function that prevents direct POST requests to the `places:searchText` endpoint.

## How it Works

1.  Nakama's `callGoogleMapsTextSearch` function sends a POST request to this serverless function.
2.  The function receives the request, extracts the body and the desired `X-Goog-FieldMask` from the headers.
3.  It retrieves the `GOOGLE_MAPS_API_KEY` from its own server environment variables.
4.  It constructs a new, clean request and forwards it to the official Google Places API endpoint.
5.  It streams the response from Google directly back to the Nakama server.

## Deployment

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```

2.  **Link Project**:
    Navigate to this `wayfarer-proxy` directory and link it to your Vercel account.
    ```bash
    cd wayfarer-proxy
    vercel login
    vercel link
    ```
    Follow the prompts to link it to a new or existing Vercel project.

3.  **Set Environment Variable**:
    You **MUST** set the Google Maps API key as an environment variable in your Vercel project settings.
    ```bash
    vercel env add GOOGLE_MAPS_API_KEY
    ```
    Paste your API key when prompted. Make sure to add this for the "Production" environment.

4.  **Deploy**:
    Deploy the function to production.
    ```bash
    vercel --prod
    ```

5.  **Update Nakama Configuration**:
    Once deployed, Vercel will give you a production URL (e.g., `https://your-project-name.vercel.app`). You need to set this URL as an environment variable for your Nakama server.

    In your `wayfarer-nakama/local.yml` or `docker-compose.yml`, add:
    ```yaml
    runtime:
      env:
        # ... other keys
        PLACES_PROXY_URL: 'https://your-project-name.vercel.app/api/places-search'
    ```
    The Nakama code will use this `PLACES_PROXY_URL` variable to contact the proxy.
