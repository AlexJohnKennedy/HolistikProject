// ---------------------------------------------------------------------------------------------------------------------
// --- ContentNode 'class' definition (actually a javascript 'prototype') ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
let showingNode = null;     //global reference in this script to manage which node is 'showing' information.

/** This is a definition of a constructor 'function' which defines an object prototype structure, representing a logical
 *  content node, which currently exists on the drawing canvas. Using this we can treat 'ContentNode' as somewhat of a
 *  class.
 * @constructor
 */
function ContentNode(element, id, x, y, height, width, mutationObserver) {
    // --- Object properties ---
    this.htmlElement     = element;
    this.idString        = id;
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
    this.descriptionText = defaultNodeDesc;

    // --- Properties for managing whether or not a node is shown on the canvas ---
    this.isVisible       = true;    //New nodes are always deemed visible (for now)
    this.isExpanded      = true;    //New nodes are always in the expanded state, as they cannot have children yet anyway.
    this.isShowingInfo   = false;
    this.numViewedBy     = -1;      //This tracks how many parents are supplying 'visibility' to the node at the current time.
    //DEPRECEATED                  //-1 indicates that the node is independently visible (i.e. it is not visible based on a parent viewing it)
                                    //New nodes are always set to be root nodes, thus we can initialise as -1.

    // --- Relationship properties ---
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
 * @param animate boolean value to specify if the node should use it's animation setting, or move instantly.
 */
ContentNode.prototype.moveNodeTo = function(x, y, animate) {
    if (animate) {
        //If we are animating, make sure the 'noTransitions' class is removed from the object, so that any defined CSS
        //transitions on the element are allowed to play.
        //NOTE: If no transition is set with CSS rules for a node, then no animation will play, depsite the animate flag's value!
        this.htmlElement.classList.remove("noTransitions");
    }
    else {
        //if animate is set to false, we must ensure the noTransitions override rule IS applied.
        this.htmlElement.classList.add("noTransitions");    //WILL TEMPORARILY OVERWRITE ALL CSS TRANSITIONS ON THE OBJECT (see the CSS)
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

    //Ask the controlling context to detect possible overlaps after this move!
    detectOverlaps(this);
};

ContentNode.prototype.moveNodeTo_noStateChange = function(x, y, animate) {
    if (animate) {
        //If we are animating, make sure the 'noTransitions' class is removed from the object, so that any defined CSS
        //transitions on the element are allowed to play.
        //NOTE: If no transition is set with CSS rules for a node, then no animation will play, depsite the animate flag's value!
        this.htmlElement.classList.remove("noTransitions");
    }
    else {
        //if animate is set to false, we must ensure the noTransitions override rule IS applied.
        this.htmlElement.classList.add("noTransitions");    //WILL TEMPORARILY OVERWRITE ALL CSS TRANSITIONS ON THE OBJECT (see the CSS)
    }

    //Trigger the CSS animation by setting a new translation.
    this.htmlElement.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    //Update the html element tracking of the translation as well. (used by the interact.js framework)
    this.htmlElement.setAttribute("xTranslation", x.toString());
    this.htmlElement.setAttribute("yTranslation", y.toString());
    detectOverlaps(this);
};

/**
 * Moves or animates the node back to wherever it was prior to the last drag move by the user!
 * @param animateTime
 */
ContentNode.prototype.returnToPreviousPosition = function(animate) {
    console.log(this.idString+" was asked to move back to it's previous position, which is x = "+this.previousTranslation.x+" y = "+this.previousTranslation.y);
    this.moveNodeTo(this.previousTranslation.x, this.previousTranslation.y, animate);
};

/**
 * Used to actively resize nodes and apply visible changes. Should subsequently update the state to the result
 */
ContentNode.prototype.resizeNode = function(newWidth, newHeight, animate) {
    if (animate) {
        //If we are animating, make sure the 'noTransitions' class is removed from the object, so that any defined CSS
        //transitions on the element are allowed to play.
        //NOTE: If no transition is set with CSS rules for a node, then no animation will play, depsite the animate flag's value!
        this.htmlElement.classList.remove("noTransitions");
    }
    else {
        //if animate is set to false, we must ensure the noTransitions override rule IS applied.
        this.htmlElement.classList.add("noTransitions");    //WILL TEMPORARILY OVERWRITE ALL CSS TRANSITIONS ON THE OBJECT (see the CSS)
    }

    //Trigger the CSS animation by setting a height and width value.
    this.htmlElement.style.height = newHeight+"px";
    this.htmlElement.style.width  = newWidth+"px";

    this.size.height = newHeight;
    this.size.width  = newWidth;

    this.repositionButtons(newWidth, newHeight, animate);
    detectOverlaps(this);
};

ContentNode.prototype.resizeNode_noStateChange = function(newWidth, newHeight, animate) {
    if (animate) {
        //If we are animating, make sure the 'noTransitions' class is removed from the object, so that any defined CSS
        //transitions on the element are allowed to play.
        //NOTE: If no transition is set with CSS rules for a node, then no animation will play, depsite the animate flag's value!
        this.htmlElement.classList.remove("noTransitions");
    }
    else {
        //if animate is set to false, we must ensure the noTransitions override rule IS applied.
        this.htmlElement.classList.add("noTransitions");    //WILL TEMPORARILY OVERWRITE ALL CSS TRANSITIONS ON THE OBJECT (see the CSS)
    }

    //Trigger the CSS animation by setting a height and width value.
    this.htmlElement.style.height = newHeight+"px";
    this.htmlElement.style.width  = newWidth+"px";

    this.repositionButtons(newWidth, newHeight, animate);
    detectOverlaps(this);
};

/**
 * This method uses the current logic state and repositions the utility buttons and the root node border relative to the
 * node itself. This is intended to be called whenever the node is Re-sized (aka changes sizes) becuase other wise the
 * button placements will desync.
 */
ContentNode.prototype.repositionButtons = function(width, height, animate) {
    let target = this.htmlElement;
    let expandChildrenElem = target.getElementsByClassName('expandChildrenButton').item(0);     //Should only match one!
    let showInfoElem       = target.getElementsByClassName('showInfoButton').item(0);           //Should only match one!
    let rootNodeBorder     = target.getElementsByClassName('rootNodeBorderElement').item(0);    //Should only match one!
    let nodeDescription    = target.getElementsByClassName('nodeDescriptionText').item(0);      //Should only match one!
    let editButton         = target.getElementsByClassName('editButton').item(0);               //Should only match one!

    if (animate) {
        //If we are animating, make sure the 'noTransitions' class is removed from the object, so that any defined CSS
        //transitions on the element are allowed to play.
        //NOTE: If no transition is set with CSS rules for a node, then no animation will play, depsite the animate flag's value!
        expandChildrenElem.classList.remove("noTransitions");
        showInfoElem.classList.remove("noTransitions");
        rootNodeBorder.classList.remove("noTransitions");
        nodeDescription.classList.remove("noTransitions");
        editButton.classList.remove("noTransitions");

    }
    else {
        //if animate is set to false, we must ensure the noTransitions override rule IS applied.
        expandChildrenElem.classList.add("noTransitions");
        showInfoElem.classList.add("noTransitions");
        rootNodeBorder.classList.add("noTransitions");
        nodeDescription.classList.add("noTransitions");    //WILL TEMPORARILY OVERWRITE ALL CSS TRANSITIONS ON THE OBJECT (see the CSS)
        editButton.classList.add("noTransitions");
    }

    expandChildrenElem.style.top = (height-17)+'px';   //Should always be 6 pixels from the left, and 17 from the bottom
    expandChildrenElem.style.left = 6+'px';
    showInfoElem.style.left = (width-20)+'px';    //Should always be 20 pixels from the right, and 17 from the bottom
    showInfoElem.style.top  = (height-17)+'px';
    editButton.style.left = (width-40)+'px';    //Should always be 20 pixels from the right, and 17 from the bottom
    editButton.style.top  = (height-17)+'px';
    rootNodeBorder.style.width = (width+8)+'px';  //Border element should always be 8 pixels taller and wider.
    rootNodeBorder.style.height = (height+8)+'px';

    nodeDescription.style.height = (height-40)+'px';
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
    this.titleText = name.trim();

    let textelem = this.htmlElement.getElementsByClassName('nodeTitleText').item(0);
    textelem.innerHTML = name;
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

            //Still need to rebuild the visibility, none the less
            rebuildVisibility();

            return;
        }
    }

    //If we got here, that means we need to create a new object, and this node does not already have a child with this
    //label
    let rel = new HierarchicalRelationship(relationshipLabel, this);    //Assign this node to be the parent, of course!
    this.childrenList.push(rel);    //Add the new relationship object to the list of children aggregators.
    rel.addChild(node);

    //Rebuild the visibility since the node structure has now changed!
    rebuildVisibility();
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

    //Rebuild the visibility since the node structure has now changed!
    rebuildVisibility();
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

    //Rebuild the visibility since the node structure has now changed!
    rebuildVisibility();
};

