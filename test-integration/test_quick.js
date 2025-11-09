const { Client } = require("@heroiclabs/nakama-js");

// Load configuration from environment or use defaults
const NAKAMA_HOST = process.env.NAKAMA_HOST || process.env.DEPLOYMENT_SERVER_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

async function testMatchmaking() {
  const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT);
  client.ssl = false;

  try {
    // Authenticate
    const session = await client.authenticateDevice("test-match-001", true);
    console.log("✅ Authenticated");

    // Try find_matches
    const result = await client.rpc(session, "find_matches", JSON.stringify({
      latitude: 40.7128,
      longitude: -74.0060,
      maxResults: 5
    }));
    
    const data = JSON.parse(result.payload);
    if (data.success) {
      console.log(`✅ find_matches worked! Found ${data.matches?.length || 0} matches`);
    } else {
      console.log(`❌ find_matches error: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testMatchmaking();
