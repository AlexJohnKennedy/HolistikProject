//Include Mongoose and open a connection to our database
const mongoose = require('mongoose');
mongoose.connect('mongodb://Jaiden:HelloWorld123@ds061474.mlab.com:61474/holistik-prod');
if (err) {
   console.log("Failed to connect to mLab") ;
} else {
    console.log("Successfully connected to mLab");
}
