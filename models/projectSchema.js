let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//This schema represents the semantics and relationship structure of one single node, within a project.
let structureSchema = new Schema(
    {
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
    }
);

//Schema for a project's visual arrangement
let arrangementSchema = new Schema(
    {
        projectId: String,       //The project it pertains to
        contentNodeArrangement:
            {
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
            }
    }
);

//Model the project structure schema into a Model, so we can use it
let projectStructureModel   = mongoose.model('project', projectStructureSchema);
let projectArrangementModel = mongoose.model('arrangement', projectArrangementSchema);

module.exports = {
    structureModel: projectStructureModel,
    arrangementModel: projectArrangementModel
};