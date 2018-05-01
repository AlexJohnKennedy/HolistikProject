//Use the 'importing' functionality of 'require' call to access our database
const db = require('../models/db.js');
const apiController = require('./apiController.js');


//In this controller file, we are going to define the 'functions' which generate the responses to certain requests.
//It is not up to the controller object to decide WHICH URLS activate which repsonses, that is the job of the router
//Here, we are simply defining the functions which pass data to views to be rendered, and the router will decide when to call each one

//Define a simple main page rendering for front end development
function mainPageGet(req, res) {
    res.render('pages/mindMapPage');
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
    res.render('pages/profilePage');
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