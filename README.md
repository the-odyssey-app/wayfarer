# Wayfarer - Location-Based Mobile Game

A real-time, location-based mobile game where players discover and complete quests in the real world.

## 🎯 Project Overview

Wayfarer combines real-world exploration with gamified quest completion, featuring:
- Location-based quest discovery
- Real-time multiplayer features
- AI-generated quest content
- Social collaboration and competition

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Expo React Native (iOS/Android)
- **Backend**: Nakama + CockroachDB (Real-time game server with database)
- **Maps**: Mapbox (Navigation & Location Services)
- **Places**: Google Places API (POI Discovery)
- **AI**: Anthropic API (Quest Generation)

### Project Structure
```
wayfarer/
├── apps/
│   └── mobile/          # Expo React Native app
├── wayfarer-nakama/     # Nakama server + CockroachDB
└── .github/            # CI/CD workflows
```

## ✅ Current Status (Day 1 - Afternoon Complete)

### Completed
- ✅ **Monorepo structure** established with proper workspace configuration
- ✅ **Nakama server** running with CockroachDB database on VPS
- ✅ **Authentication system** implemented with email, Facebook, and Google support
- ✅ **Runtime module** created with test RPC function
- ✅ **Mobile app** basic structure with login/register screens
- ✅ **End-to-end authentication flow** tested and working

### Technical Achievements
- **Docker Compose** configuration using official Nakama examples
- **JavaScript Runtime Module** with test RPC function
- **VPS deployment** with proper network configuration
- **Mobile app** successfully connecting to remote Nakama server
- **User registration and login** working through mobile app
- **Built-in Nakama user system** utilized (no custom tables needed)

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (on remote server)
- Expo CLI
- Git
- SSH access to remote server: `ssh root@5.181.218.160`

### Quick Start

#### Local Development
1. **Start Nakama Server**:
   ```bash
   cd wayfarer-nakama
   docker compose up -d
   ```

2. **Start Mobile App**:
   ```bash
   cd apps/mobile
   npm install
   npm start
   ```

3. **Access Services**:
   - Nakama API: `http://localhost:7350`
   - Nakama Console: `http://localhost:7351` (admin/password)
   - CockroachDB: `http://localhost:8080`

#### VPS Development (Current Setup)
1. **Connect to VPS**:
   ```bash
   ssh root@5.181.218.160
   cd ~/wayfarer/wayfarer-nakama
   docker compose up -d
   ```

2. **Check Container Status**:
   ```bash
   docker compose ps
   docker compose logs nakama
   docker compose logs cockroachdb
   ```

3. **Initialize Database** (if first time):
   ```bash
   # Connect to CockroachDB
   docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
   
   # Run the quest tables schema
   # Copy and paste contents of create_quest_tables.sql
   ```

4. **Access Services**:
   - Nakama API: `http://5.181.218.160:7350`
   - Nakama Console: `http://5.181.218.160:7351` (admin/password)
   - CockroachDB: `http://5.181.218.160:8080`

### Development Build (Mapbox Support)
For full Mapbox functionality, use development builds instead of Expo Go:

1. **Set up GitHub Actions** (see `BUILD_SETUP.md`)
2. **Configure secrets** in GitHub repository
3. **Build automatically** on push/PR or manually trigger
4. **Download APK** from GitHub Actions artifacts

**Note**: Expo Go doesn't support Mapbox native modules. Development builds are required.

## 🔧 Current Development Status

### Day 1 - Morning ✅ COMPLETE
- [x] Project setup and monorepo structure
- [x] Nakama server with CockroachDB
- [x] Authentication system (email, Facebook, Google)
- [x] Runtime module with user registration hook
- [x] Mobile app basic structure

### Day 1 - Afternoon ✅ COMPLETE
- [x] **Test authentication flow** end-to-end
- [x] **Verify database records** are created correctly
- [x] **Test mobile app registration** with Nakama built-in system
- [x] **Complete Day 1 deliverables**

### Next Steps (Day 2)
1. **Create quest tables** in CockroachDB
2. **Implement location services** and Mapbox integration
3. **Add quest discovery** functionality
4. **Begin Day 2 deliverables**

## 🛠️ Technical Details

### Nakama Runtime Module
- **Location**: `wayfarer-nakama/nakama-data/modules/index.js`
- **Function**: `test_function` RPC for testing runtime functionality
- **Purpose**: Foundation for future game-specific RPC functions
- **Logging**: Comprehensive error handling and debug information

### Database Schema
```sql
-- Using Nakama's built-in users table (no custom table needed)
-- Nakama automatically manages: id, username, email, create_time, metadata, etc.

-- Quest tables (to be created in Day 2)
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_quests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, completed, failed
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Authentication Flow
1. User registers/logs in via mobile app
2. Nakama handles authentication using built-in user system
3. User data stored in Nakama's default users table
4. Game-specific data stored in `metadata` JSON field
5. User proceeds to main app

## 🧪 Testing & Verification

### Testing Authentication Flow
1. **Start Services** (on VPS):
   ```bash
   ssh root@5.181.218.160
   cd ~/wayfarer/wayfarer-nakama
   docker compose up -d
   
   # Check logs
   docker compose logs nakama
   ```

2. **Test Mobile App** (locally):
   ```bash
   cd apps/mobile
   npm install
   npm start
   ```
   - Open Expo Go app
   - Scan QR code from `npm start`
   - Try registering a new user
   - Try logging in with existing user

3. **Verify in Database** (on VPS):
   ```bash
   # Connect to CockroachDB
   docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
   
   # Check users table
   USE nakama;
   SELECT id, username, email, create_time FROM users;
   ```

4. **Test Runtime Module** (on VPS):
   ```bash
   # Check Nakama logs for runtime module
   docker compose logs nakama | grep -i "runtime module"
   ```

### Expected Results
- ✅ User registration creates record in Nakama's users table
- ✅ Mobile app successfully authenticates
- ✅ Runtime module loads without errors
- ✅ No custom user table needed (using built-in system)

## 📊 Alpha Roadmap

### Week 1: Foundation & Authentication ✅
- [x] Project setup and environment configuration
- [x] User authentication system
- [ ] Basic map integration
- [ ] Core quest discovery loop

### Week 2-4: Feature Development
- Enhanced quest system
- Social features
- Real-time multiplayer
- AI integration

## 🔧 Development Guidelines

- Follow the established code evaluation criteria
- Maintain 80%+ test coverage
- Use architecture-first design principles
- Implement comprehensive error handling
- Document all architectural decisions

## 📝 License

[License information to be added]