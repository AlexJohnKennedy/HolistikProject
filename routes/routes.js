//Gain access to express package so that we can edit the 'router' component of the application object.

const express = require('express');
const router = express.Router();     //This will set the routing and response callbacks for the application requests

const requestBodyParser = require('body-parser');   //Middleware used to parse HTTP request bodys. see https://expressjs.com/en/4x/api.html#req for example usage with express
router.use(requestBodyParser.json()); // for parsing application/json

const controller = require('../controllers/controller');


// ---------------------------------------------------------------------------------------------------------------------
// --- Page GET request routing - for simply loading pages themselves --------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Define 'GET' routes using the ROUTER rather than the APP object
//Define a handler for HTTP GET requests that come into the server, along any URL path. For now, we will
//define this such that we just send back a hello world message.
//
router.get('/', controller.homeDirectoryGet);

//Route for getting login page
router.get('/login', controller.loginPageGet)

//Route for going to the 'main' application page (the one where it functions as a one-screen app)
router.get('/main', controller.mainPageGet);

//Route for the help page
router.get('/help', controller.helpPageGet);

//Route for the profile page
router.get('/profile', controller.profilePageGet);

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

const SIGN_UP_URL                  = "/saveNewUser";
const LOG_IN_URL                   = "/logInUser";

router.post(PROJECT_STRUCTURE_LOAD_URL,   controller.apiController.projectStructureLoad);
router.post(PROJECT_ARRANGEMENT_LOAD_URL, controller.apiController.projectArrangementLoad);
router.post(LOAD_ARRANGEMENT_URL,         controller.apiController.loadArrangement);

router.post(PROJECT_STRUCTURE_SAVE_URL,   controller.apiController.projectStructureSave);
router.post(PROJECT_ARRANGEMENT_SAVE_URL, controller.apiController.projectArrangementSave);
router.post(SAVE_ARRANGEMENT_URL,         controller.apiController.saveArrangement);

router.post(SIGN_UP_URL,                  controller.apiController.saveNewUser);
router.post(LOG_IN_URL,                   controller.apiController.logInUser);

//We also need to EXPORT the router object, so that the main application can access it and assign it to the app to use
//via app.use()
module.exports = router;
