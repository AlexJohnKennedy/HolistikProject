//Include Mongoose and open a connection to our database
const mongoose = require('mongoose');
const Project = require('./Project.js');
const User = require('../models/User.js');


//database user credentials
const username = "Jaiden";
const password = "meme";


// ---------------------------------------------------------------------------------------------------------------------
// --- Connect to the mongoDB Database ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

mongoose.connect('mongodb://'+username+':'+password+'@ds061474.mlab.com:61474/holistik-prod', function(err) {
    if (err) {
        console.log("Error connecting to mLab.");
    } else {
        console.log("Successfully connect to mLab.");
    }
});

// ---------------------------------------------------------------------------------------------------------------------
// --- Database operations ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function createNewUser(userData, pwHash) {
    //construct model from the json body, note that the hash and salt fields need to be updated
    let user = new User.userModel({
        username: userData.username,
        email:    userData.email,
        bio:      userData.bio,
        image:    undefined,
        hash:     pwHash,
        projects: []
    });

    return user.save();
}

function createNewProject(projectData) {
    //build new model from JSON
    let structure = new Project.structureModel({
        contentNodes: []
    });
    let arrangement = new Project.arrangementModel({
        contextNodeId: null,
        nodeData: []
    });
    let project = new Project.projectModel({
        //current structure and arrangement are required, so we just pass in the empty json structure
        currentStructure: null,     //Will be set later in this function, inside the callbacks
        currentArrangement: null,
        savedArrangements: [],
        image: "",
        name: projectData.projectName
    });


    //Save the empty models to the database
    return structure.save().then(function(savedStructure) {
        console.log("New empty structure was saved to the database " + savedStructure);
        //If we got here, the structure is saved.
        return arrangement.save();
    }).then(function(savedArrangement) {
        console.log("New empty arrangement was saved to the database " + savedArrangement);
        //If we got here, the arrangement is saved.

        //Since both the blocks exist, we can plus their _ids into the project model
        project.currentStructure   = structure._id;
        project.currentArrangement = arrangement._id;

        //Okay, the project data is setup, so we can save that to the DB as well!
        return project.save();  //return the promise once again to allow exterior chaining rahter than cancer
    }).then(function(savedProject) {
        //return the final saved project document
        return savedProject;
    }).catch(function(err) {
        console.log("Database error: during new project creation: "+err);
    });
}

function getOneUserByEmail(email) {
    //Perform a database lookup based on email, and return the promise object which mongoose creates. The invoker of this
    //function can therefor attach callbacks to the promise to handle the various cases, and we do not have to worry about that!
    return User.userModel.findOne({email: email});
}
function getOneUserByUsername(username) {
    //Perform a database lookup based on email, and return the promise object which mongoose creates. The invoker of this
    //function can therefor attach callbacks to the promise to handle the various cases, and we do not have to worry about that!
    return User.userModel.findOne({username: username});
}

function getOneProjectById(id) {
    //Perform a database lookup based on email, and return the promise object which mongoose creates. The invoker of this
    //function can therefor attach callbacks to the promise to handle the various cases, and we do not have to worry about that!
    return Project.projectModel.findById(id);
}

function getProjectsByIds(arrayOfIds) {
    //Perform a database lookup based on email, and return the promise object which mongoose creates. The invoker of this
    //function can therefor attach callbacks to the promise to handle the various cases, and we do not have to worry about that!

    return Project.projectModel.find({ /* match all project documents in collection */ }).where('_id').in(arrayOfIds);  //Return Query promise
}

function updateProject(projectModel, structure, arrangement) {
    //Get all the structures and arrangements and shit
    let toRet = Project.structureModel.findById(projectModel.currentStructure).then(function(structureDoc) {
        structureDoc.contentNodes = structure.contentNodes;     //Overwrite entire structure

        //Ok, save the document and return the promise from that, so we can continue chaining promise callbacks
        return structureDoc.save();
    }).then(function(result) {
        //We should have received the result of the save
        //Now, do the same operation for arrangement as well
        return Project.arrangementModel.findById(projectModel.currentArrangement);
    }).then(function(arrangementDoc) {
        arrangementDoc.contextNodeId = arrangement.contextNodeId;
        arrangementDoc.nodeData      = arrangement.nodeData;

        return arrangementDoc.save();
    }).then(function(arrangementSaveResult) {
        console.log("db.updateProject() - All save operations succeeded!");
        //Everything passed! let's return the updated arrangement data
        return arrangementSaveResult;
    }).catch(function(err) {
        console.log("Database error when updating project in updateProject method "+err);
        return err;
    });

    console.log("PROMISE TESTING: The type of 'toRet' in db.updateProject() is "+typeof(toRet));
    return toRet;
}

module.exports = {
    createNewUser: createNewUser,
    createNewProject: createNewProject,
    getOneUserByEmail: getOneUserByEmail,
    getOneUserByUsername: getOneUserByUsername,
    getOneProjectById: getOneProjectById,
    getProjectsByIds: getProjectsByIds,
    updateProject: updateProject
};
