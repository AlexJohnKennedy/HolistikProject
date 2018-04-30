//Gain access to express package so that we can edit the 'router' component of the application object.

const express = require('express');
const userDataController = require('../controllers/userDataController');

const router = express.Router();     //This will set the routing and response callbacks for the application requests


//Define 'GET' routes using the ROUTER rather than the APP object
//Define a handler for HTTP GET requests that come into the server, along any URL path. For now, we will
//define this such that we just send back a hello world message.
//
router.get('/', userDataController.homeDirectoryGet);

//Route for getting login page
router.get('/login', userDataController.loginPageGet)

//Route for going to the 'main' application page (the one where it functions as a one-screen app)
router.get('/main', userDataController.mainPageGet);


//Route for getting user names
router.get('/users', userDataController.generateUserList);

//Route for getting a specific user via id in URL
router.get('/users/:id', userDataController.userDetail);

//Route for the help page
router.get('/help', userDataController.helpPageGet);

//Route for the profile page
router.get('/profile', userDataController.profilePageGet);


//We also need to EXPORT the router object, so that the main application can access it and assign it to the app to use
//via app.use()
module.exports = router;
