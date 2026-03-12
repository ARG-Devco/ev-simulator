# Quick Start: Trigger StartTransaction with idTag

## TL;DR

1. **Build and start the simulator:**
   ```bash
   npm install
   npm run build
   npm start
   ```

2. **Send DataTransfer command from your back office:**
   ```json
   [2, "msg-123", "DataTransfer", {
     "vendorId": "SIMULATOR",
     "messageId": "StartTransaction",
     "data": "{\"connectorId\": 1, \"idTag\": \"YOUR_ID_TAG\"}"
   }]
   ```

3. **The simulator will send a StartTransaction request to your back office with the specified idTag**

## Detailed Steps

### 1. Configure the Simulator

Edit `config.json` or `src/assets/config.json`:

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

### 2. Build and Run

```bash
npm install
npm run build
npm start
```

### 3. Test with the Provided Script

```bash
node test-start-transaction.js ws://your-backoffice-server:8010/OCPP16/your-charging-station-id 1 YOUR_ID_TAG
```

### 4. Or Send from Your Back Office

Send a DataTransfer command with:
- `vendorId`: `"SIMULATOR"`
- `messageId`: `"StartTransaction"`
- `data`: JSON string with `connectorId` and `idTag`

## What Happens

1. Your back office sends DataTransfer command → Simulator
2. Simulator validates and sends StatusNotification (PREPARING) → Back office
3. Simulator sends StartTransaction request with your idTag → Back office
4. Back office responds to StartTransaction → Simulator
5. If accepted, connector status becomes CHARGING

## See Also

- Full documentation: `START_TRANSACTION_USAGE.md`
- Test script: `test-start-transaction.js`