/** DEPRECEATED VERSION: THIS METHOD WAS WRITTEN WHEN WE WERE GOING TO DO THE 'COUNTER' METHOD FOR CONTROLLING VISIBILITY.
 *                       NOW, WE WILL SIMPLY REBUILD THE VISIBILITY STATE WITH A 'REBUILD' CALLBACK WHENEVER A NODE STATE
 *                       CHANGES.
 * This method 'collapses' a node, so that it no longer displays it's children.
 *
 * Performing a collapse has multiple ramifications on the state of the node's descendants, and the renderLine's associated with this node.
 *
 * Firstly, we need to decrement all of our direct children's 'viewed by' counter. If this causes our child's counter to reach zero,
 * we will hide that node.
 *
 * Secondly, we need to inform all of our children relationships to hide their renderLine objects, since now the lines should not be shown!
 */
ContentNode.prototype.collapseOLD = function() {
    //First, let's just update this nodes state trackers.
    this.isExpanded = false;

    //We only need to decrement our children counters

    //Now, traverse to all of our DIRECT children and decrement their counter!
    for (let rel of this.childrenList) {
        for (let child of rel.children) {
            child.decrementNumViewedBy(this);   //Pass in reference to the guy who stopped viewing, incase the tracking is based on storing references to viewers.
        }
        //Now, traverse to all of our child relationships and inform it to hide all of their lines.
        rel.hideAllRelationshipLines();
    }
};

