//Gain access to express package so that we can edit the 'router' component of the application object.

const express = require('express');
const userDataController = require('../controllers/userDataController');

const router = express.Router();     //This will set the routing and response callbacks for the application requests


// ---------------------------------------------------------------------------------------------------------------------
// --- Page GET request routing - for simply loading pages themselves --------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Define 'GET' routes using the ROUTER rather than the APP object
//Define a handler for HTTP GET requests that come into the server, along any URL path. For now, we will
//define this such that we just send back a hello world message.
//
router.get('/', userDataController.homeDirectoryGet);

//Route for going to the 'main' application page (the one where it functions as a one-screen app)
router.get('/main', userDataController.mainPageGet);

//Route for the help page
router.get('/help', userDataController.helpPageGet);


// ---------------------------------------------------------------------------------------------------------------------
// --- Server Data API routes - Defining routes for AJAX usage for saving/loading project data -------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Constant api routes that we will use. MUST MATCH THE CLIENT-SIDE ROUTES! (See 'clientAjaxRequests.js' file)
const PROJECT_STRUCTURE_LOAD_URL   = "/loadProjectStructure";
const PROJECT_ARRANGEMENT_LOAD_URL = "/loadProjectArrangement";
const LOAD_ARRANGEMENT_URL         = "/loadArrangement";

const PROJECT_STRUCTURE_SAVE_URL   = "/saveProjectStructure";
const PROJECT_ARRANGEMENT_SAVE_URL = "/saveProjectArrangement";
const SAVE_ARRANGEMENT_URL         = "/saveArrangement";

router.post(PROJECT_STRUCTURE_LOAD_URL,   userDataController.APIcontroller.projectStructureLoad);
router.post(PROJECT_ARRANGEMENT_LOAD_URL, userDataController.APIcontroller.projectArrangementLoad);
router.post(LOAD_ARRANGEMENT_URL,         userDataController.APIcontroller.loadArrangement);

//We also need to EXPORT the router object, so that the main application can access it and assign it to the app to use
//via app.use()
module.exports = router;
