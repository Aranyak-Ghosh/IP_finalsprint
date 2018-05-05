const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const NodeCouchDb = require('node-couchdb');
const uuid = require('uuid/v4');
const COOKIE = "chipsAhoy";

const redis = require('redis');

const redis_client = redis.createClient();

const redis_config_key = 'COE457/Wayfinding/';
const couch = new NodeCouchDb();

let User = require('./user.js');
let project_manager=require('./project_manager.js');


app.set('port', process.env.PORT || 8080);

/**
 * Middleware to serve static files from directory
 */
app.use(express.static(__dirname));

/**
 * Middleware to parse requests received and parse cookie
 */
app.use(cookieParser());

/**
 * Middleware to handle user session and cookies
 */
app.use(session({
    genid: (req) => {
        return uuid(); // use UUIDs for session IDs
    },
    secret: COOKIE,
    store: new RedisStore({ host: 'localhost', port: 6379 }),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.json());


var urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * Serve login attempt as a POST request. Redirect to homepage if authenticated
 */
app.post('/attemptLogin', urlencodedParser, function (req, res) {

    console.log(JSON.stringify(req.body));
    if (req.body.username.includes("@"))
        var user = new User("null", req.body.password, req.body.username);
    else
        var user = new User(req.body.username, req.body.password, "null");

    console.log(user.email);
    console.log(user.username);
    console.log(user.password);

    res.set('Content-Type', 'text/plain');
    user.authenticate().then((code) => {
        res.send(code);
        res.status(200);
        redis_client.set(code, user.username);
    }).catch((error) => {

        if (!error.includes('500')) {
            res.status(200);
            res.send(error);
        }
        else {
            res.status(500);
            res.send(error);
        }


    })
});

/**
 * Serve Register attempt as a POST request. Redirect to login if authenticated
 */
app.post('/attemptRegister', urlencodedParser, function (req, res) {

    var newUser = new User(req.body.username, req.body.password, req.body.email);
    newUser.register().then((code) => {
        res.status(200);
        res.send(code);
    }).catch((error) => {
        if (error.includes("500")) {
            res.status(500);
            res.send("error");
        }
        else {
            res.status(200);
            res.send(error);
        }
    });
});


app.post('/room', urlencodedParser, function (req, res) {

    var beacon = req.body.id;

    //reply should be the room number
    redis_client.get(beacon, (err, reply) => {

        if (err) {

            logger.error('Redis error: ' + err);

            res.type('text/plain');
            res.status(500);
            res.send('500 - Internal Error');
        }
        else {
            //Send map, beacon location, 
            var room_number = JSON.parse(reply).room;
            redis_client.get(room_number, (err, reply) => {
                if (err) {

                    logger.error('Redis error: ' + err);

                    res.type('text/plain');
                    res.status(500);
                    res.send('500 - Internal Error');
                }
                else {
                    var look_up = JSON.parse(reply);
                    redis_client.get(redis_config_key + room_number, (err, reply) => {
                        if (err) {

                            logger.error('Redis error: ' + err);

                            res.type('text/plain');
                            res.status(500);
                            res.send('500 - Internal Error');
                        }
                        else {
                            var map = JSON.parse(reply).map;
                            var beacons = JSON.parse(reply).beacons;

                            var re_json = {
                                map: map,
                                beacons: []
                            };

                            for (var x in beacons) {
                                re_json.beacons.push({
                                    id: look_up[x],
                                    position: beacons[x]
                                });
                            }

                            beacons.forEach(element => {
                                var temp;

                                temp.id = look_up[element.id];
                                temp.position = element.position;

                                re_json.beacons.push(temp);
                            });

                            res.status(200);
                            res.set('Content-Type', 'text/plain');
                            res.send(JSON.stringify(re_json));

                        }
                    });
                }
            });
        }

    });
});
/*
app.get('/listallprojects', function (req, res) {
    project_manager.retrieve_all(function(err,list){
        if(!err){
            res.status(200);
            res.send(list);
        }
        else
            res.sendStatus(500);
    });
});
*/

app.post('/logout', urlencodedParser, function (req, res) {

    redis_client.del(req.body.token, function (err, reply) {
        if (!err) {
            console.log('Redis replied: ' + reply);

            if (reply == 1) {
                res.status(200);
                res.send('logged out');
            }
            else {
                res.status(200);
                res.send('Already logged out');

            }
        }
        else {
            res.status(500);
            res.send('Internal server error');
            console.log('Redis server error: ' + err);
        }
    });
});



////////////////
// custom 404 page
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');

});

// custom 500 page
app.use(function (req, res) {
    res.type('text/plain');
    res.status(500);
    res.send('500 - Internal Error');

});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});




