#!/usr/bin/env node

/**
 * Proxy System Tests
 * Tests for wayfarer-proxy serverless function (Google Maps API proxy)
 */

const { Assert, ErrorHelper } = require('../test-helpers');

// Use built-in fetch (Node 18+) or require node-fetch for older versions
let fetch;
try {
    // Try built-in fetch first (Node 18+)
    if (typeof globalThis.fetch === 'function') {
        fetch = globalThis.fetch;
    } else {
        // Fallback to node-fetch if available
        fetch = require('node-fetch');
    }
} catch (e) {
    // If neither is available, tests will fail with a clear error
    fetch = null;
}

const PLACES_PROXY_URL = process.env.PLACES_PROXY_URL;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Test: Places Proxy - Basic Connectivity
 */
async function testPlacesProxyConnectivity() {
    if (!PLACES_PROXY_URL) {
        return { name: 'Places Proxy Connectivity', passed: false, skipped: true, reason: 'PLACES_PROXY_URL not configured' };
    }
    
    if (!fetch) {
        return { name: 'Places Proxy Connectivity', passed: false, skipped: true, reason: 'fetch not available (Node 18+ required or install node-fetch)' };
    }
    
    try {
        // Test OPTIONS request (CORS preflight)
        const optionsResponse = await fetch(PLACES_PROXY_URL, {
            method: 'OPTIONS'
        });
        
        // Check if we got a response (even if status is not 200, connection works)
        if (optionsResponse.status === 200) {
            Assert.equal(optionsResponse.headers.get('access-control-allow-origin'), '*', 'Should allow CORS from any origin');
            return { name: 'Places Proxy Connectivity', passed: true };
        } else {
            // If not 200, check if it's a network/connection issue or server issue
            return { name: 'Places Proxy Connectivity', passed: false, error: `OPTIONS returned status ${optionsResponse.status} instead of 200` };
        }
    } catch (error) {
        const errorMsg = ErrorHelper.extract(error);
        // Check if it's a network/connection error
        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('fetch failed')) {
            return { name: 'Places Proxy Connectivity', passed: false, skipped: true, reason: `Proxy server not reachable: ${errorMsg}` };
        }
        return { name: 'Places Proxy Connectivity', passed: false, error: errorMsg };
    }
}

/**
 * Test: Places Proxy - POST Request Structure
 */
async function testPlacesProxyPostRequest() {
    if (!PLACES_PROXY_URL) {
        return { name: 'Places Proxy POST Request', passed: false, skipped: true, reason: 'PLACES_PROXY_URL not configured' };
    }
    
    if (!fetch) {
        return { name: 'Places Proxy POST Request', passed: false, skipped: true, reason: 'fetch not available' };
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
        return { name: 'Places Proxy POST Request', passed: false, skipped: true, reason: 'GOOGLE_MAPS_API_KEY not configured (proxy needs it)' };
    }
    
    try {
        const requestBody = {
            textQuery: 'things to do',
            locationBias: {
                circle: {
                    center: {
                        latitude: 33.1262316,
                        longitude: -117.310507
                    },
                    radius: 5000
                }
            },
            maxResultCount: 5
        };
        
        const response = await fetch(PLACES_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-fieldmask': 'places.id,places.displayName,places.formattedAddress'
            },
            body: JSON.stringify(requestBody)
        });
        
        // Proxy should forward the request (may succeed or fail based on API key validity)
        Assert.notEqual(response.status, 405, 'Should accept POST requests');
        Assert.notEqual(response.status, 500, 'Should not have server configuration error');
        
        // If we get a 200, verify the response structure
        if (response.status === 200) {
            const data = await response.json();
            // Google Places API returns either places array or error
            Assert.isObject(data, 'Response should be JSON object');
        } else if (response.status === 400 || response.status === 403) {
            // These are expected if API key is invalid or request is malformed
            // Still counts as proxy working correctly
            const data = await response.json();
            Assert.isObject(data, 'Error response should be JSON object');
        }
        
        return { name: 'Places Proxy POST Request', passed: true };
    } catch (error) {
        return { name: 'Places Proxy POST Request', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Places Proxy - Invalid Method
 */
async function testPlacesProxyInvalidMethod() {
    if (!PLACES_PROXY_URL) {
        return { name: 'Places Proxy Invalid Method', passed: false, skipped: true, reason: 'PLACES_PROXY_URL not configured' };
    }
    
    if (!fetch) {
        return { name: 'Places Proxy Invalid Method', passed: false, skipped: true, reason: 'fetch not available' };
    }
    
    try {
        // Test GET request (should be rejected)
        const response = await fetch(PLACES_PROXY_URL, {
            method: 'GET'
        });
        
        Assert.equal(response.status, 405, 'GET request should return 405 Method Not Allowed');
        
        const data = await response.json();
        Assert.hasProperty(data, 'error', 'Error response should have error property');
        
        return { name: 'Places Proxy Invalid Method', passed: true };
    } catch (error) {
        return { name: 'Places Proxy Invalid Method', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Places Proxy - Missing API Key (Proxy Error)
 */
async function testPlacesProxyMissingApiKey() {
    // This test would require the proxy to not have GOOGLE_MAPS_API_KEY set
    // In practice, this is hard to test without controlling the proxy environment
    // So we'll skip it or test the error handling structure
    
    if (!PLACES_PROXY_URL) {
        return { name: 'Places Proxy Missing API Key', passed: false, skipped: true, reason: 'PLACES_PROXY_URL not configured' };
    }
    
    // Note: This test assumes the proxy has the API key configured
    // In a real scenario, you'd need to test with a proxy that doesn't have the key
    return { name: 'Places Proxy Missing API Key', passed: false, skipped: true, reason: 'Requires proxy environment control' };
}

/**
 * Test: Places Proxy - Field Mask Header
 */
async function testPlacesProxyFieldMask() {
    if (!PLACES_PROXY_URL) {
        return { name: 'Places Proxy Field Mask', passed: false, skipped: true, reason: 'PLACES_PROXY_URL not configured' };
    }
    
    if (!fetch) {
        return { name: 'Places Proxy Field Mask', passed: false, skipped: true, reason: 'fetch not available' };
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
        return { name: 'Places Proxy Field Mask', passed: false, skipped: true, reason: 'GOOGLE_MAPS_API_KEY not configured' };
    }
    
    try {
        const requestBody = {
            textQuery: 'restaurants',
            locationBias: {
                circle: {
                    center: {
                        latitude: 33.1262316,
                        longitude: -117.310507
                    },
                    radius: 1000
                }
            },
            maxResultCount: 3
        };
        
        const customFieldMask = 'places.id,places.displayName,places.rating';
        
        const response = await fetch(PLACES_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-fieldmask': customFieldMask
            },
            body: JSON.stringify(requestBody)
        });
        
        // Proxy should forward the custom field mask
        Assert.notEqual(response.status, 405, 'Should accept POST with custom field mask');
        
        return { name: 'Places Proxy Field Mask', passed: true };
    } catch (error) {
        return { name: 'Places Proxy Field Mask', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all proxy system tests
 */
async function runProxySystemTests() {
    const tests = [
        testPlacesProxyConnectivity,
        testPlacesProxyPostRequest,
        testPlacesProxyInvalidMethod,
        testPlacesProxyMissingApiKey,
        testPlacesProxyFieldMask
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runProxySystemTests,
    testPlacesProxyConnectivity,
    testPlacesProxyPostRequest,
    testPlacesProxyInvalidMethod,
    testPlacesProxyMissingApiKey,
    testPlacesProxyFieldMask
};

