# How to Send StartTransaction with a Specific idTag

This guide explains how to run the EV Simulator and trigger a charging station to send a `StartTransaction` request to the back office with a specific `idTag`.

## Overview

The EV Simulator supports a custom DataTransfer command that allows you to trigger a `StartTransaction` request from the charging station to the back office. This is useful for testing and simulating charging sessions.

## Step 1: Build and Run the Simulator

### Prerequisites
- Node.js 16.x.x
- npm 8.x.x

### Build the Project

```bash
npm install
npm run build
```

### Configure the Simulator

1. Edit the configuration file: `src/assets/config.json` (or `config.json` in the root)

2. Set the `supervisionURLs` to point to your back office WebSocket server:
```json
{
  "supervisionURLs": [
    "ws://your-backoffice-server:8010/OCPP16/your-charging-station-id"
  ],
  "stationTemplateURLs": [
    {
      "file": "virtual-simple.station-template.json",
      "numberOfStations": 1
    }
  ]
}
```

3. Make sure at least one station template has `numberOfStations > 0`

### Start the Simulator

```bash
# Production mode
npm start

# Development mode (with auto-rebuild)
npm run start:dev
```

The simulator will:
- Connect to the WebSocket server specified in `supervisionURLs`
- Send a `BootNotification` request
- Wait for commands from the back office

## Step 2: Send DataTransfer Command to Trigger StartTransaction

Once the simulator is running and connected, send a DataTransfer request from your back office to the charging station:

### Request Format

```json
{
  "vendorId": "SIMULATOR",
  "messageId": "StartTransaction",
  "data": "{\"connectorId\": 1, \"idTag\": \"YOUR_ID_TAG_HERE\"}"
}
```

### Parameters

- **vendorId**: Must be `"SIMULATOR"` (case-sensitive)
- **messageId**: Must be `"StartTransaction"` (case-sensitive)
- **data**: JSON string containing:
  - **connectorId** (required): The connector ID where the transaction should start (must be > 0)
  - **idTag** (required): The RFID tag ID to use for the transaction

### Example OCPP DataTransfer Request

```json
[
  2,
  "unique-message-id",
  "DataTransfer",
  {
    "vendorId": "SIMULATOR",
    "messageId": "StartTransaction",
    "data": "{\"connectorId\": 1, \"idTag\": \"ABC123456\"}"
  }
]
```

### Response

The charging station will respond with:
- **ACCEPTED**: If the transaction was successfully started
- **REJECTED**: If there was an error (invalid connector, transaction already in progress, etc.)

### Behavior

When the DataTransfer command is received:
1. The charging station validates the connector ID and idTag
2. Checks if the connector is available and no transaction is in progress
3. Sets the connector status to `PREPARING`
4. Sends a `StatusNotification` to the back office
5. Sends a `StartTransaction` request to the back office with the specified `idTag`
6. If the back office accepts the transaction, the connector status changes to `CHARGING`
7. If rejected, the connector status returns to `AVAILABLE`

### Error Conditions

The command will be rejected if:
- `connectorId` is missing, invalid, or <= 0
- `idTag` is missing
- The connector doesn't exist
- A transaction is already in progress on that connector
- The connector is not available (not OPERATIVE)

## Step 3: Testing with a WebSocket Client

### Using wscat (Node.js WebSocket client)

1. Install wscat:
```bash
npm install -g wscat
```

2. Connect to your back office WebSocket server:
```bash
wscat -c ws://your-backoffice-server:8010/OCPP16/your-charging-station-id
```

3. Once connected, send the DataTransfer command:
```json
[2, "msg-123", "DataTransfer", {
  "vendorId": "SIMULATOR",
  "messageId": "StartTransaction",
  "data": "{\"connectorId\": 1, \"idTag\": \"TEST_TAG_001\"}"
}]
```

### Using Python WebSocket Client

Create a file `test_start_transaction.py`:

```python
import asyncio
import websockets
import json

async def test_start_transaction():
    uri = "ws://your-backoffice-server:8010/OCPP16/your-charging-station-id"
    
    async with websockets.connect(uri, subprotocols=["ocpp1.6"]) as websocket:
        # Wait for BootNotification response or other initial messages
        await asyncio.sleep(2)
        
        # Send DataTransfer command
        message = [
            2,  # CALL message type
            "unique-message-id-123",
            "DataTransfer",
            {
                "vendorId": "SIMULATOR",
                "messageId": "StartTransaction",
                "data": json.dumps({
                    "connectorId": 1,
                    "idTag": "TEST_TAG_001"
                })
            }
        ]
        
        await websocket.send(json.dumps(message))
        print(f"Sent: {json.dumps(message)}")
        
        # Wait for response
        response = await websocket.recv()
        print(f"Received: {response}")

asyncio.run(test_start_transaction())
```

Run it:
```bash
pip install websockets
python test_start_transaction.py
```

### Using Node.js WebSocket Client

Create a file `test_start_transaction.js`:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://your-backoffice-server:8010/OCPP16/your-charging-station-id', {
  protocols: ['ocpp1.6']
});

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
  
  // Wait a bit for BootNotification to complete
  setTimeout(() => {
    const message = [
      2,  // CALL message type
      "unique-message-id-123",
      "DataTransfer",
      {
        vendorId: "SIMULATOR",
        messageId: "StartTransaction",
        data: JSON.stringify({
          connectorId: 1,
          idTag: "TEST_TAG_001"
        })
      }
    ];
    
    ws.send(JSON.stringify(message));
    console.log('Sent DataTransfer command:', JSON.stringify(message, null, 2));
  }, 2000);
});

ws.on('message', function message(data) {
  console.log('Received:', data.toString());
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});
```

Run it:
```bash
npm install ws
node test_start_transaction.js
```

## Complete Example Flow

1. **Start the simulator:**
   ```bash
   npm run build
   npm start
   ```

2. **Check logs** - You should see:
   ```
   Open OCPP connection to URL ws://your-backoffice-server:8010/OCPP16/your-charging-station-id
   OCPP sending: [2,"...","BootNotification",{...}]
   ```

3. **From your back office**, send the DataTransfer command (as shown in Step 2)

4. **Observe the flow:**
   - The simulator receives the DataTransfer command
   - It sends a `StatusNotification` with status `PREPARING`
   - It sends a `StartTransaction` request with your specified `idTag`
   - Your back office should respond to the `StartTransaction` request
   - If accepted, the connector status changes to `CHARGING`

## Troubleshooting

### Simulator won't start
- Check that `numberOfStations > 0` in at least one station template
- Verify Node.js version: `node --version` (should be 16.x.x)
- Check for build errors: `npm run build`

### Connection issues
- Verify the WebSocket URL in `supervisionURLs` is correct
- Check that your back office server is running and accessible
- Check firewall/network settings

### DataTransfer command not working
- Verify `vendorId` is exactly `"SIMULATOR"` (case-sensitive)
- Verify `messageId` is exactly `"StartTransaction"` (case-sensitive)
- Check that the connector ID exists and is available
- Check simulator logs for error messages

### Transaction not starting
- Ensure the connector is in `AVAILABLE` status
- Check that no transaction is already running on that connector
- Verify the `idTag` is provided in the data payload
- Check that your back office accepts the `StartTransaction` request

## Notes

- The connector must be in `AVAILABLE` status before starting a transaction
- The connector must be `OPERATIVE` (available)
- If a transaction is already running on the connector, the command will be rejected
- The `idTag` will be sent in the `StartTransaction` request to the back office for authorization
- The simulator logs all OCPP messages - check the logs for debugging

