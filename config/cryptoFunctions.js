const apiController = require('../controllers/apiController.js');
const bcrypt = require('bcrypt');

const saltRounds = 10;

function hashPassAndStoreUser(plainTextPass, user) {
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(plainTextPass, salt, function(err, hash) {
            apiController.storeUser(hash, user);
        });
    });
}

function verifyPassword(salt, hash, plainTextPass) {
    bcrypt.compare(plainTextPass, hash, function (err, res) {
        //res is boolean
        if (res) {
            //success
        } else {
            //failure
        }
    });
}

module.exports = {
    hashPassAndStoreUser : hashPassAndStoreUser,
    verifyPassword       : verifyPassword
};