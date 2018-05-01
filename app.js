//Session secret..
const secret = "TripleGisGod";

//'Import' the express module as an OBJECT (representing the express framework) using the 'require' syntax
const express = require('express');     //Now we have a reference to an object known as 'express'
const passport = require('passport');
const session = require('express-session');
const router = require('./routes/routes');

const app = express();      //'app' is the controller object.

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(router);

app.use(express.static(__dirname + '/public'));

app.set("views", "./views");    //Sets the directory from which the 'views' (templates for the TE) will look fo r the templating file.
app.set("view engine", "ejs");  //Sets EJS to be the templating engine we are using.

//Start the server with app.listen( /* PORT NUMBER */ )
//This function literally runs the server and makes the host listen for live HTTP requests at the specified port!!
const PORT = process.env.PORT || 3000;  //This is for deploying using heroku. It says 'use the port heroku assigns for us, and if that's not there, use 3000
app.listen(PORT, function(){
    console.log(`Express listening on port ${PORT}`);
});