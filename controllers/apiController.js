/*
 * This file contains and defines the functionality for the server API controller. In other words, controller logic for
 * how the server handles project save and load data requests (AJAX from the front end) is contained here!
 */

const db = require('../models/db.js');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;     //How many iterations for bcrypt will use for hasing password with the generated salt

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
        res.send("Bcrypt failed to fucking hash dat shit:\ns"+err);
    });
}

function loginUser(req, res) {
    /*//get the relevant hash from the db NOTE: CHANGE SEARCH JSON
    User.userModel.findOne({email: res.email}, function (err, user) {
        if (err || !user) {
            return console.error(err);
        } else {
            //we found the user, check if the plain text pass corresponds to the hash
            cryptoFunctions.verifyPassword(user.hash, req.password);
        }
    });*/
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