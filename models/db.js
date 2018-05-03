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

    return user.save().then(function(savedUser) {
        console.log("New user entry was saved successfully! "+savedUser);
        return savedUser;
    }).catch(function(err) {
        console.log("DATABASE ERROR: Failed to create a new user: "+err);
        return undefined;
    });
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
        return undefined;
    });
}

/*
The functions below are asynchronous - the mongoose function call returns a promise object which is handled here in the
db file. This is to allow us to use of them as if they were synchronous using the "await" command.
 */
function getOneUserByEmail(email) {
    return User.userModel.findOne({email: email}).then(function(user) {
        //async db call finished, return whatever we got back!
        return user;
    }).catch(function(err) {
        console.log("Error trying to get one user by email from MongoDB: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
function getOneUserByUsername(username) {
    return User.userModel.findOne({username: username}).then(function(user) {
        //async db call finished, return whatever we got back!
        return user;
    }).catch(function(err) {
        console.log("Error trying to get one user by username from MongoDB: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
function getOneProjectById(id) {
    return Project.projectModel.findById(id).then(function(project) {
        //async db call finished, return whatever we got back!
        return project;
    }).catch(function(err) {
        console.log("Error trying to get one project by id from MongoDB: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
function getProjectsByIds(arrayOfIds) {
    return Project.projectModel.find({ /* match all project documents in collection */ }).where('_id').in(arrayOfIds).then(function(projects) {
       //async db query finished, return the projects we found! (iterable list)
       return projects;
    }).catch(function(err) {
        console.log("Error trying to retrieve projects by Ids from MongoDB: IDS WERE QUERIED WITH: "+arrayOfIds);
        console.log(err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}

function updateProject(projectModel, structure, arrangement) {
    //Get all the structures and arrangements and shit
    return Project.structureModel.findById(projectModel.currentStructure).then(function(structureDoc) {
        console.log("db.updateProject() - Structure was retrieved from the database, the original document is: ");
        console.log(structureDoc);

        structureDoc.contentNodes = structure;     //Overwrite entire structure

        //Ok, save the document and return the promise from that, so we can continue chaining promise callbacks
        return structureDoc.save();
    }).then(function(result) {
        console.log("db.updateProject() - Structure was saved to the database, the resulting document is: ");
        console.log(result);
        //We should have received the result of the save
        //Now, do the same operation for arrangement as well
        return Project.arrangementModel.findById(projectModel.currentArrangement);
    }).then(function(arrangementDoc) {
        console.log("db.updateProject() - Arrangement was retrieved from the database, the original document is: ");
        console.log(arrangementDoc);

        arrangementDoc.contextNodeId = arrangement.contextNodeId;
        arrangementDoc.nodeData      = arrangement.nodeData;

        return arrangementDoc.save();
    }).then(function(arrangementSaveResult) {
        console.log("db.updateProject() - Arrangement was saved to the database, the resulting document is: ");
        console.log(arrangementSaveResult);

        console.log("db.updateProject() - All save operations succeeded!");
        //Everything passed! let's return the updated arrangement data
        return arrangementSaveResult;
    }).catch(function(err) {
        console.log("Database error when updating project in updateProject method "+err);
        return err;
    });
}

function addProjectToUser(user, projectModel, writePermission) {
    user.projects.push({ writePermission: writePermission, projectId: projectModel._id });

    //Return result of the promise chain callbacks
    return user.save().then(function(savedUser) {
        console.log("User with newly pushed project field was saved to the database! \n"+savedUser);
        return savedUser;
    }).catch(function(err) {
        console.log("ERROR: database error when saving newly updated user: "+err);
        return undefined;
    });
}

//helper
function hasWritePermission(userModel, projectModel) {
    console.log("========>>> CHECKING FOR WRITE PERMISSION <<<========");
    console.log("========>>> USER MODEL:                   <<<========");
    console.log(userModel);
    console.log("========>>> PROJECT MODEL:                <<<========");
    console.log(projectModel);

    let pid = projectModel._id;
    for (let obj of userModel.projects) {
        console.log("========>>> CHECKING ...                  <<<========");
        console.log(obj);
        console.log(pid);
        //NOTE: To compare mongoDB _id objects, we need to use the .equals() method which is built into the mongo driver
        if (obj.writePermission && obj.projectId.equals(pid)) {
            return true;
        }
    }
    return false;
}

function hasReadOrWritePermission(userModel, projectModel) {
    let pid = projectModel._id;
    for (let obj of userModel.projects) {
        //NOTE: To compare mongoDB _id objects, we need to use the .equals() method which is built into the mongo driver
        if (obj.projectId.equals(pid)) {
            return true;
        }
    }
    return false;
}

function hasReadOnlyPermission(userModel, projectModel) {
    let pid = projectModel._id;
    for (let obj of userModel.projects) {
        //NOTE: To compare mongoDB _id objects, we need to use the .equals() method which is built into the mongo driver
        if (!obj.writePermission && obj.projectId.equals(pid)) {
            return true;
        }
    }
    return false;
}

module.exports = {
    createNewUser: createNewUser,
    createNewProject: createNewProject,
    getOneUserByEmail: getOneUserByEmail,
    getOneUserByUsername: getOneUserByUsername,
    getOneProjectById: getOneProjectById,
    getProjectsByIds: getProjectsByIds,
    updateProject: updateProject,
    addProjectToUser: addProjectToUser,
    hasWritePermission: hasWritePermission,
    hasReadOrWritePermission: hasReadOrWritePermission,
    hasReadOnlyPermission: hasReadOnlyPermission
};
