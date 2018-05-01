let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//Schema for a project itself. contains mostly metadata, and references to separate documents to contain the node structure and arrangements
let projectSchema = new Schema({
    currentStructure: {type: Schema.ObjectId, required: true},    //Reference to _id of a Structure document
    currentArrangement: {type: Schema.ObjectId, required: true},  //Reference to _id of an Arrangement document
    savedArrangements: [
        Schema.ObjectId     //Array of _id references to 'SavedArrangement' documents. Note: NOT directly referencing Arrangement documents.
    ],
    image: String,
    name: {type: String, required: true},
    timestamp: Date
});

//This schema represents the semantics and relationship structure of one single node, within a project.
let structureSchema = new Schema({
    contentNodes: [
        {
            idString: String,   //HTML id string (not DB id) for a node
            titleText: String,
            descriptionText: String,
            colour: String,
            childrenList: [
                {
                    displayedLabel: String,
                    categoryLabel:  String,
                    parentNode: String,         //HTML id string referencing a node
                    children: [
                        String      //HTML id string referencing a node
                    ]
                }
            ]
        }
    ]
});

//Schema for a visual arrangement of a group of nodes
let arrangementSchema = new Schema({
    contextNodeId: String,
    nodeData: [
        {
            idString: String,
            translation: {
                x: Number,
                y: Number
            },
            size: {
                height: Number,
                width: Number
            },
            isExpanded: Boolean,
            isShowingInfo: Boolean
        }
    ]
});

//Schema for meta data document which contains information about a given arrangement which has been saved in the database
let savedArrangementSchema = new Schema({
    arrangement: {type: Schema.ObjectId, required: true},
    name       : {type: String, required: true},
    image      : {type: String},    //URL to some image resource indicating what the arrangement looks like
    desc       : String,
    timestamp  : Date
});

//Schema for a

//Model the project structure schema into a Model, so we can use it
let projectStructureModel   = mongoose.model('project', structureSchema);
let projectArrangementModel = mongoose.model('arrangement', arrangementSchema);

module.exports = {
    structureModel: projectStructureModel,
    arrangementModel: projectArrangementModel
};