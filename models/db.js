//Include Mongoose and open a connection to our database
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');
const Project = require('./Project.js');
const User = require('../models/User.js');


//database user credentials
const username = "Jaiden";
const password = "meme";

//Default project thumbnail for new images
const defaultImageURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASsAAAErCAIAAAAJxjLjAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAhhSURBVHhe7dzteaM4A4bRrSsFpZ5Uk2ZczLzGNiCwJDA77/UY7zm/dsyXELrHiZPZf/4AOQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEB2u/wOLpfHH/kbzlTg7/fXPw9f3z/ddXD5/b7v+P17rvVS3OPS19f1nn+Cd3P5mUb2/ft4jX/vRAUWS+Cmtw6mfb/6pb6b9T1WfIX+UimGdrJJfW8nLrC3EM5f4Nd36Wt565G7mt6eY3M6zc7ZvrLpOXOBnbfB0xdYGff1K+t5Ak52X3/HWZ9q1xkLvH4/NC3FRoOfWOBg/Pb2v5mgArPmAn/n/248jE8tsEjwP/hxiAKzygK33g12PavL78/yG6zh48bn7zCmKzXW/Nb2V9bN5r7TDss9xpcfL5ZfsNY/ublUbr5697Pp0p3vwnZO6dL9oPmop2PmZ121Y17f2GkLLNZiZelPGxtPZ/E91dp1zT52u5kvVE2sO46rjcOXtsZdnK1Z4NN6XV23e+/D3W9duj62V6Z0Nt/Pk/kYBb6H6WGNT6axGgf91VI80ftP2QY/3+UKKlfMfJ3KOlosodo623qLXOiP+2oe+uJ043HFW8ntw9Thj8tTLVfz9fbvFm9c9at3x/bilN4t5m4aS+WQ+68CDG+V99eHN8lZfabO4swFls99tSo6q2V+7JWVVN84v/q0iuZNg8oZXwqwN+5BcbXl6ZbDuG6sHb3c7Xmfcmtvbp62zQf2DltvLC63Puz6delt22rO2iM4sXMXWD7FxdNqP6vNImo77Djd3euXW+qssXFV3qw3F/NQOXQ0D7a1T2s+B82xHZrSYjCNwy7Xd9LHfz50Zue8Tl5guWbKx3J8tdQPbZ1vPN30tVNje/tyS8Xd3L8ku1t+jVg52Xxc50LTYNaTUmrvtDUHr03prsGstEZwaqcvsHiWxYNpPav59cV3EgvjLovr1E84Xvr6FV11e2vITdMBTY2PNquXX5rP3RvNvNf6VI1rzC+/MqV7Bvzk0EHv7gMKLBscN7We1bznDovr1M44vjbsWBtde8Qt0xFrGz8rqI1ubee7TnO3xjWOTenOwSztucvT+YgCy4V739h6Vq8sl9ah0+vjRe4vPA+vM+CW1ri37Dlu56Jv7ta4xrEpnY7aPzfHZ+etfUaB5Tq4PZ3Ws9q5CqueFs3jhfFU6/F1x9twdI3tOW7nvTd3a1zj2JQeOuro7Ly1TymweKbD9tazml5/JYvRdIX7sY8/zldYDXDc/ZUrHV1je45bTFBTe4Ya12gf0DMN5pUbPTo7b+1zCiyWwtfP9L3/+lkdevKj6eBhBJXAxpdu5178Ya+ja2zXcbvuvb1T6xq7TrtWPqzdRx2dnbf2QQUWa2H+3ZCnZzXv88pf2Q/TwfOHn4uzjNuvVy3+87Fxj6NrbNdx007tey9m8OlEzWscmtLtwVx+1x89HZ2dt/ZRBZaL4eH5WRW7tB/kpfG7TlNX4w8AV2OZtjf/Bug7usZ2Hlfe+9NPNRY/8q/Mcfsax6a0c9Ttd7Urr0+H9G/zVD6swHmnh9qjWv4K8TWm6edYwy8yjtvqVymWzeDp9FvbN/yfC3we3/R7oY8Xbuon6V3j0JSunlXn90JH5RH33YdzvzrJ7+XTClw/18bTWT38itZjXSzh6lp8bBu8vDamcb145CvHbf3TiNZPHTeucWhKewdVR1I74OVZfiufV+B1x3mN9R7O45/ILZ7o8IPvjf8lWZFY9exb27s2VnnT7rl5OPDPA/eM7dCUro/ZGsnweMu9m39lnMOJCiTr6N8OdCmQnaY3953vs+yiQPaZAvQW+FcpkJ7Lz+3zyd4HlPwrCqRj+t5vor+/TIH0FD+l3/ywlCMUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEJIUCEkKhCQFQpICIUmBkKRASFIgJCkQkhQISQqEJAVCkgIhSYGQpEBIUiAkKRCSFAhJCoQkBUKSAiFJgZCkQEhSICQpEHL+/PkfZYGhuQ8V7PkAAAAASUVORK5CYII=";
const demoProjectIdAsString = "5af2b5d19c789045e46bf639";

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

