// Will contain the paths of all the projects of this deployment
angular.module('angularApp').factory('ProjectsService', function ($rootScope, ServerInterfaceService) {
    var projectsLog = 'PROJECTS SERVICE: ';
    var projectsKey = 'PROJECTS';
    var storage = window.localStorage;

    var projects = [];
    var log = function (message) {
        console.log(projectsLog + message);
    }

    // retrieves projects which are saved in the local storage
    var fetchProjectsFromStorage = function () {
        log('fetching projects data from local storage')
        var p = JSON.parse(storage.getItem(projectsKey));
        if (p) {
            tempArray = [];
            log('Fetched projects from local storage ');
            p.forEach(element => {
                tempArray.push(element);
                log('Found in storage: ' + JSON.stringify(element));
            });
            projects = tempArray;

        } else {
            log('There are no projects stored in local storage');
        }
    }

    // updates the local storage with new project object
    var updateLocalStorage = function () {
        console.log('storing project data in local storage');
        storage.setItem(projectsKey, JSON.stringify(projects));
    }
    var log = function (message) {
        console.log(projectsLog + message);
    }
    // called when new projects are recieved from server
    $rootScope.$on('server-recieved-projects', function (event, args) {
        log('recieved all projects');
        addNewProjects(args.projects);
    })

    // $rootScope.$on('saved-image', function(event,args){
    //     log('an image was saved in local storage for '+args.route);
    //     $rootScope.$broadcast('show-image', {route:route});
    // })

    function addNewProjects(newProjects) {
        log('Overwriting old projects');
        projects = newProjects;
        projects.forEach(element => {
            log('recieved project:' + JSON.stringify(element));
            // ServerInterfaceService.requestOneProjectImage(element.route);
        });
        updateLocalStorage();
    }

    var init = function () {
        log('initializing ProjectsService');
        fetchProjectsFromStorage();
    }

    // // should become an ID
    // var requestOneProjectImage = function (title) {
    //     log('Attempting to fetch image of project' + title);
    //     if (projects.length > 0) {
    //         projects.forEach((element) => {
    //             if (element.title === title) {
    //                 log('Project ' + title + ' loaded. requesting image ...');
    //                 ServerInterfaceService.requestOneProjectImage(element.route);
    //                 return;
    //             }
    //         })
    //         log('Could not find project ' + title + ' in storage')
    //     }
    //     else {
    //         log('Project: ' + title + ' is not store');
    //     }
    // }

    var requestAllProjects = function () {
        log('requesting all projects from server');
        ServerInterfaceService.requestProjects();
    }

    var returnProjectArray = function () {
        return projects;
    }

    return {
        returnProjectArray:returnProjectArray,
        init: init,
        requestAllProjects: requestAllProjects
    }

})
