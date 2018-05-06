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
            //TODO make an array of project paths
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
                        project_list.push(pro);
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

    fs.mkdir(__dirname + dir, function (err) {
        if (err && err.code != 'EEXIST') {
            console.log(err);
        }
        else {
            var id = makeid();
            fs.writeFile(__dirname + dir + id, img.image, { encoding: 'base64' }, function (err) {
                if (!err) {
                    console.log('File created');
                    db.view('retrieve_projects', 'room_project', { 'keys': [img.room] }, function (err, body) {
                        if (err) {
                            logger.error('Error retrieving projects: ' + err);
                            callback(err);
                        }
                        else {
                            delete img.image;
                            if (body.total_rows == body.offset) {
                                //TODO create document for room
                                var _id = generateid();
                                var doc={
                                    projects:[]
                                };
                                doc._id = _id;
                                img.route = dir+id;
                                doc.projects.push(img);
                                couch.insert(projects, doc).then(({ data, headers, status }) => {
                                    logger.verbose('Document added for project');
                                }, err => {
                                    logger.error('Document not added');
                                });
                            }
                            else {
                                //TODO update database   
                                var doc=body.rows[0];
                                img.route = dir+id;
                                doc.projects.push(img);

                                couch.update(projects,doc).then(({data,headers,status})=>{
                                    logger.verbose('Document updated');
                                }, err=>{
                                    logger.error(err);
                                });
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

function makeid() {
    var text = "";
    var possible = "0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}