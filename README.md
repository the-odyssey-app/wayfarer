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
- **Backend**: Convex (Database & Serverless Functions)
- **Game Server**: Nakama (Real-time multiplayer)
- **Maps**: Mapbox (Navigation & Location Services)
- **Places**: Google Places API (POI Discovery)
- **AI**: Anthropic API (Quest Generation)

### Project Structure
```
wayfarer/
├── wayfarer-mobile/     # Expo React Native app
├── wayfarer-backend/    # Convex functions and schema
├── wayfarer-nakama/     # Nakama server configuration
└── .github/            # CI/CD workflows
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Convex CLI
- Git

### Quick Start
1. Clone the repository
2. Set up each sub-project following their individual READMEs
3. Configure environment variables
4. Run the development servers

## 📋 Development Process

This project follows a test-driven development approach with:
- Comprehensive error handling
- Continuous integration
- Code quality auditing
- Systematic feature addition

## 📊 Alpha Roadmap

### Week 1: Foundation & Authentication
- Project setup and environment configuration
- User authentication system
- Basic map integration
- Core quest discovery loop

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