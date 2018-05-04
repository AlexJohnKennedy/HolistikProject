/**
 * This file encapsulates AJAX functionality in the browser.
 *
 * In other words, all of the client-side HTTP requests that the app will need to send to the server to get/post data
 * are defined here, as methods of some AJAX-handling object prototype.
 *
 * Note that each request method will correspond to a route set by the server's API. (See 'routes' folder in the project
 * directory).
 */

//Constant api routes that we will use. MUST MATCH THE SERVER-SPECIFIED ROUTES! (See 'routes' folder in the project dir)
const PROJECT_LOAD_URL             = "/loadProject";
const LOAD_ARRANGEMENT_URL         = "/loadArrangement";

const PROJECT_SAVE_URL             = "/saveProject";
const SAVE_ARRANGEMENT_URL         = "/saveArrangement";
const PROJECT_CREATE_URL           = "/createProject";

const REGISTER_USER_URL            = "/register";
const LOGIN_URL                    = "/login";
const LOGOUT_URL                   = "/logout";

// ---------------------------------------------------------------------------------------------------------------------
// --- Http AJAX request wrapper object --------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Simple object constructor to create a wrapper object which handles making GET and POST XMLHttpRequests for AJAX
 * functionality.
 * @constructor
 */
function HttpClientWrapper() {

    this.pendingPostRequests = [];

    this.cancelPendingPostRequests = function() {
        console.log(" >-----> Cancelling pending POST requests! <-----<");
        for (let i = this.pendingPostRequests.length - 1; i >= 0; i--) {
            this.pendingPostRequests[i].abort();    //Cancel the request!
        }
    };

    //Function to send a GET request to a specified URL, with a specified handler callback on response reception.
    this.sendGetRequest = function(url, callbackFunc) {
        let request = new XMLHttpRequest();   //Uses browser built in AJAX request functionality
        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                callbackFunc(request.responseText);
            }
        };

        //Specify the HTTP request details (HTTP Method, URL to send to, and Asynchronous flag = true)
        request.open("GET", url, true);

        //Send the request!
        request.send();   //GET body is empty, all info is just in the URL

        return request;
    };

    //Function to set a POST request to a specified URL, with a specified 'request body' string, with a specified handler
    //callback on response reception.
    //This particular function uses JSON as the 'content-type' declaration in the request header; so we must send JSON
    //as the message body
    this.sendJsonPostRequest = function(url, bodyString, httpClientWrapperObj, callbackFunc) {
        let request = new XMLHttpRequest();

        //Define a callback for when the request state changes
        request.onreadystatechange = function() {
            if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                callbackFunc(request.responseText, request);
            }
            else if (request.readyState === XMLHttpRequest.DONE && request.status === 500) {
                handleServerSideError(request.responseText, request);
            }
            else if (request.readyState === XMLHttpRequest.DONE && request.status === 302) {
                //Redirection status code. We should redirect to the landing page
                window.redirect.href = "/";
            }

            if (request.readyState === XMLHttpRequest.DONE) {
                console.trace("POST REQUEST COMPLETED OR CANCELLED: URL was "+url+", RESPONSE CODE: "+request.status);

                //remove this request from the pending list, as it just finished yo!
                let index = httpClientWrapperObj.pendingPostRequests.indexOf(request);
                if (index !== -1) {
                    httpClientWrapperObj.pendingPostRequests.splice(index, 1);
                }
            }
        };

        //Specify the HTTP request details (HTTP Method, URL to send to, and Asynchronous flag = true)
        request.open("POST", url, true);

        //Specify the message header; indicate that the posted content is UTF 8 encoded JSON data.
        request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        //Send the request!
        request.send(bodyString);   //Send the bodyString in the POST message body.

        this.pendingPostRequests.push(request); //Add this here so cancelling works

        //Return the request object so that we can abort it if we need to, and so forth
        return request;
    };
}

// ---------------------------------------------------------------------------------------------------------------------
// --- AJAX Request for saving and loading project information ---------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Define a ES6 'Class'. When the application page is loaded, it will be associated with a given project.
 * On loading, the server will pass in the database id of the project. The browser window will store that id and use it to
 * send project-specific AJAX requests to save and load node content when required.
 *
 * This syntactic-sugar-'class' specifies an object prototype which will encapsulate AJAX request functionality for a
 * given project.
 */
class AjaxProjectLoader {

    //Constructor. All we need to pass in to any instantiated project loader object is the project id which we will use
    //to tell the server which project we are loading/saving to/from
    constructor(projectId) {
        //In the browser, the id object is represented as A STRING. The server side code will handle converting the
        //String back into the appropriate database _id object, whatever that may be. from the browser's perspective, we
        //are just going to send it off!
        this.projectId = projectId;

        //Instantiate a http client wrapper object to help us send async AJAX requests.
        this.httpClient = new HttpClientWrapper();
        this.loadingHttpClient = new HttpClientWrapper();
    }

    // --- Methods --------------------------------------------------------------------

