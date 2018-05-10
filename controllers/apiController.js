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
passport.use(new LocalStrategy({
        //Specify what fields passport will look for as our login credientials from the associated HTTP request (the one attempting to login)
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done) {
        console.log(email + " " + password);
        //Get a corresponding user by the passed email.
        let databasePromise = db.getOneUserByEmail(email);

        //Okay, let's attach our handler callbacks to the promise
        databasePromise.then(function(user) {
            //Okay, we successfully got a result from the database.
            //console.log(user);

            //If the user account corresponding with the email did not exist:
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            //Okay, the user exists! Now we need to use bcrypt to compare the password with the hash!
            bcrypt.compare(password, user.hash).then(function(isMatch) {
                console.log("Finished bcrypt comparison, we are entering the callback");
                console.log("isMatch == "+isMatch);

                //If the crypto call succeeded this happens.
                if (isMatch) {
                    //Woo! the password matched after it was hashed with da salt!
                    return done(null, user);
                }
                else {
                    //Passwords did not match.
                    return done(null, false);
                }
            }).catch(function(err) {
                console.log("Entered error catch block, line 52, apiController.js!");
                return done(err, false);
            });

        }).catch(function(err) {
            console.log("Database error on login (not found)");
            //Catching database lookup error!
            return done(err);
        });
    }
));

//Setup the logic for how passport will serialise and deserialise user data from the session cookie info passed in
//requests, when it authenticates them!
passport.serializeUser(function(user, done) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Passport is calling the serialise method we specified!!");
    done(null, user.email);     //The only thing we want our session info to know about is the unique email identifier
});

passport.deserializeUser(function(email, done) {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Passport is calling the DEserialise method we specified!!");
    let databasePromise = db.getOneUserByEmail(email);
    databasePromise.then(function(user) {
        console.log("deserialisation success");
        done(null, user);   //Error object is null, because we succeeded!
    }).catch(function(err) {
        console.trace("deseiralistaion FAILURE");
        done(err);
    });
});

// ---------------------------------------------------------------------------------------------------------------------
// --- User registration and login establishment -----------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

async function registerNewUser(req, res) {
    console.log("Attempting to save a new user. req.body:");
    console.log(req.body);

    //Call the bcrypt library to hash our plaintext password and automatically create an asociated salt.
    //When that completes (asynchronously), we will ask the db to create a new user record
    bcrypt.hash(req.body.password, SALT_ROUNDS).then(async function(hashResult) {
        let newCreatedUser = await db.createNewUser(req.body, hashResult);

        //If we got an undefined result, then there was a database error!
        if (newCreatedUser === undefined) {
            res.status(500).send("Whoops! Looks like someone already took that username or email address. Please try again!");
        }
        else {
            //All good!
            //When the user registers, we should manually invoke a login with passport, so the user automatically becomes logged
            //in after registering!
            req.login(newCreatedUser, function(err) {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    //Redirect them to their projects page
                    res.redirect("/projects");
                }
            });
        }
    }).catch(function(err) {
        res.status(500).send("Bcrypt failed to fucking hash dat shit:\n"+err);
    });
}

function loginUser(req, res) {
    console.log("We reached the login user apiController callback! Based on how our /login route is configured, this will have already passed through" +
        " the 'passport.authenticate()' check! Passport.authenticate() should have parsed the user details into the req.user before reaching here");
    console.log("req.user: \n");
    console.log(req.user);

    res.send(req.user);
}

