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
const PROJECT_STRUCTURE_LOAD_URL   = "/loadProjectStructure";
const PROJECT_ARRANGEMENT_LOAD_URL = "/loadProjectArrangement";
const LOAD_ARRANGEMENT_URL         = "/loadArrangement";

const PROJECT_STRUCTURE_SAVE_URL   = "/saveProjectStructure";
const PROJECT_ARRANGEMENT_SAVE_URL = "/saveProjectArrangement";
const SAVE_ARRANGEMENT_URL         = "/saveArrangement";

// ---------------------------------------------------------------------------------------------------------------------
// --- Http AJAX request wrapper object --------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Simple object constructor to create a wrapper object which handles making GET and POST XMLHttpRequests for AJAX
 * functionality.
 * @constructor
 */
function HttpClientWrapper() {

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
    };

    //Function to set a POST request to a specified URL, with a specified 'request body' string, with a specified handler
    //callback on response reception.
    //This particular function uses JSON as the 'content-type' declaration in the request header; so we must send JSON
    //as the message body
    this.sendJsonPostRequest = function(url, bodyString, callbackFunc) {
        let request = new XMLHttpRequest();

        //Define a callback for when the request state changes
        request.onreadystatechange = function() {
            if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                callbackFunc(request.responseText);
            }
            else if (request.readyState === XMLHttpRequest.DONE) {
                console.trace("POST REQUEST FAILED: URL was "+url+", RESPONSE CODE: "+request.status);
            }
        };

        //Specify the HTTP request details (HTTP Method, URL to send to, and Asynchronous flag = true)
        request.open("POST", url, true);

        //Specify the message header; indicate that the posted content is UTF 8 encoded JSON data.
        request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        //Send the request!
        request.send(bodyString);   //Send the bodyString in the POST message body.
    };
}

// ---------------------------------------------------------------------------------------------------------------------
// --- AJAX Request for saving and loading nodes -----------------------------------------------------------------------
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
        this.projectId = projectId;

        //Instantiate a http client wrapper object to help us send async AJAX requests.
        this.httpClient = new HttpClientWrapper();
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
        let structureJSON = null;
        let arrangementJSON = null;
        let pendingRequestCount = 2;

        this.httpClient.sendJsonPostRequest(PROJECT_STRUCTURE_LOAD_URL, JSON.stringify({ projectId: this.projectId }), function(response) {
            structureJSON = response;
            pendingRequestCount--;

            if (pendingRequestCount <= 0) {
                fullyRebuildCanvasStateFromJSON(structureJSON, arrangementJSON);
            }
        });

        this.httpClient.sendJsonPostRequest(PROJECT_ARRANGEMENT_LOAD_URL, JSON.stringify({ projectId: this.projectId }), function(response) {
            arrangementJSON = response;
            pendingRequestCount--;

            if (pendingRequestCount <= 0) {
                fullyRebuildCanvasStateFromJSON(structureJSON, arrangementJSON);
            }
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


        this.httpClient.sendJsonPostRequest(LOAD_ARRANGEMENT_URL, msgBody, function(response) {
            updateArrangementFromJSON(response, hideMissingNodes, animate, switchContext);
        });
    }
}