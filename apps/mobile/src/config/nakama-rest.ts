import { Buffer } from 'buffer';
import { NAKAMA_CONFIG } from './nakama';

console.log('🚀 nakama-rest.ts MODULE LOADED - REST API module is being imported');

// Get Nakama base URL
const getNakamaBaseUrl = () => {
  const protocol = NAKAMA_CONFIG.useSSL ? 'https' : 'http';
  return `${protocol}://${NAKAMA_CONFIG.host}:${NAKAMA_CONFIG.port}`;
};

// Helper to create Authorization header with server key
const getAuthHeader = () => {
  // Nakama REST API uses Basic Auth with server key
  // Format: Basic base64(serverKey:)
  const credentials = `${NAKAMA_CONFIG.serverKey}:`;
  // Use Buffer for base64 encoding (available in React Native via polyfill)
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
};

// Helper to create Bearer token header for authenticated requests
const getBearerHeader = (token: string) => {
  return `Bearer ${token}`;
};

// REST API client for Nakama
export const nakamaRestApi = {
  /**
   * Authenticate with email and password
   * POST /v2/account/authenticate/email
   */
  authenticateEmail: async (email: string, password: string, create: boolean = true, username?: string) => {
    console.log('🚀 REST API AUTHENTICATION - Using direct REST API (not JS client)');
    const url = `${getNakamaBaseUrl()}/v2/account/authenticate/email`;
    
    const body: any = {
      email,
      password,
      create,
    };
    
    if (username) {
      body.username = username;
    }

    console.log('🔍 REST API: Authenticating with email', {
      url,
      email,
      create,
      username: username || 'not provided'
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      console.log('🔍 REST API: Response status', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 REST API: Error response', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('🔍 REST API: Authentication successful', {
        userId: data.user_id,
        username: data.username,
        hasToken: !!data.token
      });

      return {
        token: data.token,
        refresh_token: data.refresh_token,
        user_id: data.user_id,
        username: data.username,
        created: data.created || false,
      };
    } catch (error) {
      console.error('🔍 REST API: Authentication error', error);
      throw error;
    }
  },

  /**
   * Call an RPC function
   * POST /v2/rpc/{function_name}
   */
  callRpc: async (token: string, functionName: string, payload?: any) => {
    const url = `${getNakamaBaseUrl()}/v2/rpc/${functionName}`;
    
    const body = payload ? JSON.stringify(payload) : '{}';

    console.log('🔍 REST API: Calling RPC', {
      url,
      functionName,
      hasPayload: !!payload
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getBearerHeader(token),
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 REST API: RPC error', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse payload if it's a JSON string
      try {
        return JSON.parse(data.payload);
      } catch {
        return data.payload;
      }
    } catch (error) {
      console.error('🔍 REST API: RPC call error', error);
      throw error;
    }
  },

  /**
   * Refresh session token
   * POST /v2/session/refresh
   */
  refreshSession: async (refreshToken: string) => {
    const url = `${getNakamaBaseUrl()}/v2/session/refresh`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify({
          token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Session refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        token: data.token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('🔍 REST API: Session refresh error', error);
      throw error;
    }
  },
};

