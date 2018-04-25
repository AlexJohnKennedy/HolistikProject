/*
 * This file contains logic used for serializing content node information and structure into JSON so it can be sent to
 * the server, and logic for parsing JSON from the server back into JavaScript objects, so that we can load projects
 * from the server.
 */

// ---------------------------------------------------------------------------------------------------------------------
// --- Serialisation ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * This is a 'replacer' function, which is used by the JSON.stringify() call intending to serialize all the
 * ContentNode's STATE and STRUCTURE into JSON.
 *
 * In other words, this is the replacer defined which serializes the following aspects of a ContentNode:
 *      - idString of the node
 *      - node title text
 *      - node description text
 *      - node colour
 *      - list of node children as relationship objects
 *          - each relationship object will be serialized to contain id references to the parent & children nodes
 *      - list of semantic relationships (Once those are implemented) TODO - Semantic relationship serializing/parsing, once semantic relationships are added to the app.
 *
 * Note that this replacer does not serialize anything related to the ARRANGEMENT or VISIBILITY of the nodes on the
 * canvas, instead, it only saves the semantic structure of nodes.
 *
 * The arrangement/visiblity stuff is saved and loaded SEPARATELY, so that we can save and load arrangment
 * instances for a given node structure independently at any time.
 *
 * @param key name of the property is currently about to be serialized
 * @param value the value that will be the serialized value of this key.
 */
function serializeNodeState_replacer(key, value) {
    //DEBUG
    //console.log("JSON REPLACER: |rel? = "+(this instanceof HierarchicalRelationship)+"| |Key = "+key+"| |value = "+value);

    //Inside the replacer function, 'this' is set to the object who's property is reflected by the key currently being serialized.
    if (this instanceof ContentNode) {
        return contentNode_state_replacer.call(this, key, value);      //call helper function but preserve the 'this' context!
    }
    else if (this instanceof HierarchicalRelationship) {
        return hierarchicalRelationship_state_replacer.call(this, key, value);      //call helper function but preserve the 'this' context.
    }
    //TODO, semantic relationship serialisation
    else {
        return value;
    }
}

function contentNode_state_replacer(key, value) {
    //Okay, no we can define custom behaviours depending on what property is being serialised.

    if (key === 'idString'
    ||  key === 'titleText'
    ||  key === 'descriptionText'
    ||  key === 'colour'
    ||  key === 'childrenList') {

        return value;   //Serialize as normal!
    }
    else {
        //Don't want to serialise anything else here
        return undefined;   //Returning undefined makes the JSON.stringify() skip this property!
    }
}

//Serialises one hierarchical relationship. Replaces all node references with a reference to their idString.
//Only serialises state related properties
function hierarchicalRelationship_state_replacer(key, value) {
    if (key === 'displayedLabel' || key === 'categoryLabel') {
        return value;   //Serialise as normal
    }
    else if (key === 'parentNode') {
        //Return the id string of the parent node, rather than serialising the node object again.
        if (this.parentNode) {
            return this.parentNode.idString;
        }
        else {
            return null;    //No parent, indicated as null
        }
    }
    else if (key === 'children') {
        if (this.children !== null) {
            //Return an array of all the children id strings, rather than serialising the node objects again.
            let ids = [];
            for (let n of this.children) {
                ids.push(n.idString);
            }
            return ids;     //Yo, serialise this array of id strings please!
        }
        else {
            return null;
        }
    }
    else {
        //All other fields should be skipped!
        return undefined;
    }
}


/**
 * This is a 'replacer' function, which is used by the JSON.stringify() call intending to serialize all the
 * ContentNode's ARRANGEMENT and VISIBILITY into JSON.
 *
 * In other words, this is the replacer defined which serializes the following aspects of a ContentNode:
 *      - translation of the node
 *      - size of the node
 *      - isExpanded
 *      - isShowingInfo
 *
 * Note that this replacer does not serialize anything related to the SEMANTICS or STRUCTURE of the nodes on the
 * canvas, instead, it only saves the current positions, sizes, and arrangements
 *
 * IMPORTANT NOTE: THE CONTEXT NODE WILL HAVE TO BE SAVED AND LOADED IN CONJUNCTION WITH THIS: BUT THIS REPLACER FUNC
 *                 HAS NOTHING TO DO WITH THAT.
 *
 * @param key name of the property is currently about to be serialized
 * @param value the value that will be the serialized value of this key.
 */
function serializeNodeArrangement_replacer(key, value) {
    if (this instanceof ContentNode) {
        if (    key === 'idString'
            ||  key === 'translation'
            ||  key === 'size'
            ||  key === 'isExpanded'
            ||  key === 'isShowingInfo') {

            return value;   //Serialize as normal!
        }
        else {
            //Don't want to serialise anything else here
            return undefined;   //Returning undefined makes the JSON.stringify() skip this property!
        }
    }
    else {
        return value;
    }
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Parsing/Re-building functions -----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * This function will parse a JSON string containing an array of all structural and semantic data about all nodes,
 * and rebuild them into ContentNode objects.
 * @param jsonString
 */
function parseAllNodeStatesFromJSON(jsonString) {
    //First, we should build an Array of 'data packags' containing all of the
}

/**
 * Reviver to be used with JSON.parse(), which creates objects containing preliminary information to be used to
 * rebuild ContentNodes, but DOES NOT rebuild relationships.
 * This is becuase we cannot rebuild relationships safely until all the content node objects themselves are sure to exist.
 * Relationships will therefore be rebuilt with a subsequent parse() call, using a different reviver function.
 *
 * This function does not directly build ContentNode objects. Instead, it will be used to create 'packages' of data
 * which will then be looped through to rebuild ContentNode objects via the canvasController's 'rebuildContentNode'
 * function.
 *
 * Equally, this function DOES NOT re-build node positions or arrangement information, since that data is stored in
 * separate JSON strings than the one's with the state related data!
 * @param key
 * @param value
 */
function parseNodeState_reviver(key, value) {
    if (key === 'idString'
        ||  key === 'titleText'
        ||  key === 'descriptionText'
        ||  key === 'colour') {

        return value;
    }
    else {
        return undefined;
    }
}

/**
 * Reviver to be used with JSON.parse() on JSON strings representing the arrangment of nodes.
 *
 * This will create temporary data packages which represent the translation, size, and visual status of nodes.
 * Then, those packages can be used to update the arrangement state of the real ContentNodes on the canvas state!
 * @param key
 * @param value
 */
function parseNodeArrangment_reviver(key, value) {
    return value;   //This reviver does not actually need customised behaviour for now..
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Debugging functions ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function printTestSerialistation() {
    console.log('/* Node state and structure serialisation -------------------------------- */');
    console.log(JSON.stringify(canvasState.contentNodeList, serializeNodeState_replacer, 4));

    console.log('/* Arrangement and visibility serialisation ------------------------------ */');
    console.log(JSON.stringify(canvasState.contentNodeList, serializeNodeArrangement_replacer, 4));
}