/**
 * This function is invoked by this node's parent when it stops 'viewing' it.
 * @param parent
 */
ContentNode.prototype.decrementNumViewedBy = function(parent) {
    //DEPRECEATED TECHNIQUE
};

ContentNode.prototype.collapse = function() {
    //No matter what visibility calculations are to follow, we know that we will need to hide our child relationship lines!
    //for (let rel of this.childrenList) {
    //    rel.hideAllRelationshipLines();
    //}

    //Update the isExpanded state flag, so that the recalculation callback will correctly handle the new state!
    this.isExpanded = false;

    //Now we have to invoke the callback to tell the canvas state to recalculate and reassign the visibility of all nodes.
    rebuildVisibility();
};

ContentNode.prototype.expand = function() {
    //Set this node's state flag to represent it's expansion
    this.isExpanded = true;

    //Invoke the rebuild visibility calculation BEFORE we decide which render lines to display.
    //This needs to be done first because the childRelationship lines should only show if both this node AND
    //the child node is visible. So, even if this is expanded, the lines may still have to remain hidden:
    //e.g. if their is a visibility filter hiding the children, or if the children are below the maximum view depth,
    //then they will still not show.
    rebuildVisibility();

    //NOW we can check if we need to show our children lines again!
    //if (this.isVisible) {
    //    for (let rel of this.childrenList) {
    //        rel.showLinesIfChildVisible();
    //    }
    //}
};

ContentNode.prototype.makeVisible = function() {
    //Okay, let's make this node visible!
    this.htmlElement.style.display = "block";

    //Now, if we are expanded, we should render our child lines.
    //if (this.isExpanded) {
    //    for (let rel of this.childrenList) {
    //        rel.showLinesIfChildVisible();
    //    }
    //}
};

ContentNode.prototype.makeInvisible = function() {
    //Okay, let's hide all of this.
    this.htmlElement.style.display = "none";
};

