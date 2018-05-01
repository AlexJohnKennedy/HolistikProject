let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//This schema represents the semantics and relationship structure of one single node, within a project.
let userSchema = new Schema(
    {
        username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
        email:    {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
        bio: String,
        image: String,  //URL to some supplied profile picture resource
        hash: String,   //Hash of the registered password+salt. Will be used to compare passwords
        address: String,

        //Store references to projects that this user can use.
        projects: [
            {
                writePermission: Boolean,
                projectId: Schema.ObjectId
            }
        ]
    }
);
