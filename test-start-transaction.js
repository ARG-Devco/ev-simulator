#!/usr/bin/env node

/**
 * Test script to send a DataTransfer command to trigger StartTransaction
 * 
 * Usage:
 *   node test-start-transaction.js <websocket-url> <connector-id> <id-tag>
 * 
 * Example:
 *   node test-start-transaction.js ws://localhost:8010/OCPP16/5c866e81a2d9593de43efdb4 1 ABC123456
 */

const WebSocket = require('ws');

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node test-start-transaction.js <websocket-url> <connector-id> <id-tag>');
  console.error('');
  console.error('Example:');
  console.error('  node test-start-transaction.js ws://localhost:8010/OCPP16/5c866e81a2d9593de43efdb4 1 ABC123456');
  process.exit(1);
}

const [wsUrl, connectorId, idTag] = args;

console.log(`Connecting to: ${wsUrl}`);
console.log(`Connector ID: ${connectorId}`);
console.log(`ID Tag: ${idTag}`);
console.log('');

const ws = new WebSocket(wsUrl, {
  protocols: ['ocpp1.6']
});

let messageIdCounter = 1;

ws.on('open', function open() {
  console.log('✓ Connected to WebSocket server');
  console.log('Waiting for BootNotification to complete...');
  console.log('');
  
  // Wait a bit for BootNotification to complete
  setTimeout(() => {
    const messageId = `test-${Date.now()}`;
    const message = [
      2,  // CALL message type
      messageId,
      "DataTransfer",
      {
        vendorId: "SIMULATOR",
        messageId: "StartTransaction",
        data: JSON.stringify({
          connectorId: parseInt(connectorId, 10),
          idTag: idTag
        })
      }
    ];
    
    console.log('Sending DataTransfer command:');
    console.log(JSON.stringify(message, null, 2));
    console.log('');
    
    ws.send(JSON.stringify(message));
  }, 3000);
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data.toString());
    const messageType = parsed[0];
    
    if (messageType === 2) {
      // CALL message (request from charging station)
      const [, messageId, action, payload] = parsed;
      console.log(`→ Received CALL from charging station:`);
      console.log(`  Action: ${action}`);
      console.log(`  Message ID: ${messageId}`);
      console.log(`  Payload:`, JSON.stringify(payload, null, 2));
      console.log('');
      
      // If it's a StartTransaction request, we should respond
      if (action === 'StartTransaction') {
        console.log('⚠️  Note: This is a StartTransaction request from the charging station.');
        console.log('   Your back office should respond to this request.');
        console.log('');
      }
    } else if (messageType === 3) {
      // CALLRESULT message (response)
      const [, messageId, payload] = parsed;
      console.log(`✓ Received CALLRESULT:`);
      console.log(`  Message ID: ${messageId}`);
      console.log(`  Payload:`, JSON.stringify(payload, null, 2));
      console.log('');
      
      if (payload.status === 'Accepted') {
        console.log('✅ DataTransfer command ACCEPTED - StartTransaction should be triggered!');
      } else if (payload.status === 'Rejected') {
        console.log('❌ DataTransfer command REJECTED');
      }
    } else if (messageType === 4) {
      // CALLERROR message
      const [, messageId, errorCode, errorDescription, errorDetails] = parsed;
      console.log(`✗ Received CALLERROR:`);
      console.log(`  Message ID: ${messageId}`);
      console.log(`  Error Code: ${errorCode}`);
      console.log(`  Error Description: ${errorDescription}`);
      if (errorDetails) {
        console.log(`  Error Details:`, JSON.stringify(errorDetails, null, 2));
      }
      console.log('');
    }
  } catch (error) {
    console.log('Received (raw):', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('✗ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`Connection closed (code: ${code}, reason: ${reason || 'none'})`);
  process.exit(0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', function() {
  console.log('\nClosing connection...');
  ws.close();
  setTimeout(() => process.exit(0), 1000);
});

