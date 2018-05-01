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

module.exports = {
    createNewUser: createNewUser
};
