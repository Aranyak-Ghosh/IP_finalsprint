/**
 * MQTT client
 */

const fs = require('fs');
const mqtt = require('mqtt');
const logger = require('./logger.js');

const broker = 'mqtt://broker.mqttdashboard.com';

const room_number = 1;
const beacons = [{ id: 'A', positon: '(0,0)' }, { id: 'B', positon: '(0,15)' }, { id: 'C', positon: '(15,0)' }, { id: 'D', positon: '(15,15)' }];
const size = '10x15';


const short_to_id = {
    'A': 'bf21a232f6e4a3d1',
    'B': '4e091543338907a8',
    'C': 'c3b74ba25c022e0b',
    'D': '4cb9e22acfdc501e'
};

const topics = {
    presence: 'COE457/Wayfinding/presence',
    rooms: 'COE457/Wayfinding/1',
    last_will: 'COE457/Wayfinding/last_will'
};
var mqtt_client = mqtt.connect(broker, { will: { topic: topics.last_will, payload: room_number } });



var data;

function base64_encode(file) {
    logger.verbose('Converting ' + file + ' to Base64');
    return fs.readFileSync(file, 'base64');
}

data = {
    number: room_number,
    map: base64_encode('/home/aghosh/Desktop/IP_part3/Rpi/public/img/Room1.jpg'),
    size: size,
    beacons: beacons
};

var beacon_data = {
    number: 1,
    A: null,
    B: null,
    C: null,
    D: null
};

mqtt_client.on('connect', function () {
    logger.verbose('Connected to broker');
    mqtt_client.publish(topics.presence, JSON.stringify(data));
});

function publish_data() {
    logger.info('Publishing data to broker');
    if (beacon_data.A) {

        beacon_data.avg = {
            ambientLightLevel: ((beacon_data.A.ambientLightLevel + beacon_data.B.ambientLightLevel + beacon_data.C.ambientLightLevel + beacon_data.D.ambientLightLevel) / 4.0),
            temperature: ((beacon_data.A.temperature + beacon_data.B.temperature + beacon_data.C.temperature + beacon_data.D.temperature) / 4.0)
        };
        mqtt_client.publish(topics.rooms, JSON.stringify(beacon_data));
    }
}

setInterval(publish_data, 300000);

// Packest from the Estimote family (Telemetry, Connectivity, etc.) are
// broadcast as Service Data (per "§ 1.11. The Service Data - 16 bit UUID" from
// the BLE spec), with the Service UUID 'fe9a'.
var ESTIMOTE_SERVICE_UUID = 'fe9a';


/**
 * Function to parse raw BLE data to JSON object
 * @param {*} data Byte array containing raw BLE data
 * @returns result JSON object containing subFrame type 'B'
 */
