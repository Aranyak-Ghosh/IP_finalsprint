const NodeCouchDb = require('node-couchdb');
const logger = require('./logger.js');
const fs = require('fs');
const nano=require('nano')('http://localhost:5984');

const couch = new NodeCouchDb();

const projects = 'projects';

const db=nano.use(projects);


module.exports = function base64_encode(file) {
    logger.verbose('Converting ' + file + ' to Base64');
    return fs.readFileSync(file, 'base64');
}

/**
 * Function to insert a list of images to a room. 
 * @param img JSON object with attributes: 
 *      room (room number),
 *      project (array of JSON objects with each object having the following parameters: 
 *          image: base_64 encoded string form of the image,
 *          title: title of the project,
 *          artists: Name(s) of the artist)
 */

module.exports = function insert_to_database(img) {
    couch.insert(projects, img).then(({ data, headers, status }) => {
        logger.verbose('Inserted images to the database');
    }, err => {
        logger.error('Error inserting images to database: ' + JSON.stringify(err));
    });
}

module.exports=function retrieve_projects(room, callback) {

   db.view('retrieve_projects','room_project',{'keys':[room]}, function(err,body){
       if(err){
        logger.error('Error retrieving projects: '+err);
        callback(err);
       }
       else{
            callback(null,body.rows[0].value);
            logger.verbose('Returned list of projects');
       }
        
   });
}

db.view('retrieve_projects','room_project',{'keys':[3]}, function(err,body){
    if(err){
     logger.error('Error retrieving projects: '+err);
     callback(err);
    }
    else{
         logger.debug(JSON.stringify(body));
    }
     
});