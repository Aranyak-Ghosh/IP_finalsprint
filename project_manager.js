const NodeCouchDb = require('node-couchdb');
const logger = require('./logger.js');
const fs = require('fs');
const nano = require('nano')('http://localhost:5984');

const couch = new NodeCouchDb();

const projects = 'projects';

const db = nano.use(projects);


module.exports = function base64_encode(file) {
    logger.verbose('Converting ' + file + ' to Base64');
    return fs.readFileSync(file, 'base64');
}



module.exports.retrieve_projects = function (room, callback) {

    db.view('retrieve_projects', 'room_project', { 'keys': [room] }, function (err, body) {
        if (err) {
            logger.error('Error retrieving projects: ' + err);
            callback(err);
        }
        else {
            callback(null, body.rows[0].value);
            logger.verbose('Returned list of projects');
        }

    });
}

module.exports.retrieve_all = function (callback) {
    var project_list = [];
    db.list({ include_docs: true }, function (err, body) {

        if (!err) {
            body.rows.forEach(element => {

                var arr = element.doc.projects;
                if (typeof arr != 'undefined') {
                    arr.forEach(pro => {


                    });

                }


            });

            callback(null, project_list);

        }
        else
            callback(err);
    });
}


module.exports.add_project = function (img) {
    var dir = 'public/img/projects/' + img.room + '/';

    fs.mkdir(__dirname+dir, function (err) {
        if (err && err.code != 'EEXIST') {
            console.log(err);
        }
        else {
            fs.writeFile(__dirname + dir + img.title, img.image, { encoding: 'base64' }, function (err) {
                if (!err) {
                    console.log('File created');
                    db.view('retrieve_projects', 'room_project', { 'keys': [img.room] }, function (err, body) {
                        if (err) {
                            logger.error('Error retrieving projects: ' + err);
                            callback(err);
                        }
                        else {
                            if (body.total_rows == body.offset) {
                                //TODO create document for room
                                
                            }
                            else {
                                //TODO update database   

                            }

                        }

                    });
                }
                else {
                    console.log(err);
                }
            });
        }
    });
}

function generateid() {
    var ids;
    couch.uniqid().then(ids => ids[0]);
    return ids;
}

