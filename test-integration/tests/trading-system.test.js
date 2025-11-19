#!/usr/bin/env node

/**
 * Trading System Tests
 * Tests for item trading between users
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, TradeFactory } = require('../test-factories');

/**
 * Test: Create Item Trade
 */
async function testCreateItemTrade() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    
    try {
        // First, users need items to trade
        // Get user inventories to see if they have items
        const inventoryA = await RpcHelper.callSuccess(userA.session, 'get_user_inventory', {});
        const inventoryB = await RpcHelper.callSuccess(userB.session, 'get_user_inventory', {});
        
        // If no items, we might need to discover some first
        // For now, test the trade creation structure
        const offeredItems = [];
        const requestedItems = [];
        
        // If user A has items, offer one
        if (inventoryA.inventory && inventoryA.inventory.length > 0) {
            offeredItems.push({
                itemId: inventoryA.inventory[0].item_id,
                quantity: 1
            });
        }
        
        // If user B has items, request one
        if (inventoryB.inventory && inventoryB.inventory.length > 0) {
            requestedItems.push({
                itemId: inventoryB.inventory[0].item_id,
                quantity: 1
            });
        }
        
        // If no items available, skip test
        if (offeredItems.length === 0 && requestedItems.length === 0) {
            return { name: 'Create Item Trade', passed: false, skipped: true, reason: 'No items available for trading' };
        }
        
        const trade = await TradeFactory.create(userA, userB.id, offeredItems, requestedItems);
        Assert.notNull(trade, 'Trade should be created');
        Assert.notNull(trade.id, 'Trade should have ID');
        
        return { name: 'Create Item Trade', passed: true };
    } catch (error) {
        return { name: 'Create Item Trade', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Respond to Trade
 */
async function testRespondToTrade() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    
    try {
        // Get inventories
        const inventoryA = await RpcHelper.callSuccess(userA.session, 'get_user_inventory', {});
        const inventoryB = await RpcHelper.callSuccess(userB.session, 'get_user_inventory', {});
        
        const offeredItems = [];
        const requestedItems = [];
        
        if (inventoryA.inventory && inventoryA.inventory.length > 0) {
            offeredItems.push({
                itemId: inventoryA.inventory[0].item_id,
                quantity: 1
            });
        }
        
        if (inventoryB.inventory && inventoryB.inventory.length > 0) {
            requestedItems.push({
                itemId: inventoryB.inventory[0].item_id,
                quantity: 1
            });
        }
        
        if (offeredItems.length === 0 && requestedItems.length === 0) {
            return { name: 'Respond to Trade', passed: false, skipped: true, reason: 'No items available for trading' };
        }
        
        // Create trade
        const trade = await TradeFactory.create(userA, userB.id, offeredItems, requestedItems);
        
        // User B responds (accept or reject)
        const result = await TradeFactory.respond(userB, trade.id, 'accept');
        Assert.success(result, 'Respond to trade should succeed');
        
        return { name: 'Respond to Trade', passed: true };
    } catch (error) {
        return { name: 'Respond to Trade', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all trading system tests
 */
async function runTradingSystemTests() {
    const tests = [
        testCreateItemTrade,
        testRespondToTrade
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runTradingSystemTests,
    testCreateItemTrade,
    testRespondToTrade
};

