
//Create local 'state' objects to remember all the canvas related logic objects.
//This will be a storage of all the content nodes, and all the 'resource' nodes (To be implemented later..)
//Access to the relationship objects will be done VIA the content nodes, and they cannot exist in isolation.
//(See the OOP modelling for nodes)
const canvasState = {
    contentNodeList : [],   //Initially, there are no nodes! Of course there must be some 'load' function to reload previous projects.
    resourceNodeList : [],
    contextNode: null,      //A node object which represents the 'current view context'. The node that has been 'zoomed into' so to speak.
    rootNodes : [],         //The root nodes of the current view context, relative to the context node! Indicate which nodes should appear as roots on the screen
    viewDepth : 3           //The current maximum view depth to be displayed on the canvas.
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
// --- Node creation functionality -------------------------------------------------------------------------------------
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
function createNewContentNode() {
    //Create the HTML element for this node by directly editing the browser DOM.
    //The creation method will return the new html element object, and it's id string.
    let newElemDetails = createNewContentNode_HtmlElement(defaultNodePosition.x, defaultNodePosition.y);

    //Use the returned details to create a new logical object representing the HTML element, and store it.
    let newNode = new ContentNode(newElemDetails.elementReference, newElemDetails.elementId, newElemDetails.x, newElemDetails.y, newElemDetails.height, newElemDetails.width);
    canvasState.contentNodeList.push(newNode);

    /*TODO - automatically rearrange nodes on screen after placing a new one, since it may be overlapping if there was a node already in the default spawn location*/
}

function createNewContentNode_HtmlElement(xPos, yPos) {
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
    newElem.innerText    = idString; //defaultNodeTitle;
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
// --- Node deletion functionality -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * This function will PERMANENTLY delete a node from memory and from the page.
 * It removes all reference to it in the canvasState and removes all of the relationships it had to it's children and parents.
 *
 * When invoking this function, you can optionally choose to 'stitch' the broken tree links back together.
 *
 * -- stitching the tree will make all the children of the deleted node become direct children of the deleted node's immediate parents,
 * -- provided that the parent -> deleted node label is the same as the deleted node -> child relationship label.
 * --
 * -- To avoid semantic confusion, we should only stitch together parents and children that are associated with the deleted node
 * -- with MATCHING LABELS. Otherwise, the resulting 'stitched' relationships will probably make no sense.
 * --
 * -- E.g. if A --contains--> B --contains--> C, then deleting node B with the stitch flag set to TRUE will result in
 * --      the following tree: A --contains--> C.
 * -- But  if A --contains--> B --explains--> C, then deleting node B with the stich flag set to TRUE will result in
 * --      the followinf tree: A, C (A will not be connected to C, as there is no way to congruently stitch two different
 * --      relation types!
 *
 * -- NOT stitching the tree will make all the children of the deleted node parentless root nodes. This essentially silently moves them
 * -- to being 'top level' nodes. However, the moved nodes will be added to the context view, and become rootNodes of the current
 * -- canvas view/context!
 *
 * @param node the node to be deleted.
 * @param stitchTree flag to determine if the tree should be stitched.
 */
function deleteContentNode(node, stitchTree) {
    console.log("we were just asked to delete the node: "+node.idString);

    if (stitchTree) {
        //Alright, we have to stitch the tree! Then, we just delete this node as usual!
        //Cycle through every parent of the to-delete node. Then, for each parent, check to see if the to-delete node
        //has a child relationship with a matching label. If one is found, call addChild() on the parent relationship,
        //adding every node from the child relationship into the parent relationship!
        for (let parentRel of node.parentList) {
            for (let childRel of node.childrenList) {
                if (parentRel.compareLabel(childRel.categoryLabel)) {
                    //Matched! Add all children of this relationship to the corresponding parent label!
                    for (let matchedChildNode of childRel.children) {
                        parentRel.addChild(matchedChildNode);
                    }
                }
            }
        }
    }

    //Okay, now let's just directly delete this node and make all of it's children rootNodes of the current context!
    node.detachFromAllChildren();
    node.detachFromAllParents();

    //Okay. Now we can delete the node completely!

    //Remove the html node from the DOM.
    let drawingCanvas = document.getElementById("drawingCanvas");
    drawingCanvas.removeChild(node.htmlElement);

    //Remove the logical node from all canvasState memory
    let index = canvasState.contentNodeList.indexOf(node);
    if (index == -1) {
        alert("CRITICAL ERROR: attempted to delete a node that wasn't even stored in the contentNodeList!");
    }
    else {
        canvasState.contentNodeList.splice(index,1);    //Delete one element, from the 'index' position
    }

    //Remove the logical node from the rootNode list, if it is there
    index = canvasState.rootNodes.indexOf(node);
    if (index != -1) {
        canvasState.rootNodes.splice(index,1);
    }
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
            addHtmlClassFromAllDescendants(child, className);
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
    this.previousTranslation = {
        x : x,  //This object will be used to remember the previous position of this node, so that we can perform 'go back' actions
        y : y   //for example when we detatch a node from it's parents by dragging it into the 'detatch' zone. It should move back afterwards.
    }           //We will update the 'previous position' whenever the user starts dragging the node!
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
 * This method is used for triggering an animation event in order to move a canvas node in an automated fashion.
 * This method is NOT used for systematically updating state in the logic nodes or for performing individual translation
 * actions.
 *
 * Moves or animates a node to a specified translation on screen, then update the tracked state.
 * @param animateTime value to specify how long the 'transition' animation should take. <= 0 results in instantly changing
 */
ContentNode.prototype.moveNodeTo = function(x, y, animateTime) {
    if (animateTime > 0.0) {
        //Set up a transition on the 'transform' property such that it takes 'animateTime' seconds to animate the object.
        this.htmlElement.style.transitionProperty = "transform";
        this.htmlElement.style.transitionDuration = animateTime.toString()+"s";
    }

    //Trigger the CSS animation by setting a new translation.
    this.htmlElement.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    //Update the logical nodes translation state
    this.translation.y = y;
    this.translation.x = x;

    //Update the html element tracking of the translation as well. (used by the interact.js framework)
    this.htmlElement.setAttribute("xTranslation", x.toString());
    this.htmlElement.setAttribute("yTranslation", y.toString());

    //The other thing that needs to be animated is the relationships associated with this node!
    //The lines will have to animate themselves to follow the node as it moves.



    //NEED TO SET THE TRANSFORM TRANSITION TIME BACK TO ZERO AFTER THE TRANSITION HAS FINISHED.
    //OTHERWISE THIS WILL INTERFERE WITH OTHER THINGS, POTENTIALLY
    //Cannot do it here, because then the transition we just instigated will be cancelled out!
    //this.htmlElement.style.transitionProperty = "transform";
    //this.htmlElement.style.transitionDuration = "0s";

    //Ask the controlling context to detect possible overlaps after this move!
    detectOverlaps(this);
};

/**
 * Moves or animates the node back to wherever it was prior to the last drag move by the user!
 * @param animateTime
 */
ContentNode.prototype.returnToPreviousPosition = function(animateTime) {
    console.log(this.idString+" was asked to move back to it's previous position, which is x = "+this.previousTranslation.x+" y = "+this.previousTranslation.y);
    this.moveNodeTo(this.previousTranslation.x, this.previousTranslation.y, animateTime);
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

/**
 * Method for detaching this node from all of it's children! After calling this, this node will have no child relationships
 * and all nodes that previously had this node as a parent will no longer have those applied.
 */
ContentNode.prototype.detachFromAllChildren = function() {
    for (let rel of this.childrenList) {
        rel.deleteRelationship();   //Completely destroy the relationship, as the parent will no longer exist!
    }
};

ContentNode.prototype.detachFromAllParents = function() {
    //Remove ourselves from all our parent's child lists.
    for (let rel of this.parentList) {
        rel.removeChild(this);
    }

    //Now, set our parent list to be empty, since of course, we have no parents anymore!
    this.parentList = [];   //Left over relationships should be garbage collected.
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

    //We also will be responsible for maintaining a list of SVG lines which will form the visual connections between nodes.
    this.lineList   = [];   //Array of associated 'RenderLine' prototypes, each of which are associated with a content node.
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

    //Now, we need to add THIS RELATIONSHIP as a parent reference into the new child's parentList, so that upwards tree traversal is also possible!
    node.parentList.push(this);

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

    newlyAddedNode.moveNodeTo(parentXpos, newChildY, 0.35);
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

/**
 * Function which removes a passed node as a child of this relationship object. If removing the node brings our child count down to zero,
 * then this relationship is deleted all together!
 * @param node the node to be removed from being a child.
 */
HierarchicalRelationship.prototype.removeChild = function(node) {
    //Find the passed node in our child list
    let index = this.children.indexOf(node);
    if (index == -1) {
        //It wasn't a child to begin with.. do nothing.
        console.log("Tried to remove "+node.idString+" from being a child of "+this.parentNode.idString+" but it was not a child to begin with!");
        return;
    }

    //Delete the child.
    this.children.splice(index,1);

    if (this.children.length == 0) {
        //Oh no! this relationship has no children left! We should just kill ourselves.
        this.deleteRelationship();
    }
    else {
        //Now, let's remove this relationship object from the node's parent list!
        index = node.parentList.indexOf(this);
        if (index == -1) {
            alert("CRITICAL ERROR: a relationship object had a child, which did not have the relationship as a parent!");
        }
        else {
            node.parentList.splice(index,1);
        }
    }
};

/**
 * This function is used to completely remove this relationship from all associated nodes, and from memory entirely!
 * Calling this function will:
 * a) remove reference to this from all children's parentList.
 * b) remove reference to this from the parent's childList.
 */
HierarchicalRelationship.prototype.deleteRelationship = function() {
    for (let child of this.children) {
        let index = child.parentList.indexOf(this);
        if (index == -1) {
            alert("CRITICAL ERROR: a relationship object had a child, which did not have the relationship as a parent!");
        }
        else {
            child.parentList.splice(index,1);
        }
    }

    let index = this.parentNode.childrenList.indexOf(this);
    if (index == -1) {
        alert("CRITICAL ERROR: a relationship object had a parent, which did not have the relationship as a child!");
    }
    else {
        this.parentNode.childrenList.splice(index,1);
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// --- RenderLine object prototype -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function RenderLine(sourceNode, destNode) {
    console.log("a new RenderLine was created, from "+sourceNode.idString+" and "+destNode.idString);

    //Store reference to the information we are going to need.
    this.sourceNode = sourceNode;
    this.destNode   = destNode;

    this.sourceHtmlElement = sourceNode.htmlElement;
    this.destHtmlElement   = destNode.htmlElement;

    //When the RenderLine is created, we access the SVG canvas object and add a 'line' to it, spanning from source to destination
    let svg = document.getElementById("svgObject");

    //Create a <line> and store it as a property of this object.
    let line = document.createElement("line");
    line.setAttribute("x1", sourceNode.translation.x.toString());
    line.setAttribute("y1", sourceNode.translation.y.toString());
    line.setAttribute("x2", destNode.translation.x.toString());
    line.setAttribute("y2", destNode.translation.y.toString());

    this.line = line;

    console.log("The display type of the line is: "+line);
}

/**
 * This function is intended to be called whenever the source or dest nodes move on screen, so that the line can follow their positions.
 *
 * Access the source and destination elements, and directly extract the x and y translation values.
 * Then, update the <line> attributes to move the line in accordance to the node positions.
 */
RenderLine.prototype.update = function() {
    let x1 = parseFloat(this.sourceHtmlElement.getAttribute('xTranslation'));
    let y1 = parseFloat(this.sourceHtmlElement.getAttribute('yTranslation'));
    let x2 = parseFloat(this.destHtmlElement.getAttribute('xTranslation'));
    let y2 = parseFloat(this.destHtmlElement.getAttribute('yTranslation'));

    this.line.setAttribute("x1", x1.toString());
    this.line.setAttribute("x2", x2.toString());
    this.line.setAttribute("y1", y1.toString());
    this.line.setAttribute("y2", y2.toString());
};

RenderLine.prototype.hideLine = function() {
    this.line.style.display = "none";
};

RenderLine.prototype.showLine = function () {
    this.line.style.display = "inline";
};





