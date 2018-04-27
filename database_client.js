const mqtt = require('mqtt');
const broker = 'mqtt://broker.mqttdashboard.com';

const node_couchdb = require('node-couchdb');

const redis = require('redis');

const logger = require('./logger.js');


const room_list = 'room-list';

const couchdb = new node_couchdb();


var mqtt_client = mqtt.connect(broker);
var redis_client = redis.createClient();


redis_client.on('error', function (err) {
    logger.log('error', 'Redis server crashed with error: ' + err);
});

const topics = {
    presence: 'COE457/Wayfinding/presence',
    rooms: [],
    last_will: "COE457/Wayfinding/last_will"
};

var rooms = [];

mqtt_client.on('connect', function () {
    mqtt_client.subscribe(topics.presence);
    mqtt_client.subscribe(topics.last_will);
    mqtt_client.publish(topics.presence, 'Server running');
    console.log('connected to broker. published to presense');
    logger.info('Subscribed to Presence');
});

mqtt_client.on('message', function (topic, message) {

    if (topic === topics.presence) {

        m = JSON.parse(message);
        topics.rooms.push('COE457/Wayfinding/' + m.number);
        mqtt_client.subscribe(topics.rooms[length - 1]);

        logger.info('Subscribed to room' + m.number);

        var temp = {
            beacons: m.beacons,
            size: m.size,
            map: m.map
        };

        rooms.push(temp);

        couchdb.get(room_list, m.number).then(({ data, headers, status }) => {
            console.log(JSON.stringify(data));
            couchdb.del(room_list, m.number, data._rev).then(({ data, headers, status }) => {
                couchdb.insert(room_list, { id: m.number });
            }, err => {
                logger.error("Couch_DB error: " + err.code);
            });

        }, err => { logger.error("Couchdb error: " + err) });
        redis_client.set(topics.rooms[length - 1], JSON.stringify(temp));
    }
    else if (topic === topics.last_will) {
        mqtt_client.unsubscribe('COE457/Wayfinding/' + message);
        couchdb.get(room_list, m.number).then(({ data, headers, status }) => {
            console.log(JSON.stringify(data));
            couch.del(room_list, m.number, data._rev);

        }, err => { logger.error("Couchdb error: " + err) });

        var index = rooms.indexOf(message);
        if (index != -1)
            rooms.splice(index, 1);
        redis_client.del(topics.rooms[index]);
        topics.rooms.splice(index, 1);
    }
    else {
        var room_data = JSON.parse(message);

        client.get(room_list, data.number).then(({ data, headers, status }) => {
            couch.del(room_list, data._id, data._rev).then(({ data, headers, rev }) => {
                delete room_data.number;
                delete data._rev;
                data.beacon_data = room_data;
                couch.insert(room_data, data).then(({ data, headers, status }) => {
                    logger.info("Document updated with status code: " + status);
                }, err => {
                    logger.error("Error updating document: " + JSON.stringify(err));
                });
            }, err => {
                logger.error("Error updating document: " + JSON.stringify(err));
            }, err => {
                logger.error("Error updating document: " + JSON.stringify(err));
            });
        }, err => {
            logger.error("Error updating document: " + JSON.stringify(err));
        });

    }
});
