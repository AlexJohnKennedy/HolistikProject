/*
 * This file contains and defines the functionality for the server API controller. In other words, controller logic for
 * how the server handles project save and load data requests (AJAX from the front end) is contained here!
 */

const db = require('../models/db.js');


// ---------------------------------------------------------------------------------------------------------------------
// --- Functions which will be invoked by the router. ------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function projectStructureLoad(req, res) {
    //TODO -- REAL DATABASE
    console.log("Got a proj structure load request, with req.body:");
    console.log(req.body);

    //For now, we will literally just wait 4 seconds, then send back the hard coded JSON
    setTimeout(
        function() {
            res.send(db.testState);
        },
        2600
    );
}

function projectArrangementLoad(req, res) {
    //TODO -- REAL DATABASE
    console.log("Got a proj arrangement load request, with req.body:");
    console.log(req.body);

    //For now, we will literally just wait 5 seconds, then send back the hard coded JSON
    setTimeout(
        function() {
            res.send(db.testArrangement);
        },
        1000
    );
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

module.exports = {
    projectStructureLoad: projectStructureLoad,
    projectArrangementLoad: projectArrangementLoad,
    loadArrangement: loadArrangement
};