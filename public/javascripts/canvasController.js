
//Create local 'state' objects to remember all the canvas related logic objects.
//This will be a storage of all the content nodes, and all the 'resource' nodes (To be implemented later..)
//Access to the relationship objects will be done VIA the content nodes, and they cannot exist in isolation.
//(See the OOP modelling for nodes)
const canvasState = {
    contentNodeList : [],   //Initially, there are no nodes! Of course there must be some 'load' function to reload previous projects.
    resourceNodeList : []
};

//Define a default translation (relative to the drawing canvas) to place newly created nodes at.
//Later on, we should probably make nodes appear on a cursor translation, or something more user-friendly.
const defaultNodePosition = {
    x : 100,     //Corresponding values to CSS 'absolute translation' coordinates.
    y : 100
};
const defaultColour = "dodgerblue";
const defaultNodeSize = {
    height : 50,
    width  : 100
};
const defaultNodeTitle = "New concept";
const defaultHierarchicalRelationshipLabel = "Child";

//Define a counter which will track the current 'id' number to append
let currIdNum = 0;
const idPrefix  = "contentNode";

//Define default spacing between 'auto arranged' nodes, which will define spacing for whenever we need to re-arrange guys
let childrenVerticalSpacing   = 35;   //pixels. Vertical space between parents and children.
let childrenHorizontalSpacing = 20;   //pixels. Horizontal space between children.
let verticalSpacing           = 50;   //pixels. Vertical space between un-related nodes. (not including semantic relationships).
let horizontalSpcaing         = 60;   //pixels. Horizontal space between un-related nodes. (not including semantic relationships).

// ---------------------------------------------------------------------------------------------------------------------
// --- Node creation and deletion functionality ------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// These functions will access the page DOM and generate new or delete old HTML elements, representing 'content nodes'
// to be rendered on the page. Accordingly, the logical models of these elements will be updated in the canvasState
// object structure as well.

/** This function will simply create a new content node and place it at the specified default location.
 *  Accordingly, the new node will be tracked by the canvasState.
 *  The new node will have an associated HTML div element in the DOM, such that it can be rendered.
 *  The HTML element will have a unique id, and have the associated class types to allow interact.js library to
 *  apply it's drag/drop/resize functionality to the node.
 */
function createNewNode() {

    //Create the HTML element for this node by directly editing the browser DOM.
    //The creation method will return the new html element object, and it's id string.
    let newElemDetails = createNewNode_HtmlElement(defaultNodePosition.x, defaultNodePosition.y);

    //Use the returned details to create a new logical object representing the HTML element, and store it.
    let newNode = new ContentNode(newElemDetails.elementReference, newElemDetails.elementId, newElemDetails.x, newElemDetails.y, newElemDetails.height, newElemDetails.width);
    canvasState.contentNodeList.push(newNode);

    /*TODO - automatically rearrange nodes on screen after placing a new one, since it may be overlapping if there was a node already in the default spawn location*/
}

