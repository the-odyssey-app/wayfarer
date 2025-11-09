# Wayfarer Monorepo Structure

> ⚠️ **OUTDATED**: This document describes the old Convex-based architecture.  
> See [MONOREPO_EVALUATION_AND_PLAN.md](../MONOREPO_EVALUATION_AND_PLAN.md) for current structure and evaluation.

## **Overview**

This monorepo contains all Wayfarer-related code in a single repository, following modern best practices for React Native and Convex development.

## **Structure**

```
wayfarer/
├── apps/
│   └── mobile/              # Expo React Native app
├── packages/
│   └── convex/              # Shared Convex backend
├── wayfarer-nakama/         # Nakama server configuration
├── package.json             # Root package.json with workspaces
└── MONOREPO.md             # This file
```

## **Benefits**

- ✅ **Automatic Sync**: Frontend and backend always use the same API types
- ✅ **Type Safety**: Shared TypeScript types across all packages
- ✅ **Single Source of Truth**: One Convex deployment serves all clients
- ✅ **Development Efficiency**: Changes to backend immediately available to frontend
- ✅ **Version Control**: All related code in one repository

## **Available Scripts**

### **Development**
```bash
# Start both Convex and Mobile app
npm run dev

# Start only Convex backend
npm run dev:convex

# Start only Mobile app
npm run dev:mobile
```

### **Building**
```bash
# Build all packages
npm run build

# Build specific package
npm run build:convex
npm run build:mobile
```

### **Testing**
```bash
# Test all packages
npm run test

# Test specific package
npm run test:convex
npm run test:mobile
```

### **Linting**
```bash
# Lint all packages
npm run lint

# Lint specific package
npm run lint:convex
npm run lint:mobile
```

## **Development Workflow**

### **1. Start Development Environment**
```bash
# Start Nakama server (in separate terminal)
cd wayfarer-nakama
docker compose up -d

# Start Convex and Mobile app
npm run dev
```

### **2. Make Backend Changes**
1. Edit files in `packages/convex/convex/`
2. Convex automatically regenerates API types
3. Mobile app automatically gets updated types
4. No manual copying required!

### **3. Make Frontend Changes**
1. Edit files in `apps/mobile/src/`
2. Hot reload automatically updates the app
3. TypeScript ensures type safety with backend

## **Package Dependencies**

### **Mobile App (`@wayfarer/mobile`)**
- Depends on `@wayfarer/convex` for API types
- Uses Convex React hooks for data fetching
- Integrates with Nakama for real-time features

### **Convex Backend (`@wayfarer/convex`)**
- Independent package with its own dependencies
- Generates API types automatically
- Can be used by multiple frontend applications

## **Import Paths**

### **In Mobile App**
```typescript
// Import Convex API types
import { api } from '@wayfarer/convex/convex/_generated/api';

// Import Convex React hooks
import { useQuery, useMutation } from 'convex/react';
```

### **In Convex Functions**
```typescript
// Standard Convex imports
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
```

## **Environment Configuration**

### **Convex**
- Environment variables in `packages/convex/.env.local`
- Deployment URL: `https://ardent-iguana-821.convex.cloud`

### **Mobile App**
- Environment variables in `apps/mobile/.env`
- Convex URL: `https://ardent-iguana-821.convex.cloud`
- Nakama URL: `localhost:7350` (development)

## **Deployment**

### **Convex Backend**
```bash
cd packages/convex
npx convex deploy
```

### **Mobile App**
```bash
cd apps/mobile
npm run build
# Deploy to app stores or web
```

## **Troubleshooting**

### **Import Errors**
If you see import errors for Convex API:
1. Ensure Convex dev server is running: `npm run dev:convex`
2. Check that `packages/convex/convex/_generated/api.d.ts` exists
3. Restart the mobile app: `npm run dev:mobile`

### **Type Errors**
If TypeScript shows type errors:
1. Ensure both packages are built: `npm run build`
2. Check that Convex functions are properly exported
3. Restart TypeScript server in your IDE

### **Dependency Issues**
If packages can't find each other:
1. Reinstall all dependencies: `npm run clean && npm run install:all`
2. Check workspace configuration in root `package.json`
3. Ensure package names match in `package.json` files

## **Adding New Packages**

To add a new package (e.g., web app):

1. Create directory: `apps/web/` or `packages/shared/`
2. Add to workspaces in root `package.json`
3. Create `package.json` with scoped name: `@wayfarer/web`
4. Install dependencies: `npm install`

## **Best Practices**

1. **Keep packages focused**: Each package should have a single responsibility
2. **Use scoped names**: All packages should use `@wayfarer/` prefix
3. **Shared dependencies**: Common dependencies should be in root `package.json`
4. **Type safety**: Always use TypeScript and generated types
5. **Testing**: Each package should have its own test suite
