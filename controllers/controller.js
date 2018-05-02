//Use the 'importing' functionality of 'require' call to access our database
const db = require('../models/db.js');
const apiController = require('./apiController.js');


//In this controller file, we are going to define the 'functions' which generate the responses to certain requests.
//It is not up to the controller object to decide WHICH URLS activate which repsonses, that is the job of the router
//Here, we are simply defining the functions which pass data to views to be rendered, and the router will decide when to call each one

//Define a simple main page rendering for front end development
function mainPageGet(req, res) {
    let username = null;
    //If the user is logged in, then we can supply the username
    if (req.user) {
        username = req.user.username
    }
    res.render('pages/mindMapPage', { username: username});
}


//Define behaviour for the home directory
function homeDirectoryGet(req, res) {
    res.render('pages/landingPage', {
        path : "/"
    });
}


//Define behaviour and access data to get user list
function generateUserList(req, res) {
    res.render('usersDirectory', {
        userList : db.users,
        path : "/users"
    });
}

function helpPageGet(req, res) {
    res.render('pages/helpPage');
}

function profilePageGet(req,res) {
    console.log("--- Rendering the profile page! ---");
    console.log("NOTE: if the user is not currently logged in, then the passport authorisation will have failed and re-directed them back to the landing page");
    console.log("The currently logged in user is:");
    console.log(req.user);

    if (req.user == null || !req.isAuthenticated()) {
        //Oops! the user is not logged in. Redirect them to the landing page so that they can log in and set up a session
        return res.redirect("/");   //return, so that we only reply once.
    }
    //If we made it here, then all is well, and the user is logged in! Thus, we need to gather the project data for this
    //user from the database, and pass it back to the profile page for rendering and client storage!

    //Access the list of project elements according to the schema, from the User record.
    let projectAssociations = req.user.projects;    //SEE USER SCHEMA FOR STRUCTURE.

    //Split these associations into write permission projects, and read permission projects
    let writePermIds = [];
    let readPermIds  = [];
    for (let proj of projectAssociations) {
        if (proj.writePermission) {
            writePermIds.push(proj.projectId);
        }
        else {
            readPermIds.push(proj.projectId);
        }
    }

    //Define the data object the EJS renderer will receive when it renders the page.
    let dataToClient = {
        username: req.user.username,
        writeProjects: [],      //Will become array of project data objects, if the user has them
        readOnlyProjects: [],   //Will become array of project data objects, if the user has them
    };

    //For id lists which are not empty, make database requests to gather project information
    if (writePermIds.length) {
        let dbPromise = db.getProjectsByIds(writePermIds);

        //Define callbacks for the database handling
        dbPromise.then(function(result) {
            console.log("Successfully got some write-permission project records for this user! user owns "+result.length+" projects with write permission");
            extractProjectInfoForProfilePageIcons(result, dataToClient.writeProjects);
        }).catch(function(err) {
            console.log("ERROR: Failed to get project data for list of write-permission ids for this user \n"+err);
            res.send("ERROR: Failed to get project data for list of write-permission ids for this user \n"+err);
        });
    }
    if (readPermIds.length) {
        let dbPromise = db.getProjectsByIds(readPermIds);

        //Define callbacks for the database handling
        dbPromise.then(function(result) {
            console.log("Successfully got some write-permission project records for this user! user owns "+result.length+" projects with write permission");
            extractProjectInfoForProfilePageIcons(result, dataToClient.readOnlyProjects);
        }).catch(function(err) {
            console.log("ERROR: Failed to get project data for list of read-permission ids for this user \n"+err);
            res.send("ERROR: Failed to get project data for list of read-permission ids for this user \n"+err);
        });
    }

    //Okay, we have built up our data! Let's tell the client to render the profile page with the data we gathered.
    res.render('pages/profilePage', dataToClient);
}
//Helper
function extractProjectInfoForProfilePageIcons(queryResults, arrayToPushTo) {
    //The query results should be an iterable list of documents
    for (let i=0; i<queryResults.length; i++) {
        arrayToPushTo.push({
            projectId: queryResults[i]._id,
            projectName: queryResults[i].name,
            projectImage: (queryResults[i].image != null && queryResults[i].image !== undefined) ? queryResults[i].image : null
        });
    }
}


function signupPageGet(req,res) {
    res.render('pages/signupPage');
}

//Define behaviour and access data to get specific user page
function userDetail(req, res) {
    //-------------------------------------------------------------------------------------------------------------------------------
    //What we will do here is RENDER (using the res.render method) a template page, which will generate HTML with dynamically placed
    //values throughout it as specified in the template.

    //So, what we need to do form here is PASS the appropriate information to the template, so that it can be rendered.
    //From the JS routing, (controller) we access the data (model) and decide what information we want. Then we pass that data to the
    //VIEW (view) for rendering!

    //Ok, so let's use the 'id' passed in the URL string to determine which user we want to access. Then, access that information,
    //package it up, and pass it to the view-rendering engine along with specifying which template file to render!
    //-------------------------------------------------------------------------------------------------------------------------------

    //First, let's access and define the data object we are going to pass in. It will simply be a single object containing data for one user.
    //The REQUEST object stores information relating to the HTTP GET request, and thus, will allow us to access the values passed in the URL
    //Using the :value syntax in the get request url, we can access it under req.params.value - This is where Express places this info.
    if (req.params.id >= db.users.length) {
        res.send("You have run out of users!");
    }
    else if (req.params.id < 0) {
        res.send("Invalid user id passed in URL m8");
    }
    let user = db.users[req.params.id];

    //Now we can simply pass this information to the EJS template renderer
    //Note that the second parameter is an OBJECT
    res.render('userTemplate', {
        user : user,
        id : req.params.id,
        nextid : parseInt(req.params.id)+1,
        previd : req.params.id - 1,
        maxid : db.users.length - 1,
        path : "/users/"
    });
}

//Now, we have to export our functions so that the router can use them as callbacks
module.exports = {
    homeDirectoryGet : homeDirectoryGet,
    generateUserList : generateUserList,
    userDetail : userDetail,
    mainPageGet : mainPageGet,
    helpPageGet : helpPageGet,
    profilePageGet: profilePageGet,
    signupPageGet : signupPageGet,

    apiController : apiController
};