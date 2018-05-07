//Gain access to express package so that we can edit the 'router' component of the application object.

const express = require('express');
const router = express.Router();     //This will set the routing and response callbacks for the application requests

const requestBodyParser = require('body-parser');   //Middleware used to parse HTTP request bodys. see https://expressjs.com/en/4x/api.html#req for example usage with express
router.use(requestBodyParser.json()); // for parsing application/json
router.use(requestBodyParser.urlencoded({ extended: true }));

const controller = require('../controllers/controller');


// ---------------------------------------------------------------------------------------------------------------------
// --- Page GET request routing - for simply loading pages themselves --------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Define 'GET' routes using the ROUTER rather than the APP object
//Define a handler for HTTP GET requests that come into the server, along any URL path. For now, we will
//define this such that we just send back a hello world message.
//
router.get('/', controller.homeDirectoryGet);

router.get('/signup', controller.signupPageGet);

//Route for going to the 'main' application page (the one where it functions as a one-screen app)
router.get('/main', controller.mainPageGet);

//Route for the help page
router.get('/help', controller.helpPageGet);

//Route for the profile page
router.get('/profile', controller.profilePageGet);

// ---------------------------------------------------------------------------------------------------------------------
// --- User information gathering api routes ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

const REGISTER_USER_URL            = "/register";
const LOGIN_URL                    = "/login";
const LOGOUT_URL                   = "/logout";

const GET_USER_PROJECTS_URL        = "/getprojectlist";

router.post(REGISTER_USER_URL, controller.apiController.registerNewUser);

router.post(LOGIN_URL, controller.apiController.passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }),
    controller.apiController.loginUser
);

router.get(LOGOUT_URL, controller.apiController.logoutUser);

// ---------------------------------------------------------------------------------------------------------------------
// --- Server Data API routes - Defining routes for AJAX usage for saving/loading project data -------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Constant api routes that we will use. MUST MATCH THE CLIENT-SIDE ROUTES! (See 'clientAjaxRequests.js' file)
const PROJECT_LOAD_URL             = "/loadProject";
const LOAD_ARRANGEMENT_URL         = "/loadArrangement";

const PROJECT_SAVE_URL             = "/saveProject";
const SAVE_ARRANGEMENT_URL         = "/saveArrangement";

const PROJECT_CREATE_URL           = "/createProject";

const PROJECT_DELETE_URL           = "/deleteProject";

router.post(PROJECT_LOAD_URL,     controller.apiController.projectLoad);
router.post(LOAD_ARRANGEMENT_URL, controller.apiController.loadArrangement);

router.post(PROJECT_SAVE_URL,     controller.apiController.projectSave);
router.post(SAVE_ARRANGEMENT_URL, controller.apiController.saveArrangement);

router.post(PROJECT_CREATE_URL,   controller.apiController.projectCreate);

router.post(PROJECT_DELETE_URL,   controller.apiController.projectDelete);

//We also need to EXPORT the router object, so that the main application can access it and assign it to the app to use
//via app.use()
module.exports = router;
