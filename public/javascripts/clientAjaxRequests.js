/**
 * This file encapsulates AJAX functionality in the browser.
 *
 * In other words, all of the client-side HTTP requests that the app will need to send to the server to get/post data
 * are defined here, as methods of some AJAX-handling object prototype.
 *
 * Note that each request method will correspond to a route set by the server's API. (See 'routes' folder in the project
 * directory).
 */


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

        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                callbackFunc(request.responseText);
            }
        };

        //Specify the HTTP request details (HTTP Method, URL to send to, and Asynchronous flag = true)
        request.open("POST", url, true);

        //Specify the message header; indicate that the posted content is UTF 8 encoded JSON data.
        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        //Send the request!
        request.send(bodyString);   //Send the bodyString in the POST message body.
    };
}