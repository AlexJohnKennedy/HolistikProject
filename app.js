//'Import' the express module as an OBJECT (representing the express framework) using the 'require' syntax
const express = require('express');     //Now we have a reference to an object known as 'express'

//Import our own router object to set the routing for different urls on our site.
const router = require('./routes/routes');

//Use the express framework to generate an 'app' object from which to serve as the application controller
const app = express();      //'app' is the controller object.

//Use the '.set()' method to define the 'templating engine' for the server
//This is basically something which generates dynamic HTML based on a template (to structure it) and data passed to it
//to fill in indicated values (usually custom text and whatnot).
app.set("views", "./views");    //Sets the directory from which the 'views' (templates for the TE) will look fo r the templating file.
app.set("view engine", "ejs");  //Sets EJS to be the templating engine we are using.

//Tell the app to use the router object
app.use(router);

//Declare a static directory
app.use(express.static(__dirname + '/public'));

//Start the server with app.listen( /* PORT NUMBER */ )
//This function literally runs the server and makes the host listen for live HTTP requests at the specified port!!
const PORT = process.env.PORT || 3000;  //This is for deploying using heroku. It says 'use the port heroku assigns for us, and if that's not there, use 3000
app.listen(PORT, function(){
    console.log(`Express listening on port ${PORT}`);
});