function logoutUser(req, res) {
    logRequestDetails("User requested to be logged out!", req);

    //Invoke passport method req.logout(). This will clear the session and thus log the user out.
    req.logout();
    res.redirect('/');
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Functions which will be invoked by the router. ------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

const NO_SESSION_ERR_MSG = "ERROR: Request has no session associated with it";
const AUTH_FAIL_ERR_MSG = "ERROR: Request session failed to authenticate";
const AUTH_SUCCESS_MSG = "Request session authenticated successfully";


async function projectLoad(req, res) {
    logRequestDetails("received request to load a currently existing project!", req);

    if (!isAuthenticatedRequest(req, NO_SESSION_ERR_MSG, AUTH_FAIL_ERR_MSG)) {
        //AUTH FAIL. Redirect to login page, for now
        //TODO - Work out better auth failure behaviour...
        return res.redirect("/");
    }

    //Get the project from the database and ask the database to make sure that this user has read permission for this project!
    let projectId = db.convertStringIdToIdObject(req.body.projectId);
    console.log("Server converted an id string from the client into mongoose.Types.ObjectID: result is " + projectId);

    let projectModel = await db.getOneProjectById(projectId);
    //If the result is undefined, then our database request failed (some backend error occurred)
    if (projectModel === undefined) {
        return res.status(500).send("ERROR: Database error on project lookup");
    }
    //If the result is NULL, then our lookup completed but the passed id did not match any documents in the database. SHOULD BE IMPOSSIBLE FOR CORRECT REQUESTS
    else if (projectModel == null) {
        return res.status(500).send("ERROR: Client passed a project id that returned no results in the database during save operation")
    }

    //Alright! We got the project object. Now, let's get the user document for this user as well, so we can check if the user has permission to save this project
    let userModel = await db.getOneUserByEmail(req.user.email);
    if (userModel === undefined) {

        return res.status(500).send("ERROR: Database error on user lookup");
    }
    else if (userModel == null) {
        //SHOULD BE IMPOSSIBLE UNLESS SOMETHING HAS GONE TERRIBLY WRONG
        console.trace("CRITICAL DATABASE ERROR: LOGGED IN USER HAD EMAIL NOT FOUND IN DATABASE!!");
        return res.status(500).send("CRITICAL DATABASE ERROR: LOGGED IN USER HAD EMAIL NOT FOUND IN DATABASE!!");
    }

    //Okay, let's make sure the user has the correct permissions for loading (read OR write)
    if (db.hasReadOrWritePermission(userModel, projectModel)) {
        //They have permission to save to this project! So, let's update the project model!
        let projectData = await db.getStructureAndArrangementFromProject(projectModel);
        if (projectData === undefined || projectData == null) {
            res.status(500).send("DATABASE ERROR: Failed to update project details");
        }
        else {
            //Success! Now, build the response body information from the DB returned data, and send if back to the client.
            console.log("SUCCESS: SENDING TO CLIENT:: "+projectData);
            res.send(projectData);
        }
    }
    else {
        //NO PERMISSION! throw an error!
        console.log("ERROR: User tried to load project but did not have read permission for it!");
        res.status(500).send("ERROR: Client user does not have write permission for this project");
    }

}

function loadArrangement(req, res) {

}

async function projectSave(req, res) {
    logRequestDetails("received request to save a currently existing project!", req);

    //Okay! we just got a save project request.
    //Firstly, we need to ensure that the user is logged in. If they are NOT, then there is some error, and we should do nothing!
    if (!isAuthenticatedRequest(req, NO_SESSION_ERR_MSG, AUTH_FAIL_ERR_MSG)) {
        //AUTH FAIL. Redirect to login page, for now
        //TODO - Work out better auth failure behaviour...
        return res.redirect("/");
    }

    //Get the project model object from the database, making sure to WAIT for the response before continuing
    let projectModel = await db.getOneProjectById(req.body.projectId);

    //If the result is undefined, then our database request failed (some backend error occurred)
    if (projectModel === undefined) {
        return res.status(500).send("ERROR: Database error on project lookup");
    }
    //If the result is NULL, then our lookup completed but the passed id did not match any documents in the database. SHOULD BE IMPOSSIBLE FOR CORRECT REQUESTS
    else if (projectModel == null) {
        return res.status(500).send("ERROR: Client passed a project id that returned no results in the database during save operation")
    }

    //Alright! We got the project object. Now, let's get the user document for this user as well, so we can check if the user has permission to save this project
    let userModel = await db.getOneUserByEmail(req.user.email);
    if (userModel === undefined) {
        return res.status(500).send("ERROR: Database error on user lookup");
    }
    else if (userModel == null) {
        //SHOULD BE IMPOSSIBLE UNLESS SOMETHING HAS GONE TERRIBLY WRONG
        console.trace("CRITICAL DATABASE ERROR: LOGGED IN USER HAD EMAIL NOT FOUND IN DATABASE!!");
        return res.status(500).send("CRITICAL DATABASE ERROR: LOGGED IN USER HAD EMAIL NOT FOUND IN DATABASE!!");
    }

    //Okay, let's make sure the user has the correct permissions.
    if (db.hasWritePermission(userModel, projectModel)) {
        //They have permission to save to this project! So, let's update the project model!
        let updatedProjectModel = await db.updateProject(projectModel, req.body.structure, req.body.arrangement, req.body.image);
        if (updatedProjectModel === undefined) {
            res.status(500).send("DATABASE ERROR: Failed to update project details");
        }
        else {
            //Success!
            res.send(updatedProjectModel);
        }
    }
    else {
        //NO PERMISSION! throw an error!
        console.log("ERROR: User tried to save project but did not have write permission for it!");
        res.status(500).send("ERROR: Client user does not have write permission for this project");
    }
}

function saveArrangement(req, res) {

}

async function projectCreate(req, res) {
    logRequestDetails("request received: Attempting to save a new project.", req);

    //authenticate
    if (!isAuthenticatedRequest(req, NO_SESSION_ERR_MSG, AUTH_FAIL_ERR_MSG)) {
        //AUTH FAIL. Redirect to login page, for now
        //TODO - Work out better auth failure behaviour...
        return res.redirect("/");
    }

    //user is authenticated! let's create a new project in the db
    let projectModel = await db.createNewProject(req.body);
    if (projectModel === undefined) {
        return res.status(500).send("Database error: failed to create a new project");
    }

    //we need to add the new project to the current users' list
    let user = await db.getOneUserByEmail(req.user.email);
    if (user === undefined) {
        return res.status(500).send("Database error: failed to get a user based on cookie data");
    }

    let updatedUser = await db.addProjectToUser(user, projectModel, true);
    if (updatedUser === undefined) {
        return res.status(500).send("Database error: failed to update user with new project");
    }

    //All succeeded!
    res.redirect("/profile");   //Refresh the page so that the new entry shows up
}

function projectEdit(req, res) {
    logRequestDetails("request received: Attempting to save a newly edited project.", req);

    //authenticate
    if (!isAuthenticatedRequest(req, NO_SESSION_ERR_MSG, AUTH_FAIL_ERR_MSG)) {
        //AUTH FAIL. Redirect to login page, for now
        //TODO - Work out better auth failure behaviour...
        return res.redirect("/");
    }

    //tell the db class to make the appropriate changes and save them remotely
    let project = db.updateProjectName(req.body.projectId, req.body.newName);
    if (project === null) {
        console.log("Project name update failed. Redirecting to home.");
        return res.redirect("/");
    }

    //All succeeded!
    res.redirect("/profile");   //Refresh the page so that the new entry shows up
}

async function projectDelete(req, res) {
    logRequestDetails("request received: Attempting to save a delete a project.", req);

    //authenticate
    if (!isAuthenticatedRequest(req, NO_SESSION_ERR_MSG, AUTH_FAIL_ERR_MSG)) {
        //AUTH FAIL. Redirect to login page, for now
        //TODO - Work out better auth failure behaviour...
        return res.redirect("/");
    }

    //delete in mong
    await db.deleteProject(req.body, req.user);

    //All succeeded!
    res.redirect("/profile");   //Refresh the page so that the new entry shows up
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Helper functions ------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * This function will automatically use passport module to check if the request has authorised session credentials attached
 * (send from browser cookie in the request)
 *
 * Invokes req.isAuthenticated() to determine authentication. This helper is essentially a wrapper function for this call,
 * except that it handles optional logging as well for debugging and so forth.
 *
 * @param req the express request object containing the request information. Needed we can authenticate it
 * @param noSessionMessage OPTIONAL: PASS NULL OR UNDEFINED FOR NO LOGGING
 * @param authenticationFailureMessage OPTIONAL: PASS NULL OR UNDEFINED FOR NO LOGGING
 * @param authenticationSuccessMessage OPTIONAL: PASS NULL OR UNDEFINED FOR NO LOGGING
 *
 * @return Boolean flag. Will return true if and only if the request object is authenticated correctly
 */
function isAuthenticatedRequest(req, noSessionMessage, authenticationFailureMessage, authenticationSuccessMessage) {
    if (!req.user) {
        //No session established...
        if (noSessionMessage) {
            console.trace(noSessionMessage);
        }
        return false;
    }
    else if (!req.isAuthenticated()) {
        //Session is not authenticated...
        if (authenticationFailureMessage) {
            console.trace(authenticationFailureMessage)
        }
        return false;
    }
    else {
        if (authenticationSuccessMessage) {
            console.log(authenticationSuccessMessage);
        }
        return true;
    }
}

//DEBUG HELPER
function logRequestDetails(message, req) {
    console.log(message);
    console.log("The user making the request is: ");
    console.log(req.user);
    console.log("The request body is: ");
    console.log(req.body);
}

module.exports = {
    projectLoad              : projectLoad,
    loadArrangement          : loadArrangement,

    projectSave              : projectSave,
    saveArrangement          : saveArrangement,

    projectCreate            : projectCreate,

    projectEdit              : projectEdit,

    projectDelete            : projectDelete,

    registerNewUser          : registerNewUser,
    loginUser                : loginUser,
    logoutUser               : logoutUser,

    passport                 : passport
};