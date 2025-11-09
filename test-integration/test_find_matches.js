const { Client } = require("@heroiclabs/nakama-js");

// Load configuration from environment or use defaults
const NAKAMA_HOST = process.env.NAKAMA_HOST || process.env.DEPLOYMENT_SERVER_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

async function testMatchmaking() {
  const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT);
  client.ssl = false;

  try {
    const session = await client.authenticateDevice("test-match-002", true);
    console.log("✅ Authenticated");

    // Test without questId
    const result1 = await client.rpc(session, "find_matches", JSON.stringify({
      latitude: 40.7128,
      longitude: -74.0060,
      maxResults: 5
    }));
    
    const data1 = typeof result1.payload === 'string' ? JSON.parse(result1.payload) : result1.payload;
    if (data1.success) {
      console.log(`✅ find_matches WITHOUT questId: SUCCESS! Found ${data1.matches?.length || 0} matches`);
    } else {
      console.log(`❌ find_matches WITHOUT questId: ${data1.error}`);
    }

    // Test with questId
    const result2 = await client.rpc(session, "find_matches", JSON.stringify({
      latitude: 40.7128,
      longitude: -74.0060,
      questId: "test-quest-id",
      maxResults: 5
    }));
    
    const data2 = typeof result2.payload === 'string' ? JSON.parse(result2.payload) : result2.payload;
    if (data2.success) {
      console.log(`✅ find_matches WITH questId: SUCCESS! Found ${data2.matches?.length || 0} matches`);
    } else {
      console.log(`❌ find_matches WITH questId: ${data2.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testMatchmaking();
