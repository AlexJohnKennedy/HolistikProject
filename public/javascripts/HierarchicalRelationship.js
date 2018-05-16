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

    this.isVisible  = false;
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

    //Okay! We are officially going to add a new child.
    this.children.push(node);

    //Now, we need to add THIS RELATIONSHIP as a parent reference into the new child's parentList, so that upwards tree traversal is also possible!
    node.parentList.push(this);

    //Next, we need to create a new 'RenderLine', which is handle the logic for drawing the connecting lines between the parent and the new child.
    let newLine = new RenderLine(this.parentNode, node, this.displayedLabel, this.categoryLabel);
    this.lineList.push(newLine);

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

    newlyAddedNode.moveNodeTo(parentXpos, newChildY, true); //True for animations
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

        //Delete the line associated with the child. This can be determined by it being the line with 'destNode' equal to the node being removed.
        //TODO -- refactor the way HierarchicalRelationship stores children & lines to more efficiently locate one when we have the other.
        //TODO -- at the moment they are stored in separate arrays, and located independently, even though each line is logically associated with a child node.
        //TODO -- (which is really silly)
        for (let i=0; i < this.lineList.length; i++) {
            console.log("We are removing a child, and searching for the corresponding svg line now.");
            let line = this.lineList[i];
            if (line.destNode.idString === node.idString) {
                //Found the right line! Let's delete it.
                line.deleteLine();
                this.lineList.splice(i,1);
                break;
            }
        }
    }
};

/**
 * This function is used to completely remove this relationship from all associated nodes, and from memory entirely!
 * Calling this function will:
 * a) remove reference to this from all children's parentList.
 * b) remove reference to this from the parent's childList.
 * c) delete all of the svg lines that this relationship object was keeping track of
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

    //Delete all the SVG lines
    for (let line of this.lineList) {
        line.deleteLine();
    }
    this.lineList = [];
};

HierarchicalRelationship.prototype.onParentMoved = function() {
    //Tell all of our lines to update themselves
    for (let line of this.lineList) {
        line.update();
    }
};

HierarchicalRelationship.prototype.onChildMoved = function(moved) {
    //Find out which line had this child in it
    for (let i=0; i < this.lineList.length; i++) {
        let line = this.lineList[i];
        if (line.destNode.idString === moved.idString) {
            //Found the right line! Let's udpate it.
            line.update();
            break;
        }
    }
};

//DEPRECEATED
HierarchicalRelationship.prototype.hideAllRelationshipLines = function() {
    for (let line of this.lineList) {
        line.hideLine();
    }

    this.isVisible = false;
};

//DEPRECEATED
HierarchicalRelationship.prototype.showLinesIfChildVisible = function() {
    for (let line of this.lineList) {
        if (line.destNode.isVisible) {
            line.showLine();
        }
    }
};

