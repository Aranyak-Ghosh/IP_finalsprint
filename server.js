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

const redis_config_key='COE457/Wayfinding/';
const couch = new NodeCouchDb();

let User = require('./user.js');

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


var urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * Default Directory.
 * Login page if not signed in 
 * Homepage if signed in
 */
app.get('/', function (req, res) {
    res.set('Content-Type', 'text/html');
    var sess = req.session;

    if (sess.username)
        fs.readFile('public/homepage.html', function (err, data) {
            if (err) throw err;
            else {
                res.send(data);
            }
        })
    else fs.readFile('login.html', function (err, data) {
        if (err) throw err;
        else {
            res.send(data);
        }
    })
});

/**
 * Send signup page on request
 */
app.get('/signup', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.readFile('public/signup.html', function (err, data) {
        if (err) throw err;
        else {
            res.send(data);
        }
    })
});

/**
 * Serve login attempt as a POST request. Redirect to homepage if authenticated
 */
app.post('/attemptLogin', urlencodedParser, function (req, res) {
    if (req.body.username.includes("@"))
        var user = new User("null", req.body.password, req.body.username);
    else
        var user = new User(req.body.username, req.body.password, "null");

    console.log(user.email);
    console.log(user.username);
    console.log(user.password);

    res.set('Content-Type', 'text/plain');
    user.authenticate().then((code) => {
        req.session.username = code;
        res.status(200);
        res.send('true');
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
        else{
            //Send map, beacon location, 
            var room_number=JSON.parse(reply).room;
            redis_client.get(room_number, (err, reply)=>{
                if (err) {

                    logger.error('Redis error: ' + err);
        
                    res.type('text/plain');
                    res.status(500);
                    res.send('500 - Internal Error');
                }
                else{
                    var look_up=JSON.parse(reply);
                    redis_client.get(redis_config_key+room_number, (err, reply)=>{
                        if (err) {

                            logger.error('Redis error: ' + err);
                
                            res.type('text/plain');
                            res.status(500);
                            res.send('500 - Internal Error');
                        }
                        else{
                            var map=JSON.parse(reply).map;
                            var beacons=JSON.parse(reply).beacons;

                            var re_json={
                                map:map,
                                beacons:[]
                            };

                            for(var x in beacons){
                                re_json.beacons.push({id:look_up[x],
                                position:beacons[x]});
                            }

                            beacons.forEach(element => {
                                var temp;

                                temp.id=look_up[element.id];
                                temp.position=element.position;

                                re_json.beacons.push(temp);
                            });

                            res.status(200);
                            res.set('Content-Type','text/plain');
                            res.send(JSON.stringify(re_json));
                            
                        }
                    });
                }
            });
        }

    });


});




/*

app.get('/searchLocationString', function (req, res) {
    var query = req.query;
    // search for place in database
    // retrieve array of LatLng values
    var beacons = {
        beacons: [
            {
                lat: 37.721325,
                lng: -122.479749
            },
            {
                lat: 37.721516,
                lng: -122.479545
            },
            {
                lat: 37.7214285,
                lng: -122.479691
            },
            {
                lat: 37.721400,
                lng: -122.479569
            }
        ]
    }
    console.log(JSON.stringify(beacons));
    res.end(JSON.stringify(beacons));
})

/////////////////

// testing beacon status
app.get('/beaconInfo', function(req, res){
    console.log("GET request to route /beaconInfo")
    var data = [{
        temp:32,
        light:22
    },{
        temp:32,
        light:22
    },{
        temp:32,
        light:22
    },{
        temp:32,
        light:22
    }]
    res.status(200);
    res.send(data);
    res.end();
    console.log("Recieved a request for beacon information of beacon 0");
})


/////////////////

//route one find_project', {projectID: string, location{ x: int,y:int}})


app.post ('/find_project',urlencodedParser, function(req, res){

   var userlocation = req.body.userlocation;
   var projectlocation= req.body.projectID;
 
   var beacons ={
       beacons:[
{
    lat:37.721325,
    lng:-122.479749
},

{
    lat:37.721325,
    lng:-122.479749
},
{
    lat:37.721325,
    lng:-122.479749
}, 

] }

   console.log(JSON.stringify(beacons));
   res.end(JSON.stringify(beacons));
})
//////////////////

//route two finding new routes for the user incase lost 

app.post ('/reroute',urlencodedParser, function(req,res){

var usercurrentlocation = req.body.newlocation;
var newroute = req.body.new_route;
var beacons ={
    beacons:[

{
 lat:37.721325,
 lng:-122.479749
},
{
 lat:37.721325,
 lng:-122.479749
},
{
 lat:37.721325,
 lng:-122.479749
}, 
]
}

console.log(JSON.stringify(beacons));
res.end(JSON.stringify(beacons));
})

////////////////

//getting the list of projects 

app.get('/projectlist',urlencodedParser,function(req, res){

     var lists = req.body.project_list;



})

*/
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




