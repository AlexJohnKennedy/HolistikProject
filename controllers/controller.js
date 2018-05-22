//Use the 'importing' functionality of 'require' call to access our database
const db = require('../models/db.js');
const apiController = require('./apiController.js');


//In this controller file, we are going to define the 'functions' which generate the responses to certain requests.
//It is not up to the controller object to decide WHICH URLS activate which repsonses, that is the job of the router
//Here, we are simply defining the functions which pass data to views to be rendered, and the router will decide when to call each one


// ---------------------------------------------------------------------------------------------------------------------
// --- Canvas page / application page. For both logged in user's and guest users. --------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//For loading canvas when you are a logged in user. Should have parameters along with it!
function mainPageGet(req, res) {
    let username = null;

    if (req.user && req.isAuthenticated()) {
        //User failed to authenticate! Redirect to the login screen
        username = req.user.username;
    }

    res.render('pages/mindMapPage', { username: username });
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Landing page and login screen page ------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Define behaviour for the home directory
function homeDirectoryGet(req, res) {
    let username = null;

    if (req.user && req.isAuthenticated()) {
        //User failed to authenticate! Redirect to the login screen
        username = req.user.username;
    }

    res.render('pages/landingPage', {
        path : "/",
        username: username  //If there is a session, this will not be null, and EJS will behave differently.
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Help page -------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function helpPageGet(req, res) {
    let username = null;
    //If the user is logged in, then we can supply the username
    if (req.user) {
        username = req.user.username
    }
    res.render('pages/helpPage', { username: username});
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Project page (display a logged in user's projects) --------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

async function projectsPageGet(req,res) {
    console.log("--- Rendering the profile page! ---");
    console.log("NOTE: if the user is not currently logged in, then the passport authorisation will have failed and re-directed them back to the landing page");
    console.log("The currently logged in user is:");
    console.log(req.user);

    if (req.user == null || !req.isAuthenticated()) {
        //Oops! the user is not logged in. Redirect them to the landing page so that they can log in and set up a session
        return res.redirect("/");   //return, so that we only reply once.
    }
    //If we made it here, then all is well, and the user is logged in! Thus, we need to gather the project data for this
    //user from the database, and pass it back to the profile page for rendering and client storage!

    //Access the list of project elements according to the schema, from the User record.
    let projectAssociations = req.user.projects;    //SEE USER SCHEMA FOR STRUCTURE.

    //Split these associations into write permission projects, and read permission projects
    let writePermIds = [];
    let readPermIds  = [];
    for (let proj of projectAssociations) {
        if (proj.writePermission) {
            writePermIds.push(proj.projectId);
        }
        else {
            readPermIds.push(proj.projectId);
        }
    }

    //Define the data object the EJS renderer will receive when it renders the page.
    let dataToClient = {
        username: req.user.username,
        writeProjects: [],      //Will become array of project data objects, if the user has them
        readOnlyProjects: [],   //Will become array of project data objects, if the user has them
    };

    //For id lists which are not empty, make database requests to gather project information
    if (writePermIds.length) {
        let queryResult = await db.getProjectsByIds(writePermIds);
        if (queryResult === undefined) {
            return res.send("Error loading projects for this user. Try again later :(");
        }

        //If we got here, then we found a list of projects to build from!
        console.log("Successfully got some write-permission project records for this user! user owns "+queryResult.length+" projects with write permission");
        extractProjectInfoForProfilePageIcons(queryResult, dataToClient.writeProjects);
    }
    if (readPermIds.length) {
        let queryResult = await db.getProjectsByIds(readPermIds);
        if (queryResult === undefined) {
            return res.send("Error loading projects for this user. Try again later :(");
        }

        //If we got here, then we found a list of projects to build from!
        console.log("Successfully got some read-permission project records for this user! user owns "+queryResult.length+" projects with read permission");
        extractProjectInfoForProfilePageIcons(queryResult, dataToClient.readOnlyProjects);
    }

    //Okay, we have built up our data! Let's tell the client to render the profile page with the data we gathered.
    console.log(dataToClient);
    res.render('pages/projectsPage', dataToClient);
}
//Helper
function extractProjectInfoForProfilePageIcons(queryResults, arrayToPushTo) {
    //The query results should be an iterable list of documents
    for (let i=0; i<queryResults.length; i++) {
        arrayToPushTo.push({
            projectId: queryResults[i]._id,
            projectName: queryResults[i].name,
            projectImage: (queryResults[i].image != null && queryResults[i].image !== undefined) ? queryResults[i].image : null
        });
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Sign up page ----------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function signupPageGet(req,res) {
    res.render('pages/signupPage');
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Dynamically generated document page - renders a custom document based on a particular project layout ------------
// ---------------------------------------------------------------------------------------------------------------------

//For the sake of developing the front end templating for this feature for now i am sending a dummy data object!

//Define the data object 'types' which get sent to the front end with contructor functions
function NodeData(idString, titleText, descriptionText, relationshipToParentLabel) {
    this.isLink = false;    //This object contains ACTUAL DATA: we need to inform the rendering engine of this!

    this.idString = idString;
    this.titleText = titleText;
    this.descriptionText = descriptionText;
    this.relationshipToParentLabel = relationshipToParentLabel;

    //Set up inner collections so that can be added to.
    this.imageAttachments = [];
    this.semanticRelationships = [];
    this.children = [];     //Will contain an array of NodeData and NodeLink objects!
}

//Define a type for children entries which, instead of the actual node information, contain a link to the section of the document where the node data
//has already (presumably earlier) appeared.
function NodeLink(idString, titleText, relationshipToParentLabel, linkObject) {
    this.isLink = true;

    this.idString = idString;
    this.titleText = titleText;
    this.relationshipToParentLabel = relationshipToParentLabel;

    this.link = linkObject;
}

//Simple type which contains the information necessary to hyper-link to another part of the document.
function LinkToDocumentSection(name, nodeIdString) {
    this.name = name;
    this.nodeIdString = nodeIdString;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//Define Dummy data for document generation.
let milNode1 = new NodeData('contentNode2', "Command structure", "STATISTICS AND THE LIKE WHAT IDK MY BRAIN is ded :PPP", "has");
let milNode2 = new NodeData('contentNode3', "Noble Ranks", "FUCK YOU", "has");
let milNode3 = new NodeData('contentNode4', "Pleb ranks", "STATISTICS AND THE LIKE WHAT IDK MY BRAIN is ded :PPP", "Supersedes");
let milNode6 = new NodeData('contentNode4', "General", "Allocated overall command of a number of legions by the Roman Senate, for a specified time. This is the main commander of the army", "Supersedes");
let milNode4 = new NodeData('contentNode5', "Legate", "STATISTICS AND THE LIKE WHAT IDK MY BRAIN is ded :PPP", "Commands an entire legion");
let milNode5 = new NodeData('contentNode6', "Prefect Centurion", "Highest pleb rank - the mst experienced commander of all teh cohorts", "organised by");

milNode1.children = [milNode6, milNode4];
milNode2.children = [milNode3, new NodeLink(milNode6.idString, milNode6.titleText, "highest rank", new LinkToDocumentSection("", milNode6.idString)),
                                  new NodeLink(milNode4.idString, milNode4.titleText, "commands a legion", new LinkToDocumentSection("", milNode4.idString))];
milNode2.semanticRelationships = [new LinkToDocumentSection("Remains distinct from", milNode3.idString)];

milNode3.children = [milNode5];
milNode3.semanticRelationships = [new LinkToDocumentSection("Remains distinct from", milNode2.idString)];

let polNode1 = new NodeData('contentNode7', "Politics yo", "This was a thing even in the old ancient civilisations. BTW, i'm going to type a heap of random description text right now so that the front end testing has an example of longer text blocks being generated in the document.", "governed with:");
polNode1.children = [new NodeLink(milNode6.idString, milNode6.titleText, "Appoints power to", new LinkToDocumentSection("", milNode6.idString))]

let dummyDocumentData = {
    username: "DEVELOPMENT",
    projectName: "Ancient Empires",
    contextNode: new NodeData('contentNode1', "The Roman Empire", "This was a very large civilisation and shit my boy. No seriously, this shit was a big deal", null),
    relationshipCategories: [{
        name: "Military organisation",
        rootNodes: [milNode1, milNode2]
    }, {
        name: "Political organisation",
        rootNodes: [polNode1]
    }]
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function documentGenerationPage(req, res) {
    //FOR NOW SENDING DUMMY DATA WITH NO AUTHENTICATION, FOR DEVELOPMENT PURPOSES!!
    res.render('pages/generatedDocumentPage', dummyDocumentData);
}


// ---------------------------------------------------------------------------------------------------------------------
// --- DEPRECATED USER LIST - STILL HERE FOR REFERENCE -----------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Define behaviour and access data to get specific user page
function userDetail(req, res) {
    //-------------------------------------------------------------------------------------------------------------------------------
    //What we will do here is RENDER (using the res.render method) a template page, which will generate HTML with dynamically placed
    //values throughout it as specified in the template.

    //So, what we need to do form here is PASS the appropriate information to the template, so that it can be rendered.
    //From the JS routing, (controller) we access the data (model) and decide what information we want. Then we pass that data to the
    //VIEW (view) for rendering!

    //Ok, so let's use the 'id' passed in the URL string to determine which user we want to access. Then, access that information,
    //package it up, and pass it to the view-rendering engine along with specifying which template file to render!
    //-------------------------------------------------------------------------------------------------------------------------------

    //First, let's access and define the data object we are going to pass in. It will simply be a single object containing data for one user.
    //The REQUEST object stores information relating to the HTTP GET request, and thus, will allow us to access the values passed in the URL
    //Using the :value syntax in the get request url, we can access it under req.params.value - This is where Express places this info.
    if (req.params.id >= db.users.length) {
        res.send("You have run out of users!");
    }
    else if (req.params.id < 0) {
        res.send("Invalid user id passed in URL m8");
    }
    let user = db.users[req.params.id];

    //Now we can simply pass this information to the EJS template renderer
    //Note that the second parameter is an OBJECT
    res.render('userTemplate', {
        user : user,
        id : req.params.id,
        nextid : parseInt(req.params.id)+1,
        previd : req.params.id - 1,
        maxid : db.users.length - 1,
        path : "/users/"
    });
}


// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//Now, we have to export our functions so that the router can use them as callbacks
module.exports = {
    homeDirectoryGet : homeDirectoryGet,
    userDetail : userDetail,
    mainPageGet : mainPageGet,
    helpPageGet : helpPageGet,
    profilePageGet: projectsPageGet,
    signupPageGet : signupPageGet,
    documentGenerationPage : documentGenerationPage,

    apiController : apiController
};