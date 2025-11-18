#!/usr/bin/env node

/**
 * Test Helper Functions
 * Common utilities for integration tests
 */

const { Client } = require('@heroiclabs/nakama-js');

// Configuration
const NAKAMA_HOST = process.env.NAKAMA_HOST || 'localhost';
const NAKAMA_PORT = parseInt(process.env.NAKAMA_PORT || '7350', 10);
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

// Create Nakama client
const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, false);

/**
 * RPC Helper Functions
 */
class RpcHelper {
    /**
     * Call an RPC function with error handling and timeout
     * @param {Session} session - Nakama session
     * @param {string} functionName - RPC function name
     * @param {object} payload - Payload object
     * @param {boolean} expectedSuccess - Whether success is expected (default: true)
     * @param {number} timeoutMs - Timeout in milliseconds (default: 60000)
     * @returns {Promise<object>} Parsed response
     */
    static async call(session, functionName, payload = {}, expectedSuccess = true, timeoutMs = 60000) {
        try {
            const payloadString = JSON.stringify(payload);
            
            // Wrap RPC call with timeout
            const rpcPromise = client.rpc(session, functionName, payloadString);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)), timeoutMs);
            });
            
            const result = await Promise.race([rpcPromise, timeoutPromise]);
            
            let response;
            if (typeof result.payload === 'string') {
                try {
                    response = JSON.parse(result.payload);
                } catch {
                    response = { raw: result.payload };
                }
            } else if (typeof result.payload === 'object') {
                response = result.payload;
            } else {
                response = { raw: result.payload };
            }
            
            if (expectedSuccess && response.success === false) {
                throw new Error(response.error || 'RPC returned success: false');
            }
            
            return response;
        } catch (error) {
            if (expectedSuccess) {
                throw error;
            }
            return null;
        }
    }

    /**
     * Call RPC and expect success
     */
    static async callSuccess(session, functionName, payload = {}) {
        return this.call(session, functionName, payload, true);
    }

    /**
     * Call RPC and expect failure
     */
    static async callFailure(session, functionName, payload = {}) {
        return this.call(session, functionName, payload, false);
    }
}

/**
 * Assertion Helpers
 */
class Assert {
    static assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    static equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    static notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected not ${expected}, got ${actual}`);
        }
    }

    static notNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value is null or undefined');
        }
    }

    static isNull(value, message) {
        if (value !== null && value !== undefined) {
            throw new Error(message || `Expected null/undefined, got ${value}`);
        }
    }

    static isArray(value, message) {
        if (!Array.isArray(value)) {
            throw new Error(message || `Expected array, got ${typeof value}`);
        }
    }

    static arrayLength(array, expectedLength, message) {
        this.isArray(array, message);
        if (array.length !== expectedLength) {
            throw new Error(message || `Expected array length ${expectedLength}, got ${array.length}`);
        }
    }

    static arrayContains(array, item, message) {
        this.isArray(array, message);
        if (!array.includes(item) && !array.find(a => JSON.stringify(a) === JSON.stringify(item))) {
            throw new Error(message || `Array does not contain ${item}`);
        }
    }

    static isObject(value, message) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(message || `Expected object, got ${typeof value}`);
        }
    }

    static hasProperty(obj, property, message) {
        this.isObject(obj, message);
        if (!(property in obj)) {
            throw new Error(message || `Object does not have property ${property}`);
        }
    }

    static greaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} > ${expected}`);
        }
    }

    static greaterThanOrEqual(actual, expected, message) {
        if (actual < expected) {
            throw new Error(message || `Expected ${actual} >= ${expected}`);
        }
    }

    static lessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new Error(message || `Expected ${actual} < ${expected}`);
        }
    }

    static lessThanOrEqual(actual, expected, message) {
        if (actual > expected) {
            throw new Error(message || `Expected ${actual} <= ${expected}`);
        }
    }

    static success(response, message) {
        this.hasProperty(response, 'success', message);
        this.equal(response.success, true, message || 'Expected success: true');
    }

    static failure(response, message) {
        this.hasProperty(response, 'success', message);
        this.equal(response.success, false, message || 'Expected success: false');
    }
}

/**
 * Error Message Extraction
 */
class ErrorHelper {
    static extract(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (error && typeof error.text === 'function') {
            return `HTTP Error: ${error.status || 'Unknown'} ${error.statusText || ''}`;
        }
        if (error && (error.status || error.statusText)) {
            return `HTTP Error: ${error.status || 'Unknown'} ${error.statusText || ''}`;
        }
        if (error && error.message) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }
}

/**
 * Wait/Delay Helper
 */
class WaitHelper {
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await this.delay(interval);
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }
}

/**
 * Location Helper
 */
class LocationHelper {
    static generateLocation(index, baseLat = 33.1262316, baseLon = -117.310507, spacing = 0.01) {
        const offset = index * spacing; // ~1km spacing per 0.01 degrees
        return {
            latitude: baseLat + offset,
            longitude: baseLon + offset
        };
    }

    static generateRandomLocation(baseLat = 33.1262316, baseLon = -117.310507, radiusKm = 1) {
        // Generate random location within radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusKm;
        const latOffset = (distance / 111) * Math.cos(angle); // ~111km per degree latitude
        const lonOffset = (distance / (111 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(angle);
        return {
            latitude: baseLat + latOffset,
            longitude: baseLon + lonOffset
        };
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }
}

module.exports = {
    RpcHelper,
    Assert,
    ErrorHelper,
    WaitHelper,
    LocationHelper,
    client
};

