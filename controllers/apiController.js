/*
 * This file contains and defines the functionality for the server API controller. In other words, controller logic for
 * how the server handles project save and load data requests (AJAX from the front end) is contained here!
 */

const db = require('../models/db.js');
const cryptoFunctions = require('../config/cryptoFunctions.js');
const Project = require('../models/projectSchema.js');
const User = require('../models/projectSchema.js');


// ---------------------------------------------------------------------------------------------------------------------
// --- Functions which will be invoked by the router. ------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function projectStructureLoad(req, res) {
    console.log("Got a proj structure load request, with req.body:");
    console.log(req.body);

    Project.structureModel.findOne({ projectId: req.body.projectId }, function (err, structure) {
        if (err) {
            return console.error(err);
        } else {
            console.log("STURC");
            console.log(structure.contentNodes);
            //send off what we retrieved from the db
            res.send(structure.contentNodes);
        }
    });
}

function projectArrangementLoad(req, res) {
    console.log("Got a proj arrangement load request, with req.body:");
    console.log(req.body);

    Project.arrangementModel.findOne({ projectId: req.body.projectId }, function (err, arrangement) {
        if (err) {
            return console.error(err);
        } else {
            console.log("ARA");
            console.log(arrangement.contentNodeArrangement);
            //send off what we retrieved from the db
            res.send(arrangement.contentNodeArrangement);
        }
    });
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

    //construct a Mongoose model with the request body
    let structure = new Project.structureModel(req.body);

    //if there exists something in the db with the same project id, fuck it off TODO: maintain db pk reference
    Project.structureModel.remove( { projectId: req.body.projectId }, function (err) {
        if (err) {
            return console.error(err);
        } else {
            console.log("Purged database of structures with ID: " + req.body.projectId);
        }
    });

    //write to the database
    structure.save(function (err, structure) {
        if (err) {
            return console.error(err);
        } else {
            console.log("Saved structure. ID: " + structure.projectId);
        }
    });

    //indicate back to the client what was saved!
    res.send(req.body);
}

function projectArrangementSave(req, res) {
    console.log("Got a proj arrangement save request, with req.body:");
    console.log(req.body);

    //construct a Mongoose model with the request body
    let arrangement = new Project.arrangementModel(req.body);

    //if there exists something in the db with the same project id, fuck it off TODO: maintain db pk reference
    Project.arrangementModel.remove( { projectId: req.body.projectId }, function (err) {
        if (err) {
            return console.error(err);
        } else {
            console.log("Purged database of arrangements with ID: " + req.body.projectId);
        }
    });

    //write to the database
    arrangement.save(function (err, arrangement) {
        if (err) {
            return console.error(err);
        } else {
            console.log("Saved arrangement. ID: " + arrangement.projectId);
        }
    });

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

function registerNewUser(req, res) {
    console.log("Attempting to save a new user. req.body:");
    console.log(req.body);

    //construct model from the json body, note that the hash and salt fields need to be updated
    let user = new User.userSchema(req.body.user);

    //hash teh plain text pass and store the user in mong
    cryptoFunctions.hashPassAndStoreUser(req.body.password, req.body.user);
}

function storeUser(freshHash, user) {
    //update hash field
    user.hash = freshHash;

    //push to mong
    user.save(function (err, user) {
        if (err) {
            return console.error(err);
        } else {
            console.log("Saved new user. email: " + user.email);
        }
    });
}

function loginUser(req, res) {
    //get the relevant hash from the db NOTE: CHANGE SEARCH JSON
    User.userSchema.findOne({email: res.email}, function (err, user) {
        if (err || !user) {
            return console.error(err);
        } else {
            //we found the user, check if the plain text pass corresponds to the hash
            cryptoFunctions.verifyPassword(user.hash, req.password);
        }
    });
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