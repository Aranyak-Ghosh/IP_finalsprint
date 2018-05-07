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

const logger = require('./logger.js');
const redis_client = redis.createClient();

const redis_config_key = 'COE457/Wayfinding/';


const couch = new NodeCouchDb();

let User = require('./user.js');
let project_manager=require('./project_manager.js');



function serveStaticFile (res, path , contentType , responseCode ) {
    if (!responseCode) responseCode = 200 ;
    fs.readFile (__dirname +'/public'+path, function (err,data) {
    if (err)
    {
        res.writeHead ( 500 , { 'Content-Tye' : 'text/plain' });
        res.end ( '500 - Internal Error' );
    }
    else
    {
        res.writeHead ( responseCode , { 'Content-Type' : contentType });
        res.end (data);
    }
    });
}

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

app.post('/get_map',urlencodedParser, function(req,res){
    var uuid=req.body.uuid;

    redis_client.get(uuid, function(err,reply){
        if(err)
        {
            logger.error('Redis error: ' + err);

            res.type('text/plain');
            res.status(500);
            res.send('500 - Internal Error');
        }
        else{
            res.send(reply);
            logger.verbose('Sent map route');
        }
    });
});

app.post('/get-room', urlencodedParser, function(req, res){

    var room=req.body.major;

    redis_client.get(redis_config_key+room, function(err, reply){
        if(err)
        {
            logger.error('Redis error: ' + err);

            res.type('text/plain');
            res.status(500);
            res.send('500 - Internal Error');
        }
        else{
            var config=JSON.parse(reply);
            res.send(reply);
            logger.verbose('Sent beacon positions');
        }
    });
});


app.get('/listallprojects', function (req, res) {
    console.log('Received request to list all projects');
    project_manager.retrieve_all(function(err,list){
        if(!err){
            res.status(200);
            res.send(JSON.stringify({payload:list}));
            console.log('Sent response');
        }
        else
            res.sendStatus(500);
    });
});


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




