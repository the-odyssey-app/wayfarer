const { Client } = require("@heroiclabs/nakama-js");

// Load configuration from environment or use defaults
const NAKAMA_HOST = process.env.NAKAMA_HOST || process.env.DEPLOYMENT_SERVER_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

async function testGoogleMaps() {
  const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT);
  client.ssl = false;

  try {
    const session = await client.authenticateDevice("test-gmaps-001", true);
    console.log("✅ Authenticated");
    console.log("📍 Testing get_places_nearby with coordinates: 40.7128, -74.0060 (NYC)");
    console.log("   This should trigger Google Maps API call if database has < 10 places...\n");

    const result = await client.rpc(session, "get_places_nearby", JSON.stringify({
      latitude: 40.7128,
      longitude: -74.0060,
      maxDistanceKm: 10,
      minResults: 10
    }));
    
    const data = typeof result.payload === 'string' ? JSON.parse(result.payload) : result.payload;
    
    if (data.success) {
      console.log(`✅ get_places_nearby: SUCCESS!`);
      console.log(`   Found ${data.places?.length || 0} places`);
      console.log(`   Total found: ${data.total_found || 0}`);
      console.log(`   Filtered visited: ${data.filtered_visited || 0}`);
      
      if (data.places && data.places.length > 0) {
        console.log(`\n   First place: ${data.places[0].name || 'Unknown'}`);
        console.log(`   Distance: ${data.places[0].distance_km?.toFixed(2) || 'N/A'} km`);
      }
    } else {
      console.log(`❌ get_places_nearby: ${data.error}`);
    }
    
    console.log("\n📋 Now check Nakama logs for Google Maps API details:");
    const serverUser = process.env.DEPLOYMENT_SERVER_USER || 'root';
    console.log(`   ssh ${serverUser}@${NAKAMA_HOST} 'docker logs wayfarer-nakama-nakama-1 --since=1m | grep -i \"google maps\"'`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testGoogleMaps();
