const mqtt = require('mqtt');
const broker = 'mqtt://broker.mqttdashboard.com';

const node_couchdb = require('node-couchdb');

const redis = require('redis');

const logger = require('./logger.js');

var mqtt_client = mqtt.connect(broker);
var redis_client = redis.createClient();

const couchdb=new node_couchdb();

client.on('error',function(err){
logger.log('error','Redis server crashed with error: '+err);
});

const topics = {
    presence: 'COE457/Wayfinding/presence',
    rooms: []
};

var rooms = [];

mqtt_client.on('connect', function () {
    mqtt_client.subscribe(topics.presence);
    mqtt_client.publish(topics.presence, 'Server running');
    console.log('connected to broker. published to presense');
    logger.info('Subscribed to Presence');
});

mqtt_client.on('message', function (topic, message) {
    
    if (topic === topics.presence) {
        
        m = JSON.parse(message);
        topics.rooms.push('COE457/Wayfinding/'+m.number);
        mqtt_client.subscribe(topics.rooms[length - 1]);
        
        logger.info('Subscribed to room' + m.number);
        
        var temp = {
            beacons: m.beacons,
            size: m.size,
            map: m.map
        };
        
        rooms.push(temp);

        couchdb.del("room-list",temp.number,)
        redis_client.set(topics.rooms[length - 1],JSON.stringify(temp));
    }
    else{
        data=JSON.parse(message);
        if(data.A){
            couchdb.insert("")
        }
    }
});