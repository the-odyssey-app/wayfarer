#!/bin/bash

# Wayfarer Development Environment Setup Script
# This script sets up the development environment for all Wayfarer projects

set -e

echo "🚀 Setting up Wayfarer Development Environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) is installed"

# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed."
    exit 1
fi

echo "✅ Git $(git --version) is installed"

# Install global dependencies
echo "📦 Installing global dependencies..."

# Install Expo CLI
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g @expo/cli
else
    echo "✅ Expo CLI is already installed"
fi

# Install Convex CLI
if ! command -v convex &> /dev/null; then
    echo "Installing Convex CLI..."
    npm install -g convex
else
    echo "✅ Convex CLI is already installed"
fi

# Install TypeScript
if ! command -v tsc &> /dev/null; then
    echo "Installing TypeScript..."
    npm install -g typescript
else
    echo "✅ TypeScript is already installed"
fi

# Install ESLint
if ! command -v eslint &> /dev/null; then
    echo "Installing ESLint..."
    npm install -g eslint
else
    echo "✅ ESLint is already installed"
fi

echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables in each project"
echo "2. Run 'npm install' in each project directory"
echo "3. Follow the individual README files for project-specific setup"
echo ""
echo "Project directories:"
echo "- wayfarer-mobile/     (Expo React Native app)"
echo "- wayfarer-backend/    (Convex backend)"
echo "- wayfarer-nakama/     (Nakama configuration)"