function parseEstimoteTelemetryPacket(data) { // data is a 0-indexed byte array/buffer

    // byte 0, lower 4 bits => frame type, for Telemetry it's always 2 (i.e., 0b0010)
    var frameType = data.readUInt8(0) & 0b00001111;
    var ESTIMOTE_FRAME_TYPE_TELEMETRY = 2;
    if (frameType != ESTIMOTE_FRAME_TYPE_TELEMETRY) { return; }

    // byte 0, upper 4 bits => Telemetry protocol version ("0", "1", "2", etc.)
    var protocolVersion = (data.readUInt8(0) & 0b11110000) >> 4;
    // this parser only understands version up to 2
    // (but at the time of this commit, there's no 3 or higher anyway :wink:)
    if (protocolVersion > 2) { return; }

    // bytes 1, 2, 3, 4, 5, 6, 7, 8 => first half of the identifier of the beacon
    var shortIdentifier = data.toString('hex', 1, 9);

    // byte 9, lower 2 bits => Telemetry subframe type
    // to fit all the telemetry data, we currently use two packets, "A" (i.e., "0")
    // and "B" (i.e., "1")
    var subFrameType = data.readUInt8(9) & 0b00000011;

    //var ESTIMOTE_TELEMETRY_SUBFRAME_A = 0;
    var ESTIMOTE_TELEMETRY_SUBFRAME_B = 1;

    // ****************
    // * SUBFRAME "B" *
    // ****************
    if (subFrameType == ESTIMOTE_TELEMETRY_SUBFRAME_B) {


        // ***** AMBIENT LIGHT
        // byte 13 => ambient light level RAW_VALUE
        // the RAW_VALUE byte is split into two halves
        // pow(2, RAW_VALUE_UPPER_HALF) * RAW_VALUE_LOWER_HALF * 0.72 = light level in lux (lx)
        var ambientLightUpper = (data.readUInt8(13) & 0b11110000) >> 4;
        var ambientLightLower = data.readUInt8(13) & 0b00001111;
        var ambientLightLevel = Math.pow(2, ambientLightUpper) * ambientLightLower * 0.72;

        // ***** BEACON UPTIME
        // byte 14 + 6 lower bits of byte 15 (i.e., 14 bits total)
        // - the lower 12 bits (i.e., byte 14 + lower 4 bits of byte 15) are
        //   a 12-bit unsigned integer
        // - the upper 2 bits (i.e., bits 4 and 5 of byte 15) denote the unit:
        //   0b00 = seconds, 0b01 = minutes, 0b10 = hours, 0b11 = days
        var uptimeUnitCode = (data.readUInt8(15) & 0b00110000) >> 4;
        var uptimeUnit;
        switch (uptimeUnitCode) {
            case 0: uptimeUnit = 'seconds'; break;
            case 1: uptimeUnit = 'minutes'; break;
            case 2: uptimeUnit = 'hours'; break;
            case 3: uptimeUnit = 'days'; break;
        }
        var uptime = {
            number: ((data.readUInt8(15) & 0b00001111) << 8) | data.readUInt8(14),
            unit: uptimeUnit
        };

        // ***** AMBIENT TEMPERATURE
        // upper 2 bits of byte 15 + byte 16 + lower 2 bits of byte 17
        // => ambient temperature RAW_VALUE, signed (two's complement) 12-bit integer
        // RAW_VALUE / 16.0 = ambient temperature in degrees Celsius
        var temperatureRawValue =
            ((data.readUInt8(17) & 0b00000011) << 10) |
            (data.readUInt8(16) << 2) |
            ((data.readUInt8(15) & 0b11000000) >> 6);
        if (temperatureRawValue > 2047) {
            // JavaScript way to convert an unsigned integer to a signed one (:
            temperatureRawValue = temperatureRawValue - 4096;
        }
        temperature = temperatureRawValue / 16.0;


        // ***** ERROR CODES
        // byte 19, lower 2 bitstion of the error codes
        // starting in protocol version 1, error codes were moved to subframe A,
        // thus, you will only find them in subframe B in Telemetry protocol ver 0
        var errors;
        if (protocolVersion == 0) {
            errors = {
                hasFirmwareError: (data.readUInt8(19) & 0b00000001) == 1,
                hasClockError: ((data.readUInt8(19) & 0b00000010) >> 1) == 1
            };
        }

        // ***** BATTERY LEVEL
        // byte 19 => battery level, between 0% and 100%
        // if all bits are set to 1, it mea
        // see subframe A documentans it hasn't been measured yet
        // added in protocol version 1
        var batteryLevel;
        if (protocolVersion >= 1) {
            batteryLevel = data.readUInt8(19);
            if (batteryLevel == 0b11111111) { batteryLevel = undefined; }
        }

        var result = {
            shortIdentifier,
            frameType: 'Estimote Telemetry', subFrameType: 'B', protocolVersion,
            ambientLightLevel, temperature,
            uptime, batteryLevel, errors
        };


        return result;
    }
}


/** 
 * Consume raw BLE data from the beacons
*/
var noble = require('noble');

noble.on('stateChange', function (state) {

    console.log('state has changed', state);
    if (state == 'poweredOn') {
        var serviceUUIDs = [ESTIMOTE_SERVICE_UUID]; // Estimote Service
        var allowDuplicates = true;
        noble.startScanning(serviceUUIDs, allowDuplicates, function (error) {
            if (error) {
                logger.error('Error starting scanning: ' + error);
                console.log('error starting scanning', error);
            } else {
                console.log('started scanning');
                logger.verbose('Started scanning');
            }
        });
    }
});

noble.on('discover', function (peripheral) {
    var data = peripheral.advertisement.serviceData.find(function (el) {
        return el.uuid == ESTIMOTE_SERVICE_UUID;
    }).data;

    logger.verbose('Discovered BLE packet');

    var telemetryPacket = parseEstimoteTelemetryPacket(data);
    if (telemetryPacket) {
        console.log(telemetryPacket);

        if (telemetryPacket.shortIdentifier.toString() == short_to_id.A)
            beacon_data.A = telemetryPacket;
        else if (telemetryPacket.shortIdentifier.toString() == short_to_id.B)
            beacon_data.B = telemetryPacket;
        else if (telemetryPacket.shortIdentifier.toString() == short_to_id.C)
            beacon_data.C = telemetryPacket;
        else if (telemetryPacket.shortIdentifier.toString() == short_to_id.D)
            beacon_data.D = telemetryPacket;
    }

});



