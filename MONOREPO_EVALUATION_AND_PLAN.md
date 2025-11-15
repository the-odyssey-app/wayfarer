# Monorepo Evaluation & Restructuring Plan

**Date**: Current  
**Status**: Evaluation Complete - Recommendation: Simplify to Multi-Repo or Flat Structure

---

## 📊 Current Architecture Analysis

### Deployment Status
| Component | Location | Technology | Deployment Method |
|-----------|----------|------------|-------------------|
| **Mobile App** | Local (needs hosting) | Expo/React Native | EAS Build → App Stores |
| **Nakama Server** | Hostinger (temporary) | Docker/Go | Docker Compose |
| **Proxy** | Vercel | Node.js Serverless | Vercel CLI |
| **Packages** | Empty | N/A | Not used |

### Current Repository Structure
```
wayfarer/
├── apps/mobile/          # Expo React Native app
├── wayfarer-nakama/      # Nakama server config & modules
├── wayfarer-proxy/       # Vercel serverless function
├── packages/             # EMPTY - Not used
├── test-integration/     # Integration tests
├── docs/                 # Documentation
└── old/                  # Legacy Convex code
```

---

## 🔍 Monorepo Evaluation

### ❌ **Arguments AGAINST Keeping Monorepo**

1. **No Shared Code**
   - Zero cross-references between components
   - No shared TypeScript types or interfaces
   - Each component is completely independent
   - No `packages/` usage (empty directory)

2. **Independent Deployments**
   - Mobile: EAS Build → App Stores (separate CI/CD)
   - Nakama: Docker on Hostinger (separate deployment)
   - Proxy: Vercel (separate deployment)
   - No coordinated releases needed

3. **Different Tech Stacks**
   - Mobile: Expo/React Native/TypeScript
   - Nakama: Docker/Go/JavaScript runtime modules
   - Proxy: Node.js serverless
   - No shared dependencies

4. **No Type Sharing**
   - Types defined locally in each component
   - No generated types from backend
   - No shared API contracts

5. **Workspace Configuration Unused**
   - Root `package.json` only has `apps/*` workspace
   - `packages/` not in workspaces
   - No shared dependencies managed at root

### ✅ **Arguments FOR Keeping Monorepo**

1. **Single Source of Truth**
   - All related code in one place
   - Easier to find related changes
   - Unified documentation

2. **Simplified Development**
   - One `git clone` to get everything
   - Shared scripts and tooling
   - Unified issue tracking

3. **Future Growth**
   - If you add shared types later
   - If you add a web app
   - If you add shared utilities

---

## 🎯 **Recommendation: Hybrid Approach**

### **Option A: Simplified Monorepo (RECOMMENDED)**
Keep monorepo but remove unused structure and simplify:

**Pros:**
- Keep single repo for convenience
- Remove empty `packages/` directory
- Simplify workspace config
- Easier to add shared code later if needed

**Cons:**
- Still have monorepo overhead (minimal)

**Structure:**
```
wayfarer/
├── mobile/              # Move apps/mobile here
├── nakama/              # Move wayfarer-nakama here
├── proxy/               # Move wayfarer-proxy here
├── tests/               # Move test-integration here
├── docs/                # Keep docs
└── package.json         # Simplified root config
```

### **Option B: Multi-Repo (If You Want Full Separation)**
Split into separate repos:

**Pros:**
- Complete independence
- Separate CI/CD per component
- Smaller repos
- Clear ownership

**Cons:**
- More repos to manage
- Harder to coordinate changes
- Need to duplicate shared configs

**Repos:**
- `wayfarer-mobile` (Expo app)
- `wayfarer-nakama` (Server config)
- `wayfarer-proxy` (Vercel function)

---

## 📋 **Implementation Plan: Option A (Simplified Monorepo)**

### Phase 1: Cleanup & Restructure (30 minutes)

1. **Remove Empty Packages Directory**
   ```bash
   rm -rf packages/
   ```

2. **Flatten Structure** (Optional - can keep current structure)
   - Keep `apps/mobile/` as is (Expo convention)
   - Keep `wayfarer-nakama/` as is
   - Keep `wayfarer-proxy/` as is

3. **Simplify Root package.json**
   - Remove unused workspace config
   - Keep only essential scripts
   - Remove references to non-existent packages

4. **Update Documentation**
   - Remove outdated monorepo docs
   - Update README with actual structure
   - Document deployment process per component

### Phase 2: Mobile App Hosting Setup (2-3 hours)

**Options for Mobile App Hosting:**

1. **EAS Build + App Stores** (Recommended for production)
   - Use Expo Application Services
   - Build APK/IPA for distribution
   - Submit to Google Play / App Store
   - **Cost**: Free tier available, paid for builds

2. **EAS Build + Internal Distribution**
   - Build APK/IPA
   - Distribute via TestFlight/Internal Testing
   - **Cost**: Free tier available

3. **Expo Go** (Development only)
   - Use Expo Go app for testing
   - Not suitable for production
   - **Cost**: Free

4. **Self-Hosted Web Build** (If you want web version)
   - Build web version with Expo
   - Host on Vercel/Netlify
   - **Cost**: Free tier available

**Recommended Setup:**
```bash
# In apps/mobile/
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android  # Submit to Play Store
eas submit --platform ios      # Submit to App Store
```

### Phase 3: Deployment Documentation (1 hour)

Create deployment guides for each component:

1. **Mobile App Deployment**
   - EAS Build setup
   - Environment variables
   - App store submission process

2. **Nakama Deployment**
   - Hostinger setup (current)
   - Docker deployment
   - Environment configuration
   - Migration to permanent hosting

3. **Proxy Deployment**
   - Vercel setup (already done)
   - Environment variables
   - API key management

---

## 🚀 **Immediate Action Items**

### Priority 1: Cleanup (Do Now)
- [ ] Remove empty `packages/` directory
- [ ] Simplify root `package.json`
- [ ] Update/remove outdated monorepo documentation

### Priority 2: Mobile App Hosting (This Week)
- [ ] Set up EAS account
- [ ] Configure EAS build profiles
- [ ] Set up environment variables
- [ ] Create first production build
- [ ] Plan app store submission

### Priority 3: Documentation (This Week)
- [ ] Create deployment guide for mobile app
- [ ] Document Nakama deployment process
- [ ] Update main README with current structure
- [ ] Create architecture diagram

### Priority 4: Future Considerations
- [ ] Evaluate permanent Nakama hosting (AWS/GCP/DigitalOcean)
- [ ] Consider shared types package if needed later
- [ ] Plan for web app if desired

---

## 📝 **Simplified Root package.json**

```json
{
  "name": "wayfarer",
  "version": "1.0.0",
  "description": "Wayfarer - Location-Based Mobile Game",
  "private": true,
  "scripts": {
    "dev:mobile": "cd apps/mobile && npm start",
    "build:mobile": "cd apps/mobile && eas build",
    "test": "cd test-integration && npm test"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/wayfarer.git"
  },
  "keywords": [
    "location-based-game",
    "mobile-app",
    "nakama",
    "expo"
  ],
  "author": "Wayfarer Team",
  "license": "MIT"
}
```

---

## 🎯 **Conclusion**

**Recommendation**: Keep simplified monorepo structure but remove unused `packages/` directory and simplify configuration. The monorepo provides organizational benefits without the complexity since there's no shared code.

**Key Changes:**
1. Remove empty `packages/` directory
2. Simplify root `package.json`
3. Focus on mobile app hosting setup (EAS)
4. Update documentation to reflect actual structure

**Future**: If you add shared types, utilities, or a web app later, you can easily add a `packages/` directory back and configure workspaces properly.