    /**
     * Used to FULLY load a project from the server. Usually this should probably only be called when the page first
     * loads, if the user was loading an existing project.
     *
     * Makes simple 'load structure' and 'load arrangement' requests and then re-builds the project from scratch when
     * the server returns both of the resulting JSON.
     */
    loadProjectFromServer() {

        addBlackoutEffect();    //Block user input while the request is being processed.
        showLoadingWindow();

        this.loadingHttpClient.sendJsonPostRequest(PROJECT_LOAD_URL, JSON.stringify({ projectId: this.projectId }), this.loadingHttpClient, function(response, res) {
            console.log(res);

            let responseObject = null;

            try {
                responseObject = JSON.parse(response);
            }
            catch(e) {
                //ERROR!
                handleServerSideError("Something went wrong when trying to load a project.. You might not be logged in! Try returning to the home page and logging in");
                return;
            }
            //Sanity catch, in case something went wrong
            if (responseObject === undefined || responseObject == null) {
                //ERROR!
                handleServerSideError("Something went wrong when trying to load a project.. You might not be logged in! Try returning to the home page and logging in");
                return;
            }

            //TODO -- stop client from wasting fuck loads of effort re-stringifying everything...
            let structureJSON   = JSON.stringify(responseObject.structure.contentNodes);
            let arrangementJSON = JSON.stringify(responseObject.arrangement);

            fullyRebuildCanvasStateFromJSON(structureJSON, arrangementJSON);

            removeBlackoutEffect();
            hideLoadingWindow();
            canvasState.projectLoaded = true;   //Set this flag to true. This way, we will allow saving since we know the original project was loaded first!
        });
    }

    /**
     * Used to update the current project nodes with a pre-saved arrangement from the server.
     *
     * Usually, this request will follow from the server sending us a set of available options with associated ids,
     * and the user choosing one of them.
     *
     * @param arrangementId the server-side id of the arrangement we want, with respect to the current project
     * @param hideMissingNodes flag: if true, nodes missing from the saved arrangement data will be set to invisible
     * @param animate flag: if true, current nodes will animate when they move to the new arrangement
     * @param switchContext flag: if true, we will let the arrangement data change the current context node
     */
    loadSavedArrangementFromServer(arrangementId, hideMissingNodes, animate, switchContext) {
        let msgBody = JSON.stringify({ projectId: this.projectId, arrangementId: arrangementId });

        this.httpClient.sendJsonPostRequest(LOAD_ARRANGEMENT_URL, msgBody, this.httpClient, function(response) {
            updateArrangementFromJSON(response, hideMissingNodes, animate, switchContext);
        });
    }

    /**
     * Issues a full save of the current state, structure and arrangement for this project.
     *
     * This sends data to the server, and will fully replace what is returned when 'load project to server' is called
     */
    saveProjectToServer() {
        //If the project has never been loaded, we should not allow us to save over the current project!
        if (!canvasState.projectLoaded) {
            console.trace("ERROR: Attempted to save to project "+this.projectId+" but this project was never loaded first!");
            return;
        }

        let requestBody = '{ "projectId": "' + this.projectId + '", "structure": '+serialiseNodeState()+', "arrangement": '+serialiseNodeArrangement()+' }';

        this.httpClient.sendJsonPostRequest(PROJECT_SAVE_URL, requestBody, this.httpClient, function(response) {
            console.log("Got response from server after saving project:");
            console.log(response);
        });
    }

    /**
     * Issue a request to create a new project for the currently logged in user, with the specified project name (string)
     * @param projectName String to specifcy what the name of the new user should be called!
     */
    createNewProject(projectName) {
        let requestBody = '{ "projectName": '+projectName+ ' }';     //All this sends is the name of the new project. The user association is handled by req.user

        this.httpClient.sendJsonPostRequest(PROJECT_CREATE_URL, requestBody, this.httpClient, function(response) {
            console.log("Got response from server after creating a new project with name: "+projectName);
            console.log(response);
        });
    }

    cancelPendingLoadRequests() {
        this.loadingHttpClient.cancelPendingPostRequests();
        removeBlackoutEffect();
        hideLoadingWindow();
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Ajax request handler class for sending user registration and user login data ------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Define an ES6 class to handle sending user login data and new-user registration data. This will be sent to the server
 * and the server will handle generating session cookies and so forth.
 *
 * Note: After being authenticated, the client browser will recieve cookie info for sessions which will automatically
 * be sent by the browser in subsequent HTTP reuqests to the same domain. We do not have to handle session logic
 * on the front-end, only the back end!
 */
class AjaxUserDataSender {

    constructor() {
        this.httpClient = new HttpClientWrapper();
    }

    /**
     * Sends a user-entered email and password string to the server, in an attempt to log the user in and establish an
     * authenticated login session on this browser. If successful, the server will send back a response with
     * 'set-cookie' in the header, which should automatically make our browser save the cookie data containing our
     * session information. All we need to do here is literally just POST our strings to the correct URL!
     * @param email
     * @param password
     */
    sendLoginRequest(email, password) {
        this.httpClient.sendJsonPostRequest(LOGIN_URL, JSON.stringify({email: email, password: password}), this.httpClient, function(response) {
            console.log("Got response from server after sending login request!");
            console.log(response);
        });
    }

    registerNewUserRequest(username, email, password, bio) {
        this.httpClient.sendJsonPostRequest(REGISTER_USER_URL, JSON.stringify({username: username, email: email, password: password, bio: bio}), this.httpClient, function(response) {
            console.log("Got response from server after sending a register a new user request");
            console.log(response);
        });
    }

    logoutRequest() {
        this.httpClient.sendJsonPostRequest(LOGOUT_URL, JSON.stringify({}), this.httpClient, function(response) {
           console.log("got a logout request response from the server:");
           console.log(response);
        });
    }
}

function handleServerSideError(responseText, request) {
    //This function should cancel all pending requests, and remove the loading screen, and display an error message
    ajaxHandler.cancelPendingLoadRequests();

    addBlackoutEffect();
    showErrorWindow("Whoops! Something went wrong.. Try again in a few minutes. "+responseText);
}