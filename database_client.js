const mqtt = require('mqtt');
const winston = require('winston');
const broker = 'mqtt://broker.mqttdashboard.com';

const logger = require('./logger.js');

var client = mqtt.connect(broker);

const topics = {
    presence: 'COE457/Wayfinding/presence',
    rooms: []
};

var rooms = [];

client.on('connect', function () {
    client.subscribe(topics.presence);
    client.publish(topics.presence, 'Server running');
    console.log('connected to broker. published to presense');
    logger.info('Subscribed to Presence');
});

client.on('message', function (topic, message) {
    
    if (topic === topics.presence) {
        
        m = JSON.parse(message);
        topics.rooms.push(m.number);
        client.subscribe(topics.rooms[length - 1]);
        
        logger.info('Subscribed to room' + m.number);
        
        var temp = {
            beacons: m.beacons,
            size: m.size,
        };
        
        rooms.push(temp);
        
        
    }
});