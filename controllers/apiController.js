/*
 * This file contains and defines the functionality for the server API controller. In other words, controller logic for
 * how the server handles project save and load data requests (AJAX from the front end) is contained here!
 */

const db = require('../models/db.js');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;     //How many iterations for bcrypt will use for hasing password with the generated salt

//Import passport and username/password module, to handle login authentication and session handling.
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//Globally run code (invoked when this module is 'required') to configure the passport library
passport.use(new LocalStrategy(
    function(email, password, done) {

        //Get a corresponding user by the passed email.
        let databasePromise = db.getOneUserByEmail(email);

        //Okay, let's attach our handler callbacks to the promise
        databasePromise.then(function(user) {
            //Okay, we successfully got a result from the database.

            //If the user account corresponding with the email did not exist:
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            //Okay, the user exists! Now we need to use bcrypt to compare the password with the hash!
            bcrypt.compare(password, user.hash).then(function(isMatch) {
                //If the crypto call succeeded this happens.
                if (isMatch) {
                    //Woo! the password matched after it was hashed with da salt!
                    return done(null, user);
                }
                else {
                    //Passwords did not match.
                    return done(null, false, { message: 'Incorrect password.' });
                }
            }).catch(function(err) {
                return done(null, false, { message: 'Bcrypt failed to compare password with hash' });
            });

        }).catch(function(err) {
            //Catching database lookup error!
            return done(err);
        });
    }
));

// ---------------------------------------------------------------------------------------------------------------------
// --- Functions which will be invoked by the router. ------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function projectStructureLoad(req, res) {
    console.log("Got a proj structure load request, with req.body:");
    console.log(req.body);


}

function projectArrangementLoad(req, res) {
    console.log("Got a proj arrangement load request, with req.body:");
    console.log(req.body);


}

function loadArrangement(req, res) {
    //TODO -- REAL DATABASE
    console.log("Got an arrangement load request, with req.body:");
    console.log(req.body);

    //For now, we will literally just wait 5 seconds, then send back the hard coded JSON
    setTimeout(
        function() {
            res.send(db.testArrangement);
        },
        2500
    );
}

function projectStructureSave(req, res) {
    console.log("Got a proj structure save request, with req.body:");
    console.log(req.body);


    res.send(req.body);
}

function projectArrangementSave(req, res) {
    console.log("Got a proj arrangement save request, with req.body:");
    console.log(req.body);

    //indicate back to the client what was saved!
    res.send(req.body);
}

function saveArrangement(req, res) {
    //TODO -- REAL DATABASE WITH MONGOOSE
    console.log("Got an arrangement save request, with req.body:");
    console.log(req.body);

    //NOTE: request body arrives already parsed by our body-parser which the framework is using!!

    //For hardcoded testing purposes, we will just extract the data and overwrite our hardcoded string with the new JSON
    //(in the real app, we will parse the information into a mongoose shcema and save it to the database!)
    setTimeout(
        function() {
            let data = JSON.stringify(req.body.data);

            db.testArrangement = data;
            res.send(data);     //Indicate back to client what was saved!
        },
        800
    );
}

// ---------------------------------------------------------------------------------------------------------------------
// --- User registration and login establishment -----------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function registerNewUser(req, res) {
    console.log("Attempting to save a new user. req.body:");
    console.log(req.body);

    //Call the bcrypt library to hash our plaintext password and automatically create an asociated salt.
    //When that completes (asynchronously), we will ask the db to create a new user record
    bcrypt.hash(req.body.password, SALT_ROUNDS).then(function(hashResult) {
        db.createNewUser(req.body, hashResult).then(function(user) {
            res.send(user);
        }).catch(function(err) {
            res.send("ERROR ON ATTMEPT TO SAVE USER:\n"+err);
        });
    }).catch(function(err) {
        res.send("Bcrypt failed to fucking hash dat shit:\n"+err);
    });
}

function loginUser(req, res) {
    console.log("Attempting to login a user. req.body:");
    console.log(req.body);


}

function logoutUser(req, res) {

}

module.exports = {
    projectStructureLoad   : projectStructureLoad,
    projectArrangementLoad : projectArrangementLoad,
    loadArrangement        : loadArrangement,

    projectStructureSave   : projectStructureSave,
    projectArrangementSave : projectArrangementSave,
    saveArrangement        : saveArrangement,

    registerNewUser        : registerNewUser,
    loginUser              : loginUser,
    logoutUser             : logoutUser
};