//const createError = require('http-errors');
//const path = require('path');
//const cookieParser = require('cookie-parser');
//const logger = require('morgan');
//const indexRouter = require('./routes/index');

//const usersRouter = require('./routes/users');

// -------------------------------------------------------------------------------------------------------

//'Import' the express module as an OBJECT (representing the express framework) using the 'require' syntax
const express = require('express');     //Now we have a reference to an object known as 'express'

//Use the express framework to generate an 'app' object from which to serve as the application controller
const app = express();      //'app' is the controller object.

//Use the '.set()' method to define the 'templating engine' for the server
//This is basically something which generates dynamic HTML based on a template (to structure it) and data passed to it
//to fill in indicated values (usually custom text and whatnot).
app.set("views", "./views");    //Sets the directory from which the 'views' (templates for the TE) will look fo r the templating file.
app.set("view engine", "ejs");  //Sets EJS to be the templating engine we are using.


//Use the 'importing' functionality of 'require' call to access our database (which currently is just another local JS code)
const db = require('./public/javascripts/models/db.js');


//Define a handler for HTTP GET requests that come into the server, along any URL path. For now, we will
//define this such that we just send back a hello world message.
//
app.get('/', function(req, res) {
    res.send("hello world");
});


//Route for getting user names
app.get('/users', function (req, res) {
    res.render('usersDirectory', {
        userList : db.users,
        path : "/users"
    })
});


//Route for getting a specific user via id in URL
app.get('/users/:id', function (req, res) {
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
});

//Start the server with app.listen( /* PORT NUMBER */ )
//This function literally runs the server and makes the host listen for live HTTP requests at the specified port!!
app.listen(3000);