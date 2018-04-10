// ---------------------------------------------------------------------------------------------------------------------
// --- ContentNode 'class' definition (actually a javascript 'prototype') ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/** This is a definition of a constructor 'function' which defines an object prototype structure, representing a logical
 *  content node, which currently exists on the drawing canvas. Using this we can treat 'ContentNode' as somewhat of a
 *  class.
 * @constructor
 */
function ContentNode(element, id, x, y, height, width, mutationObserver) {
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

    this.mutationObserver = mutationObserver;
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
    /* BUGGED - MODIFYING ARRAY WHILE ITERATING
    for (let rel of this.childrenList) {
        rel.deleteRelationship();   //Completely destroy the relationship, as the parent will no longer exist!
    }
    */

    //Iterate backwards through the array, since there is a chance we will be deleting elements from the array as we are going!
    for (let i = this.childrenList.length-1; i >= 0; i--) {
        let rel = this.childrenList[i];
        rel.deleteRelationship();
    }
};

ContentNode.prototype.detachFromAllParents = function() {
    //Remove ourselves from all our parent's child lists.
    /* BUGGED - POTENTIALLY MODIFYING THE ARRAY WHILE LOOPING THROUGH IT WHEN RELATIONSHIPS ARE DELETED */
    /*for (let rel of this.parentList) {
        console.log("Detach from all parents, one loop cycle completed.");
        rel.removeChild(this);
    }*/

    //Iterate backwards through the array, since there is a chance we will be deleting elements from the array as we are going!
    for (let i = this.parentList.length-1; i >= 0; i--) {
        let rel = this.parentList[i];
        rel.removeChild(this);
    }

    //Now, set our parent list to be empty, since of course, we have no parents anymore!
    this.parentList = [];   //Left over relationships should be garbage collected.
};
