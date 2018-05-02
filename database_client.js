const mqtt = require('mqtt');
const broker = 'mqtt://broker.mqttdashboard.com';

const node_couchdb = require('node-couchdb');

const nano = require('nano')('http://localhost:5984');

const redis = require('redis');

const logger = require('./logger.js');


const room_list = 'room-list';

const couchdb = new node_couchdb();


var mqtt_client = mqtt.connect(broker);
var redis_client = redis.createClient();


redis_client.on('error', function (err) {
    logger.log('error', 'Redis server crashed with error: ' + err);
});

var db = nano.use('room-list');

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
    logger.verbose('Subscribed to Presence');
});

mqtt_client.on('message', function (topic, m_buff) {

    logger.debug(m_buff.toString());

    var message = m_buff.toString();
    if (topic === topics.presence) {
        if (!(message == 'Server running')) {
            m = JSON.parse(message);

            logger.verbose('Rpi discovered');
            if (m.data == 'config') {
                console.log('RPi discovered');
                topics.rooms.push('COE457/Wayfinding/' + m.room);
                mqtt_client.subscribe(topics.rooms[topics.rooms.length - 1]);



                logger.verbose('Subscribed to room' + m.room);

                var temp = {
                    beacons: m.beacons,
                    size: m.size,
                    map: m.map
                };

                rooms.push(temp);

                

                db.view('get_room', 'rooms', { 'keys': [m.room] }, function (err, body) {
                    if (err) {
                        logger.error(err);
                    }
                    else {
                        console.log('View running');
                        console.log(JSON.stringify(body));
                        if (body.total_rows != body.offset) {
                            db.destroy(body.rows[0].value._id, body.rows[0].value._rev, function (err, body) {
                                if (err)
                                    logger.error(err);
                                else {
                                    var ids;
                                    couchdb.uniqid().then(ids => ids[0]);
                                    couchdb.insert(room_list, { _id: ids, room: m.room }).then(({ data, headers, status }) => {
                                        logger.verbose('Created document for room');
                                    }, err => {
                                        logger.error('Error creating document at line 74: ' + err);
                                    });
                                }
                            });

                        }
                        else {
                            var ids;
                            couchdb.uniqid().then(ids => ids[0]);
                            couchdb.insert(room_list, { _id: ids, room: m.room }).then(({ data, headers, status }) => {
                                logger.verbose('Created document for room');
                            }, err => {
                                logger.error('Error creating document at line 74: ' + err);
                            });
                        }
                    }
                });

                redis_client.set(topics.rooms[topics.rooms.length - 1], JSON.stringify(temp));
            }
            else if (m.data == 'config') {
                var look_up;
                for (var key in m) {
                    if (!((key == 'data') || (key == 'room'))) {
                        redis_client.set(m[key], JSON.stringify({ room: m.room, tag: key }), (err, reply) => {
                            if (err)
                                logger.error(err);
                            else {
                                console.log('Added data to redis');
                                logger.verbose('Added data to redis');
                            }
                        });
                        look_up[key] = m[key];
                    }
                }
                console.log(m.room + ': ' + JSON.stringify(look_up));
                redis_client.set(m.room, JSON.stringify(look_up), function (err, msg) {
                    if (err) {
                        logger.error(err);
                        console.log(err);
                    }
                    else {
                        console.log(msg);
                        logger.verbose(msg);
                    }
                });
            }
        }
    }
    else if (topic === topics.last_will) {
        console.log('Last will topic');
        mqtt_client.unsubscribe('COE457/Wayfinding/' + message);

        db.view('get_room', 'rooms', { 'keys': [m.number] }, function (err, body) {
            if (err)
                logger.error(err);
            else {
                console.log(JSON.stringify(data));
                couch.del(room_list, m.number, data._rev);
            }
        })

        var index = rooms.indexOf(message);
        if (index != -1)
            rooms.splice(index, 1);
        redis_client.del(topics.rooms[index]);
        topics.rooms.splice(index, 1);
    }
    else {
        var room_data = JSON.parse(message);
        console.log('Message received');
        logger.debug(JSON.stringify(room_data));
        console.log(message);
        

        db.view('get_room', 'rooms', { 'keys': [room_data.number] }, function (err, body) {
            if (err)
                logger.error(err);
            else {
                
                console.log(JSON.stringify(body));

                logger.debug(JSON.stringify(body));
                var data = body.rows[0].value;

                delete room_data.number;

                data.beacon_data=room_data;


                couchdb.update(room_list,data).then(({data,headers,status})=>{
                    logger.verbose('Updated document');
                }, err=>{
                    logger.error(err);
                });

            }
        });

    }
});
