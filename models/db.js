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

function getOneUserByEmail(email) {
    //Perform a database lookup based on email, and return the promise object which mongoose creates. The invoker of this
    //function can therefor attach callbacks to the promise to handle the various cases, and we do not have to worry about that!
    return User.userModel.findOne({email: email});
}
function getOneUserByUsername(username) {

}


module.exports = {
    createNewUser: createNewUser,
    getOneUserByEmail: getOneUserByEmail,
    getOneUserByUsername: getOneUserByUsername
};
