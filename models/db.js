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
    let project = new Project.projectModel({
        //current structure and arrangement are required, so we just pass in the empty json structure
        currentStructure: {
            contentNodes: []
        },
        currentArrangement: {
            contextNodeId: null,
            nodeData: []
        },
        savedArrangements: [],
        image: "",
        name: projectData.projectName
    });

    //call its save function to push to mong
    project.save();

    //return its id
    return project._id;
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


module.exports = {
    createNewUser: createNewUser,
    createNewProject: createNewProject,
    getOneUserByEmail: getOneUserByEmail,
    getOneUserByUsername: getOneUserByUsername,
    getOneProjectById: getOneProjectById,
    getProjectsByIds: getProjectsByIds
};