/**
 * This method makes the node show it's internal information. When called, the following will happen:
 *      a) The node's html element will remove 'draggable' from it's class list, so that the showing info element becomes
 *         static and can no longer be dragged - The draggable class will be re added when hideInfo() is called.
 *      b) The node will physically expand to fill (almost) the size of the canvas, and centre itself on the canvas
 *      c) The node's text boxes will become editable text entries, allowing the user to edit the node content.
 *
 *      (Future) - will show references/names to attatched resources.
 */
ContentNode.prototype.showInfo = function() {
    //Update the internal state, and update the global reference to the 'showing info' node. That way we can ensure only
    //one node is ever showing information at once.
    this.isShowingInfo = true;
    if (showingNode !== null) {
        showingNode.hideInfo();
    }
    showingNode = this;

    //Bring to front.
    this.htmlElement.style.zIndex = currTopZIndex;
    currTopZIndex++;

    this.htmlElement.classList.remove("draggable");   //Remove the draggable attribute so that the showing info node cannot be dragged.

    let titleText = this.htmlElement.getElementsByClassName('nodeTitleText').item(0);
    titleText.style.position = 'static';     //Move title text back to top of node

    let descText  = this.htmlElement.getElementsByClassName('nodeDescriptionText').item(0);
    descText.style.opacity = "1";

    //Okay, calculate the appropriate size for the node to become, based on the current canvas size.
    let height = 400;
    let width  = 400;

    //Okay, calculate the central position of the canvas, based on the current canvas size.
    let x = 50;
    let y = 50;

    //Now, animate the node to go to that position!
    this.moveNodeTo_noStateChange(x, y, true);              //True to animate. Relying on CSS rules to have transition timings set (0.3)
    this.resizeNode_noStateChange(width, height, true);
};

ContentNode.prototype.hideInfo = function() {
    this.isShowingInfo = false;
    showingNode = null;

    let descText  = this.htmlElement.getElementsByClassName('nodeDescriptionText').item(0);
    descText.style.opacity = "0";

    let titleText = this.htmlElement.getElementsByClassName('nodeTitleText').item(0);

    //Move title text back to centre if above threshold
    if (this.size.height >= CENTRE_VERTICAL_ALIGNMENT_HEIGHT_THRESHOLD) {
        titleText.style.position = 'relative';
    }
    titleText.style.cursor   = '';      //Delete the cursor property so it goes back to not affecting the cursor.

    //Move the node back to it's 'position', and resize it back to the 'size'
    this.moveNodeTo_noStateChange(this.translation.x, this.translation.y, true);
    this.resizeNode_noStateChange(this.size.width, this.size.height, true);

    this.htmlElement.classList.add("draggable");
};

/**
 * This function is called and is passed a node.
 *
 * It will build a brand new, clean, pop-up HTML form which basically allows you to enter in node title and description.
 *
 * When the user submits the form, it will apply the input changes to the passed node. If the user cancels, then no
 * changes will be made to the node's content!
 */
ContentNode.prototype.editNodeContent = function() {
    console.log("editNodeContent Called!");
    //Build a form element, and render it on top of the canvas.

    //fully sick blackout effect
    let blackoutElem = document.getElementById("fade");
    blackoutElem.style.display = "block";

    //make the node editing partial visible - do i need to make it visible at the end?
    let editWindow = document.getElementById("popupEditWindow");
    editWindow.style.display = "block";

    //title
    let titleInput = editWindow.getElementById("editTitle");
    titleInput.setAttribute("value", this.titleText);

    //desc
    let descInput = editWindow.getElementById("editDescription");
    descInput.setAttribute("value", this.descriptionText);
};

/**
 * update the current node when the users saves their changes
 */
function updateNodeData() {
    let editWindow = document.getElementById("popupEditWindow");

    let titleInput = editWindow.getElementById("editTitle");
    let descInput = editWindow.getElementById("editDescription");

    let newTitle = titleInput.getAttribute("value");
    let newDesc = descInput.getAttribute("value");

    //assign new data
    this.titleText = newTitle;
    this.descriptionText = newDesc;

    console.log("node has been updated! new title: " + this.titleText + ", new desc: " + this.descriptionText);
}