function createNewNode_HtmlElement(xPos, yPos) {
    //Access the DOM, and find the drawingCanvas element. We will add the new content node as a DIV nested inside of this
    let drawingCanvas = document.getElementById("drawingCanvas");

    let newElem = document.createElement("div");

    //assign an id for the new element based on the current 'tracking'
    let idString = idPrefix + currIdNum;
    currIdNum++;

    //Add element as a child of the canvas object!
    drawingCanvas.appendChild(newElem);

    newElem.setAttribute("id", idString);    //Assign the id.
    //Assign the classes we need. Most of them facilitate interaction with interact.js library.
    newElem.setAttribute("class", "draggable drag-drop dropzone contentNode node");

    //We will store the translation VALUES as attributes in the HTML DOM object itself, so that the interaction libraries can easily access them!
    newElem.setAttribute("xTranslation", xPos.toString());
    newElem.setAttribute("yTranslation", yPos.toString());

    newElem.style.backgroundColor = defaultColour;  //Colour will determine the background colour of the element, since that forms actual 'fill colour'
    newElem.innerText    = defaultNodeTitle;
    newElem.style.height = defaultNodeSize.height + "px";
    newElem.style.width  = defaultNodeSize.width  + "px";
    newElem.style.transform = 'translate(' + xPos + 'px, ' + yPos + 'px)';

    //Return the html element we just made, and it's id string.
    return {
        elementReference : newElem,
        elementId        : idString,
        x                : xPos,
        y                : yPos,
        height           : defaultNodeSize.height,
        width            : defaultNodeSize.width
    };
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Functions for accessing into the aggregated nodes ---------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function getContentNode(element) {
    //Find by id.
    let id = element.getAttribute("id");

    for (let node of canvasState.contentNodeList) {
        if (node.idString == id) {
            return node;
        }
    }

    //We didn't find it...
    alert("Could not find a matching node object with id: "+id);
    return null;
}

//Recursive function to BFS through all children of this node, and delete a class from the corresponding html element.
function removeHtmlClassFromAllDescendants(node, className) {
    node.htmlElement.classList.remove(className);

    //recurse to all children
    for (let rel of node.childrenList) {
        for (let child of rel.children) {
            removeHtmlClassFromAllDescendants(child, className);
        }
    }
}

//Recursive function to BFS through all children of this node, and delete a class from the corresponding html element.
function addHtmlClassFromAllDescendants(node, className) {
    node.htmlElement.classList.add(className);

    //recurse to all children
    for (let rel of node.childrenList) {
        for (let child of rel.children) {
            removeHtmlClassFromAllDescendants(child, className);
        }
    }
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Node overlap detection and rearranging functions ----------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function detectOverlaps() {
    //TODO
}

function detectOverlaps(movedNode) {
    //TODO
}

function rearrangeAllNodes() {
    //TODO
}

function rearrangeNodes(overlappingNodes) {
    //TODO
}

// ---------------------------------------------------------------------------------------------------------------------
// --- ContentNode 'class' definition (actually a javascript 'prototype') ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/** This is a definition of a constructor 'function' which defines an object prototype structure, representing a logical
 *  content node, which currently exists on the drawing canvas. Using this we can treat 'ContentNode' as somewhat of a
 *  class.
 * @constructor
 */
function ContentNode(element, id, x, y, height, width){
    // --- Object properties ---
    this.htmlElement     = element;
    this.idString        = id;
    this.isVisible       = true;    //New nodes are always deemed visible (for now)
    this.isExpanded      = true;    //New nodes are always in the expanded state, as they cannot have chilren yet anyway
    this.colour          = defaultColour;
    this.translation     = {
        x : x,
        y : y
    };
    this.size            = {
        height : height,
        width  : width
    };
    this.titleText       = defaultNodeTitle;

    //Upon creation, new nodes have no defined relationships.
    this.childrenList    = [];  //Note that this is NOT an array of nodes, it is an array of HierarchicalRelationships, which contain references to child nodes
    this.parentList      = [];
    this.semanticRelList = [];
}

/**
 * Moves or animates a node to a specified translation on screen, then update the tracked state.
 * @param animateTime value to specify how long the 'transition' animation should take. <= 0 results in instantly changing
 */
ContentNode.prototype.moveNodeTo = function(x, y, animateTime) {
    if (animateTime > 0) {
        //Set up a transition on the 'transform' property such that it takes 'animateTime' seconds to animate the object.
        this.htmlElement.style.transitionProperty = "transform";
        this.htmlElement.style.transitionDuration = animateTime.toString()+"s";
    }
    this.htmlElement.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    this.translation.y = y;
    this.translation.x = x;
    this.htmlElement.setAttribute("xTranslation", x.toString());
    this.htmlElement.setAttribute("yTranslation", y.toString());

    //Reset the 'transition time' on the element, so that future transforms don't take take to happen (e.g. mouse dragging)
    this.htmlElement.style.transitionProperty = "transform";
    this.htmlElement.style.transitionDuration = "0s";

    //Ask the controlling context to detect possible overlaps after this move!
    detectOverlaps(this);
};

/**
 * Used to actively resize nodes and apply visible changes. Should subsequently update the state to the result
 */
ContentNode.prototype.resizeNode = function(newHeight, newWidth, animate) {
    //TODO
};

/**
 * Setter method for updating object state in regard to the current node size
 */
ContentNode.prototype.updateSize = function() {
    //TODO
};

/**
 * Update the name of a contentNode
 */
ContentNode.prototype.setTitleText = function(name) {
    this.titleText = name;
    this.htmlElement.innerText = name;
};

/**
 * This function is used to assign a passed node to be a child of the node the method is being invoked on.
 * The function also receives a 'label' which, as a simple string, dictates the 'family' or 'type' of relationship
 * this nesting exists under.
 *
 * If the parent node (invoked-upon-node) already has a child with the same label, the passed node will be added to
 * the same 'list of children' inside the relationship object which represents that label.
 *
 * If the parent node does not have a child with the same label, a new relationship object will be created to
 * represent that 'family' of children.
 *
 * NOTE: There is an overloaded version of this method, which does not specify a second argument. That will simply do
 *       the same action but use a 'default label'.
 *
 * @param node the node object which will become the child of this object.
 * @param relationshipLabel the 'label' (string) which specifies the relationship type, or 'categorises' the relationship
 */
ContentNode.prototype.addChild = function(node, relationshipLabel) {
    //Search through the current child list for relationship objects which match
    for (const rel of this.childrenList) {
        //If this relationship object has a matching object, we can just add it and move on!
        if (rel.compareLabel(relationshipLabel)) {
            //MATCH! No need to create a new relationship object.
            rel.addChild(node);
            return;
        }
    }

    //If we got here, that means we need to create a new object, and this node does not already have a child with this
    //label
    let rel = new HierarchicalRelationship(relationshipLabel, this);    //Assign this node to be the parent, of course!
    this.childrenList.push(rel);    //Add the new relationship object to the list of children aggregators.
    rel.addChild(node);
};

/**
 * Convenience overload of the addChild(node, label) method which simply uses a default value for the label.
 * @param node the node object to become the child of this object.
 */
ContentNode.prototype.addChildNoLabel = function(node) {
    this.addChild(node, defaultHierarchicalRelationshipLabel);
};


// ---------------------------------------------------------------------------------------------------------------------
// --- Hierarchical Relationship 'Class' definition --------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Creates a new object which represents a labelled/categorised, hierarchical relationship between a singular parent
 * node, and a collection of children.
 * @param label the label that will be assigned to this object
 * @constructor
 */
function HierarchicalRelationship(label, parentNode) {
    this.displayedLabel = label;    //This will be the string that shows up with rendered (i.e. preserve whitespace and capitals)
    this.categoryLabel = label.toLowerCase().trim().replace(/\s/g,'');    //This is the string used for 'id matching'. Whitespace and captials are removed.

    this.parentNode = parentNode;
    this.children   = [];   //Start the list empty, and use the adder method to append children
}

HierarchicalRelationship.prototype.addChild = function(node) {
    //Remember the new child, unless this relationship already has this node as a child!
    let newid = node.idString;
    for (let child of this.children) {
        if (child.idString == newid) {
            //Oops! we already have this node added! Let's simply reposition it, and then do nothing else.
            this.repositionChildren(node);
            return;
        }
    }
    this.children.push(node);

    //For now, whenever we add a new child, we will reposition all the children nodes to be underneath the parent
    this.repositionChildren(node);
};

//This function will try to nicely arrange all of the children of a node relative to it's parent.
HierarchicalRelationship.prototype.repositionChildren = function(newlyAddedNode) {
    //TODO -- Algorithm for repositioning all of the children nicely

    //For now, we will leave all of the other children where they are, and just place the newly added child
    //directly below the parent, with a set default vertical padding.
    let parentXpos = this.parentNode.translation.x;
    let parentYpos = this.parentNode.translation.y;
    let newChildY  = parentYpos + this.parentNode.size.height + childrenVerticalSpacing;

    newlyAddedNode.moveNodeTo(parentXpos, newChildY, 0.6);
};

HierarchicalRelationship.prototype.compareLabel = function(label) {
    //Convert the passed string to the appropriate formation
    let converted = label.toLowerCase().trim().replace(/\s/g,'');

    if (converted === this.categoryLabel) {
        return true;
    }
    else {
        return false;
    }
};