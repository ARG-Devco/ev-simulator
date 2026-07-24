# ev-simulator

Rove fork of [sap-labs-france/ev-simulator](https://github.com/sap-labs-france/ev-simulator).

## Summary

Simple [node.js](https://nodejs.org/) program to simulate a set of charging stations based on the OCPP-J 1.6 protocol.

This fork adds a `values.yaml` driven deployment flow and vendor-specific `DataTransfer` commands that let a back office drive a simulated station directly (plug in, start a session, unplug). See [Rove-specific usage](#rove-specific-usage).

## Prerequisites

Node.js **16.x.x** and npm **8.x.x** (see `engines` in [package.json](package.json)). The Docker images build on `node:16.3.0-alpine`.

### Windows

* [Chocolatey](https://chocolatey.org/):

```powershell
choco install -y nodejs-lts
```

### MacOSX

* [Homebrew](https://brew.sh/):

```shell
brew install node@16
```

### GNU/Linux: 

* [NodeSource](https://github.com/nodesource/distributions) Node.js Binary Distributions for version 16.X

## Configuration syntax

All configuration files are in the JSON standard format.  

The charging stations simulator's main configuration parameters must be within the `src/assets/config.json` file. A configuration template file is available at [src/assets/config-template.json](src/assets/config-template.json).

All charging station templates are in the directory [src/assets/station-templates](src/assets/station-templates).

A list of RFID tags must be defined for the automatic transaction generator with the default location and name `src/assets/authorization-tags.json`. A template file is available at [src/assets/authorization-tags-template.json](src/assets/authorization-tags-template.json).

The charging stations simulator have an automatic configuration files reload feature at change for: 
* main configuration;
* charging station templates; 
* authorization RFID tags.

But the modifications to test have to be done to the files in the build result directory [dist/assets](dist/assets). Once the modifications are finished, they have to be reported or copied to the matching files in the build source directory [src/assets](src/assets) to ensure they will be taken into account at next build. 

### Main configuration 

**src/assets/config.json**:

Key | Value(s) | Default Value | Value type | Description 
--- | -------| --------------| ---------- | ------------
supervisionURLs | | [] | string[] |  array of connection URIs to OCPP-J servers
distributeStationsToTenantsEqually | true/false | true | boolean | distribute charging stations uniformly to the OCPP-J servers
workerProcess | workerSet/staticPool/dynamicPool | workerSet | string | worker threads process type
workerStartDelay | | 500 | integer | milliseconds to wait at charging station worker threads startup
workerPoolMinSize | | 4 | integer | worker threads pool minimum number of threads
workerPoolMaxSize | | 16 | integer | worker threads pool maximum number of threads
workerPoolStrategy | ROUND_ROBIN/LESS_RECENTLY_USED/... | [poolifier](https://github.com/poolifier/poolifier) default: ROUND_ROBBIN | string | worker threads pool [poolifier](https://github.com/poolifier/poolifier) worker choice strategy
chargingStationsPerWorker | | 1 | integer | number of charging stations per worker threads for the `workerSet` process type
logStatisticsInterval | | 60 | integer | seconds between charging stations statistics output in the logs 
logConsole | true/false | false | boolean | output logs on the console 
logFormat | | simple | string | winston log format
logRotate | true/false | true | boolean | enable daily log files rotation
logMaxFiles | | 7 | integer | maximum number of log files to keep
logLevel | emerg/alert/crit/error/warning/notice/info/debug | info | string | winston logging level
logFile | | combined.log | string | log file relative path
logErrorFile | | error.log | string | error log file relative path 
performanceStorage | | { "enabled": false, "type": "jsonfile", "file:///performanceRecords.json" } | { enabled: string; type: string; URI: string; } where type can be 'jsonfile' or 'mongodb' | performance storage configuration section
stationTemplateURLs | | {}[] | { file: string; numberOfStations: number; }[] | array of charging station templates URIs configuration section (template file name and number of stations)

#### Worker process model: 

- **workerSet**:
  Worker set executing each a static number (chargingStationsPerWorker) of simulated charging stations from the total

- **staticPool**:
  Statically sized worker pool executing a static total number of simulated charging stations    

- **dynamicPool**:
  Dynamically sized worker pool executing a static total number of simulated charging stations 

### Charging station template

Key | Value(s) | Default Value | Value type | Description 
--- | -------| --------------| ---------- | ------------
supervisionURL | | '' | string | connection URI to OCPP-J server
supervisionUser | | '' | string | basic HTTP authentication user to OCPP-J server
supervisionPassword | | '' | string | basic HTTP authentication password to OCPP-J server
ocppVersion | 1.6 | 1.6 | string | OCPP version 
ocppProtocol | json | json | string | OCPP protocol
authorizationFile | | '' | string | RFID tags list file relative to src/assets path
baseName | | '' | string | base name to build charging stations name
nameSuffix | | '' | string | name suffix to build charging stations name
fixedName | true/false | false | boolean | use the baseName as the charging stations unique name
chargePointModel | | '' | string | charging stations model
chargePointVendor | | '' | string | charging stations vendor
chargeBoxSerialNumberPrefix | | '' | string | charging stations serial number prefix
firmwareVersion | | '' | string | charging stations firmware version
power | | | float\|float[] | charging stations maximum power value(s)
powerSharedByConnectors | true/false | false | boolean | charging stations power shared by its connectors
powerUnit | W/kW | W | string | charging stations power unit
currentOutType | AC/DC | AC | string | charging stations current out type
voltageOut | | AC:230/DC:400 | integer | charging stations voltage out
numberOfPhases | 0/1/3 | AC:3/DC:0 | integer | charging stations number of phase(s) 
numberOfConnectors | | | integer\|integer[] | charging stations number of connector(s)
useConnectorId0 | true/false | true | boolean | use connector id 0 definition from the template
randomConnectors | true/false | false | boolean | randomize runtime connector id affectation from the connector id definition in template
resetTime | | 60 | integer | seconds to wait before the charging stations come back at reset
autoRegister | true/false | false | boolean | set the charging station as registered at boot notification for testing purpose
autoReconnectMaxRetries | | -1 (unlimited) | integer | connection retries to the OCPP-J server
reconnectExponentialDelay | true/false | false | boolean | connection delay retry to the OCPP-J server
registrationMaxRetries | | -1 (unlimited) | integer | charging stations boot notification retries
enableStatistics | true/false | true | boolean | enable charging stations statistics
mayAuthorizeAtRemoteStart | true/false | true | boolean | always send authorize at remote start transaction when AuthorizeRemoteTxRequests is enabled
beginEndMeterValues | true/false | false | boolean | enable Transaction.{Begin,End} MeterValues
outOfOrderEndMeterValues | true/false | false | boolean | send Transaction.End MeterValues out of order
meteringPerTransaction | true/false | true | boolean | enable metering history on a per transaction basis
transactionDataMeterValues | true/false | false | boolean | enable transaction data MeterValues at stop transaction
mainVoltageMeterValues | true/false | true | boolean | include charging station main voltage MeterValues on three phased charging stations
phaseLineToLineVoltageMeterValues | true/false | true | boolean | include charging station line to line voltage MeterValues on three phased charging stations
Configuration | | | ChargingStationConfiguration | charging stations OCPP parameters configuration section
AutomaticTransactionGenerator | | | AutomaticTransactionGenerator | charging stations ATG configuration section
Connectors | | | Connectors | charging stations connectors configuration section

#### Configuration section

```json
  "Configuration": {
    "configurationKey": [
       ...
       {
        "key": "StandardKey",
        "readonly": false,
        "value": "StandardValue",
        "visible": true,
        "reboot": false
      },
      ...
      {
        "key": "VendorKey",
        "readonly": false,
        "value": "VendorValue",
        "visible": false,
        "reboot": true
      },
      ...
    ]
  }
```

#### AutomaticTransactionGenerator section

The Automatic Transaction Generator (ATG) is a built-in robot driver: when `enable` is `true` the station starts and stops charging sessions on its own, with no command from the back office. When `enable` is `false` the station boots, sends `StatusNotification` with status `Available`, and then stays idle until the back office drives it.

```json
  "AutomaticTransactionGenerator": {
    "enable": false,
    "minDuration": 60,
    "maxDuration": 80,
    "minDelayBetweenTwoTransactions": 15,
    "maxDelayBetweenTwoTransactions": 30,
    "probabilityOfStart": 1,
    "stopAfterHours": 0.3,
    "stopAfterNumberOfTransaction": 1,
    "stopOnConnectionFailure": true,
    "requireAuthorize": true,
    "minBatterySize": 100000,
    "maxBatterySize": 100000,
    "minStartEnergy": 50000,
    "maxStartEnergy": 50000,
    "minDesiredEnergy": 80000,
    "maxDesiredEnergy": 80000,
    "VIN": "ABC"
  }
```

The battery/energy keys are used to compute the `SoC` sampled value in MeterValues: `SoC = currentEnergy / batterySize * 100`, where `currentEnergy` starts at `startEnergy` and grows with each MeterValues sample. Sizes are in Wh.
#### Connectors section

```json
  "Connectors": {
    "0": {},
    "1": {
      "bootStatus": "Available",
      "MeterValues": [
        ...
        {
          "unit": "W",
          "measurand": "Power.Active.Import",
          "phase": "L1-N",
          "value": "5000",
          "fluctuationPercent": "10"
        },
        ...
        {
          "unit": "A",
          "measurand": "Current.Import"
        },
        ...
        {
          "unit": "Wh"
        },
        ...
      ]
    }
  },
```

## Start

To start the program, run: `npm start`.

## Docker

The image built and deployed for Rove uses the **root [Dockerfile](Dockerfile)**. It runs [run.sh](run.sh), which renders `values.yaml` into the simulator's config via [render.py](render.py) before starting node — see [Rove-specific usage](#rove-specific-usage).

Build (the target platform must match the cluster; `linux/amd64`):

```bash
./docker-build.sh <tag>          # docker buildx build --platform=linux/amd64 -t ev-simulator:<tag> .
```

Run locally, mounting a values file:

```bash
docker run --rm -p 8090:8090 -v "$(pwd)/sample.yaml:/usr/app/values.yaml" ev-simulator:<tag>
```

> The [docker](./docker) folder holds an older, separate build (`make`, `docker/Dockerfile`, `docker/config.json`) that does **not** support the `values.yaml` flow. It is not the image deployed for Rove.

## Rove-specific usage

### values.yaml

Rather than editing `config.json` and station templates by hand, this fork renders them from a single `values.yaml` at container start. [render.py](render.py) reads it and generates, per station, a station template and an authorization tags file from the Jinja templates in [src/assets](src/assets). A working example is [sample.yaml](sample.yaml):

```yaml
ocpp_path: wss://ocpp.server.com/ocpp
logname: one
stations:
  - serial: SERIALNUMBER
    power: 180000
    currentType: DC
    requireAuthorize: "false"
    automatictransaction: "false"
    minDuration: 600
    maxDuration: 600
    minDelayBetweenTwoTransactions: 305
    maxDelayBetweenTwoTransactions: 305
    connectors: [1, 2]
    rfid:
      id:
        - ""
```

Key | Description
--- | -----------
ocpp_path | OCPP-J server URL the stations connect to
logname | log file name suffix
serial | station serial number; also the generated template file name
power | station maximum power in W
currentType | `AC` or `DC`
connectors | list of connector ids
requireAuthorize | ATG sends `Authorize` before `StartTransaction`
automatictransaction | enable the ATG (`"true"`/`"false"`, as strings)
minDuration / maxDuration | ATG session duration bounds in seconds
minDelayBetweenTwoTransactions / maxDelayBetweenTwoTransactions | ATG delay bounds in seconds
rfid.id | list of RFID tags for the generated authorization tags file

Values not listed here fall back to the defaults in [src/assets/station-templates/station.j2](src/assets/station-templates/station.j2).

### Vendor DataTransfer commands

The back office can drive a simulated station by sending `DataTransfer` with `vendorId: "SIMULATOR"`. In every case `data` is a **JSON-encoded string**, not a nested object.

#### PluggedIn

Simulates plugging a cable in. Moves the connector to `Preparing` and sends the matching `StatusNotification`.

If the optional `idTagToAuthorize` is present, the station additionally sends `Authorize` with that tag and — when authorization is accepted — starts a transaction with the same tag. This lets a single message drive a complete session without a separate `RemoteStartTransaction`. Omit the field for the plug-in-only behaviour.

```json
{
  "vendorId": "SIMULATOR",
  "messageId": "PluggedIn",
  "data": "{\"connectorId\":1,\"idTagToAuthorize\":\"401580F7\"}"
}
```

Resulting message sequence when `idTagToAuthorize` is accepted:

```
StatusNotification(Preparing) -> Authorize -> StartTransaction -> StatusNotification(Charging) -> MeterValues...
```

The connector must be `OPERATIVE` and `Available`, otherwise the command is rejected. If the `Authorize` or the `StartTransaction` is rejected, the reason is logged and no transaction starts; the `DataTransfer` itself is still accepted.

When the ATG is disabled, battery size and start energy are seeded from the `AutomaticTransactionGenerator` section of the station template so that the `SoC` sampled value in MeterValues is a real number.

#### Unplugged

Simulates unplugging the cable. From `Preparing` it returns the connector to `Available`; from `Charging` it sends `StatusNotification(Finishing)` and stops the running transaction.

```json
{
  "vendorId": "SIMULATOR",
  "messageId": "Unplugged",
  "data": "{\"connectorId\":1}"
}
```

## OCPP-J commands supported

### Version 1.6

#### Core Profile

- :white_check_mark: Authorize
- :white_check_mark: BootNotification
- :white_check_mark: ChangeAvailability
- :white_check_mark: ChangeConfiguration
- :white_check_mark: ClearCache
- :white_check_mark: DataTransfer (vendor `SIMULATOR` messages only, see [Vendor DataTransfer commands](#vendor-datatransfer-commands))
- :white_check_mark: GetConfiguration
- :white_check_mark: Heartbeat
- :white_check_mark: MeterValues
- :white_check_mark: RemoteStartTransaction
- :white_check_mark: RemoteStopTransaction
- :white_check_mark: Reset
- :white_check_mark: StartTransaction
- :white_check_mark: StatusNotification
- :white_check_mark: StopTransaction
- :white_check_mark: UnlockConnector

#### Firmware Management Profile

- :white_check_mark: GetDiagnostics
- :white_check_mark: DiagnosticsStatusNotification
- :x: FirmwareStatusNotification
- :x: UpdateFirmware

#### Local Auth List Management Profile

- :x: GetLocalListVersion
- :x: SendLocalList

#### Reservation Profile

- :x: CancelReservation
- :x: ReserveNow

#### Smart Charging Profile

- :white_check_mark: ClearChargingProfile
- :white_check_mark: GetCompositeSchedule
- :white_check_mark: SetChargingProfile

#### Remote Trigger Profile

- :white_check_mark: TriggerMessage

## OCPP-J standard parameters supported

All kind of OCPP parameters are supported in a charging station template. The list here mention the standard ones also handled automatically in the simulator. 

### Version 1.6

#### Core Profile

- :white_check_mark: AuthorizeRemoteTxRequests (type: boolean) (units: -)
- :x: ClockAlignedDataInterval (type: integer) (units: seconds)
- :white_check_mark: ConnectionTimeOut (type: integer) (units: seconds)
- :x: GetConfigurationMaxKeys (type: integer) (units: -)
- :white_check_mark: HeartbeatInterval (type: integer) (units: seconds)
- :x: LocalAuthorizeOffline (type: boolean) (units: -)
- :x: LocalPreAuthorize (type: boolean) (units: -)
- :x: MeterValuesAlignedData (type: CSL) (units: -)
- :white_check_mark: MeterValuesSampledData (type: CSL) (units: -)
- :white_check_mark: MeterValueSampleInterval (type: integer) (units: seconds)
- :white_check_mark: NumberOfConnectors (type: integer) (units: -)
- :x: ResetRetries (type: integer) (units: times)
- :white_check_mark: ConnectorPhaseRotation (type: CSL) (units: -)
- :x: StopTransactionOnEVSideDisconnect (type: boolean) (units: -)
- :x: StopTransactionOnInvalidId (type: boolean) (units: -)
- :x: StopTxnAlignedData (type: CSL) (units: -)
- :x: StopTxnSampledData (type: CSL) (units: -)
- :white_check_mark: SupportedFeatureProfiles (type: CSL) (units: -)
- :x: TransactionMessageAttempts (type: integer) (units: times)
- :x: TransactionMessageRetryInterval (type: integer) (units: seconds)
- :x: UnlockConnectorOnEVSideDisconnect (type: boolean) (units: -)
- :white_check_mark: WebSocketPingInterval (type: integer) (units: seconds)

#### Firmware Management Profile

- *none*

#### Local Auth List Management Profile

- :white_check_mark: LocalAuthListEnabled (type: boolean) (units: -)
- :x: LocalAuthListMaxLength (type: integer) (units: -)
- :x: SendLocalListMaxLength (type: integer) (units: -)

#### Reservation Profile

- *none*

#### Smart Charging Profile

- :x: ChargeProfileMaxStackLevel (type: integer) (units: -)
- :x: ChargingScheduleAllowedChargingRateUnit (type: CSL) (units: -)
- :x: ChargingScheduleMaxPeriods (type: integer) (units: -)
- :x: MaxChargingProfilesInstalled (type: integer) (units: -)

#### Remote Trigger Profile

- *none*

## License

This file and all other files in this repository are licensed under the Apache Software License, v.2 and copyrighted under the copyright in [NOTICE](NOTICE) file, except as noted otherwise in the [LICENSE](LICENSE) file or the code source file header.

Please note that Docker images can contain other software which may be licensed under different licenses. This LICENSE and NOTICE files are also included in the Docker image. For any usage of built Docker images please make sure to check the licenses of the artifacts contained in the images.