async function createNewUser(userData, pwHash) {
    //construct model from the json body, note that the hash and salt fields need to be updated
    let user = new User.userModel({
        username: userData.username,
        email:    userData.email,
        bio:      userData.bio,
        image:    undefined,
        hash:     pwHash,
        projects: []
    });

    return user.save().then(async function(savedUser) {
        console.log("New user entry was saved successfully! "+savedUser);

        //Okay, all new users should have the 'DemoProject' added to their listing, as a read only project!
        let demoProject = await getOneProjectById(demoProjectIdAsString);
        if (demoProject === undefined) {
            //There was some error!
            return undefined;
        }
        else {
            let finalResult = await addProjectToUser(savedUser, demoProject, false);
            return finalResult;
        }
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
        image: defaultImageURI,
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

/**
 * Returns an object tagged with structure/arrangement
 * @param user
 * @param project
 */
async function getStructureAndArrangementFromProject(project) {
    //make database calls to retrieve the two objects
    let currStructure = await getOneStructureById(project.currentStructure);
    let currArrangement = await getOneArrangementById(project.currentArrangement);

    //package the two objects
    return {
        structure: currStructure,
        arrangement: currArrangement
    };
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
function getOneStructureById(id) {
    return Project.structureModel.findById(id).then(function(struc) {
        //async db call finished, return whatever we got back!
        return struc;
    }).catch(function(err) {
        console.log("Error trying to get one structure by id from MongoDB: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
function getOneArrangementById(id) {
    return Project.arrangementModel.findById(id).then(function(arr) {
        //async db call finished, return whatever we got back!
        return arr;
    }).catch(function(err) {
        console.log("Error trying to get one arrangement by id from MongoDB: "+err);
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

async function updateUserEmail(userModel, freshEmail) {
    console.log("Attempting to change a users' email from: "+userModel.email+" to: " + freshEmail);

    if (!validateString(freshEmail, userModel.email)) {
        console.log("Supplied parameter failed to pass validation. Aborting");
        return userModel;
    }

    //if we passed the above stuff we can update the field
    userModel.email = freshEmail;

    //save!
    return userModel.save().then(function(user) {
        //return the user
        return user;
    }).catch(function(err) {
        console.log("Error trying to update a user email in MongoDB. ERROR: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
async function updateUserBio(userModel, freshBio) {
    console.log("Attempting to change a users' bio from: "+userModel.bio+" to: " + freshBio);

    if (!validateString(freshBio, userModel.bio)) {
        console.log("Supplied parameter failed to pass validation. Aborting");
        return userModel;
    }

    //if we passed the above stuff we can update the field
    userModel.bio = freshBio;

    //save!
    return userModel.save().then(function(user) {
        //return the user
        return user;
    }).catch(function(err) {
        console.log("Error trying to update a user bio in MongoDB. ERROR: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}
async function updateUserHash(userModel, freshHash) {
    console.log("Attempting to change a users' hash from: "+userModel.hash+" to: " + freshHash);

    if (!validateString(freshHash, userModel.hash)) {
        console.log("Supplied parameter failed to pass validation. Aborting");
        return userModel;
    }

    //if we passed the above stuff we can update the field
    userModel.hash = freshHash;

    //save!
    return userModel.save().then(function(user) {
        //return the user
        return user;
    }).catch(function(err) {
        console.log("Error trying to update a user hash in MongoDB. ERROR: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}

//injection protection
function validateString(newString, oldString) {
    if (newString === null) {
        console.log("The supplied string is null.");
        return false;
    }

    //check that the username is not empty
    if (newString === "") {
        console.log("The supplied string is empty. Aborting");
        return false;
    }

    //check that something has actually changed
    if (newString === oldString) {
        console.log("The supplied string is the same as the previous one. Aborting");
        return false;
    }

    //sanitise string
    ///TODO is it better to automatically sanitize inputs before saving them to the db?
    sanitizedString = sanitize(newString);
    if (sanitizedString !== newString) {
        console.log("The string contains invalid characters. Aborting");
        return false;
    }

    //if we made it here we're all good, return true
    return true;
}

function updateProject(projectModel, structure, arrangement, imageDataURI) {
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

        //Everything passed!
        //Finally, if the recevied imageDataURI is not empty, we should save the new image
        if (imageDataURI.length) {
            projectModel.image = imageDataURI;
        }
        return projectModel.save();
    }).then(function(savedProjectModel) {
        console.log("db.updateProject() - Image was saved to the database, the resulting document is: ");
        console.log(savedProjectModel);
        console.log("db.updateProject() - All save operations succeeded!");

        return savedProjectModel;
    }).catch(function(err) {
        console.log("Database error when updating project in updateProject method "+err);
        return err;
    });
}

async function updateProjectName(projectId, newName) {
    //get the current project
    let project = await getOneProjectById(projectId);

    console.log("project: " + project);

    console.log("Attempting to change a projects name from: "+project.name+" to: " + newName);

    if (!validateString(newName, project.name)) {
        console.log("Supplied parameter failed to pass validation. Aborting");
        return project;
    }

    //if we passed the above stuff we can update the field
    project.name = newName;

    //save!
    return project.save().then(function(project) {
        //return the user
        return project;
    }).catch(function(err) {
        console.log("Error trying to update a project name in MongoDB. ERROR: "+err);
        //indicate that an error has occurred by returning undefined
        return undefined;
    });
}

async function deleteProject(body, user) {
    console.log("BODY: " + body.projectId);
    console.log("USER: " + user);
    //delete reference to the project in the user first

    //store its id
    let projectId = body.projectId;

    //get the project object
    let project = await getOneProjectById(projectId);

    //loop from the back of the projects array
    for (let i = user.projects.length-1; i>= 0; i--) {
        //TODO figure out the correct way to compare ids, mongodb IDs have a compare function - investigate
        //the shit below ignores that the two project ids are of different type
        console.log("---------------------------------------------------------------------------------------------")
        console.log("---------------------------------------------------------------------------------------------")
        console.log("---------------------------------------------------------------------------------------------")
        console.log(typeof(user.projects[i].projectId) + " " + typeof(projectId));
        console.log(new mongoose.Types.ObjectId(projectId) === user.projects[i].projectId);
        console.log("---------------------------------------------------------------------------------------------")
        console.log("---------------------------------------------------------------------------------------------")
        console.log("---------------------------------------------------------------------------------------------")
        //double equals?
        if (user.projects[i].projectId == projectId) {
            //we have a match! delete the project
            console.log("We have a match, fuck the item off the array :)");
            console.log("user.projects before: " + user.projects[i]);
            user.projects.splice(i, 1);
            console.log("user.projects after: " + user.projects[i]);
            break;
        }
    }

    //save the user so the project deletion propagates to the remote db
    return user.save().then(function (savedUser) {
        console.log("User with newly deleted project field was saved to the database! \n" + savedUser);

        //find every user that has a reference to this project using the id
        User.userModel.find({/* match all user documents in collection */}).where('projects.projectId').equals(projectId).then(function (users) {
            console.log("Users length: " + users.length);
            //if there are no users, we can safely delete the project
            if (users.length === 0) {
                console.log("There are no users that have a link to the deleted project, let's clear it from the database!");

                //debugging
                console.log("Type: " + typeof(project) + " users: " + project);

                //delete the project document if there are no other users that have it in their list
                project.remove().then(function (removed) {
                    return removed;
                }).catch(function (err) {
                    console.log("Error trying to remove the project document from the DB. " + err);
                    return err;
                });
            }
            //do nothing otherwise
        }).catch(function (err) {
            console.log("Error trying to find users linked to the dropped project. " + err);
            return err;
        });

    }).catch(function(err) {
        console.log("ERROR: database error when saving newly updated user: "+err);
        return undefined;
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

function convertStringIdToIdObject(string) {
    return mongoose.Types.ObjectId(string);
}

module.exports = {
    createNewUser: createNewUser,
    createNewProject: createNewProject,
    getOneUserByEmail: getOneUserByEmail,
    getOneUserByUsername: getOneUserByUsername,
    getOneProjectById: getOneProjectById,
    getProjectsByIds: getProjectsByIds,

    updateUserEmail: updateUserEmail,
    updateUserBio: updateUserBio,
    updateUserHash: updateUserHash,

    updateProject: updateProject,
    updateProjectName: updateProjectName,
    deleteProject: deleteProject,
    addProjectToUser: addProjectToUser,
    hasWritePermission: hasWritePermission,
    hasReadOrWritePermission: hasReadOrWritePermission,
    hasReadOnlyPermission: hasReadOnlyPermission,
    getStructureAndArrangementFromProject: getStructureAndArrangementFromProject,
    convertStringIdToIdObject: convertStringIdToIdObject
};
