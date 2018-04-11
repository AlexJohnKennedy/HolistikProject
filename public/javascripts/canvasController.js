
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
    let newNode = new ContentNode(newElemDetails.elementReference, newElemDetails.elementId, newElemDetails.x, newElemDetails.y, newElemDetails.height, newElemDetails.width, newElemDetails.observer);
    canvasState.contentNodeList.push(newNode);
    addNewRootNode(newNode);    //Any newly created node is automatically said to be an additional root node, by design.

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

    //Set up an observer for this HTML element, so that we can respond whenever the element is moved
    let observer = setupElementObserver(newElem);

    //Return the html element we just made, and it's id string.
    return {
        elementReference : newElem,
        elementId        : idString,
        x                : xPos,
        y                : yPos,
        height           : defaultNodeSize.height,
        width            : defaultNodeSize.width,
        observer         : observer
    };
}

function setupElementObserver(element) {
    console.log("Setting up an observer for the HTML element just created!");
    //Set up the configuration options object, which will determine what DOM changes are listened for by this observer.
    let config = { attributes : true }; //{ attributeFilter : ["xTranslation", "yTranslation"] };   //Only listen for transform updates!

    //TODO: figure out how to use the attribute filter option to only listen for transform changes, not ALL changes

    //Create an observer object, and pass in the callback function it will invoke when a listened event fires.
    let observer = new MutationObserver(nodeMovedCallback);

    // Start observing the target node for configured mutations
    observer.observe(element, config);

    return observer;
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

    //Remove the logical node from the rootNode list, if it is there.
    index = canvasState.rootNodes.indexOf(node);
    if (index != -1) {
        canvasState.rootNodes.splice(index,1);

        //Now, if the node that was just deleted was a root node, then we should add the children of that root node as new
        //root nodes, so long as it was already visible. This ensures that children don't randomly disappear.
        for (let rel of node.childrenList) {
            for (let child of rel.children) {
                if (child.isVisible && canvasState.rootNodes.indexOf(child) === -1) {
                    canvasState.rootNodes.push(child);
                }
            }
        }
    }

    //Okay, now let's just directly delete this node and make all of it's children rootNodes of the current context!
    node.detachFromAllChildren();
    node.detachFromAllParents();

    //Okay. Now we can delete the node completely!

    //Get the node's DOM mutation listener to stop observing.
    node.mutationObserver.disconnect();

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

    rebuildVisibility();
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


//----------------------------------------------------------------------------------------------------------------------
//--- Visibility management and context switching ----------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------

/**
 * This function simply adds a passed content node to the root node collection.
 *
 * Being a root node on the given canvas context ENSURES that the node is visible. Thus, whenever a node is added as a
 * root node, it is automatically made 'visible' as well. Furthermore, the descendants of root nodes are determined as
 * visible if their parent is expanded, vsiible, and they are not greater than the 'view depth' steps from the root node.
 *
 * Thus, to avoid cluttering the interface, any node that has just recently been added to the canvas state should be
 * 'collapsed' proir to being added.
 *
 * If the passed node was already a root node, this function has no effect.
 *
 * @param node
 */
function addNewRootNode(node) {
    //Okay. Firstly, we need to check if the node was already a root node in teh given context.
    let index = canvasState.rootNodes.indexOf(node);
    if (index === -1) {
        //Was already in the root node list! Do nothing.
        return;
    }

    //Alright. Let's push this node into the root node list
    canvasState.rootNodes.push(node);

    //Now, collapse the node, so that it's children do not clutter the screen, and the counters can reset.
    node.collapse();

    //Now that hte state has changed, we should rebuild the visibility
    rebuildVisibility();
}

/**
 * This method is invoked whenever the node state/structure is updated. It rebuilds an understanding of what nodes are
 * visible on the canvas, and which nodes are not, FROM SCRATCH, whenever it is invoked.
 *
 * Advantage of doing this over the state-tracking method is much easier, encapsulated logic.
 * Disadvantage of this method is that we have to do 2 full scans of all nodes which exist. O(n) could be slow for every
 * single node change.
 */
function rebuildVisibility() {
    let visibleNodes = [];     //New list, that is going to be used to store references to nodes we calculate as 'visible'

    // Set the visibility flag for all nodes to be invisible, so we can then calculate the visibility from roots
    for (node of canvasState.contentNodeList) {
        node.isVisible = false;
    }

    // Searching from all roots, explore their children so long as we don't exceed the view depth. From this, determine visible nodes!
    for (let root of canvasState.rootNodes) {
        //Begin a recursive depth first search from this root. Each node we reach will be set as 'visible'.
        //The search will ONLY recurse if the viewDepth is greater than zero, and if the current node is expanded.
        traverseForVisibility(root, canvasState.viewDepth);
    }

    //Okay, by now, all the nodes in existence should have their 'isVisible' flag set correctly. Thus, we can iterate
    //through all of the nodes and set their visibility accordingly. Equally, we can tell every node to render it's
    //parent-lines if and only if each parent is visible and expanded!
    for (node of canvasState.contentNodeList) {
        if (node.isVisible) {
            node.makeVisible();     //Show the node!
        }
        else {
            node.makeInvisible();   //Hide the node!
        }
    }
}

function traverseForVisibility(curr, depth) {
    curr.isVisible = true;

    //If the depth is not zero yet, and the current node is 'expanded' then keep searching deeper.
    if (depth > 0 && curr.isExpanded) {
        for (let rel of curr.childrenList) {
            for (let child of rel.children) {
                //Recurse within this child
                traverseForVisibility(child, depth - 1);
            }
        }
    }
}


//----------------------------------------------------------------------------------------------------------------------
//--- Additional callback functions ------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
/**
 * This function is being used as the callback for handling DOM Mutation events for all content nodes.
 * In other words, whenever a node is moved, this will be invoked so that we can update that node's lines.
 *
 * See the following for reference of how this stuff works:
 * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 * https://dom.spec.whatwg.org/#mutationobserver
 * https://dom.spec.whatwg.org/#mutationrecord
 *
 * @param mutationsList
 */
function nodeMovedCallback(mutationsList) {
    //console.log("Transform change detected!");
    //For these observations, we are only listening for attribute updates.
    //Thus, the mutation.type is always going to 'attributes'
    //Equally, we are only listening for updates to the 'transform' attribute, thus, it should only fire when a node has moved.
    for (let mutation of mutationsList) {
        let movedElement = mutation.target;
        let movedNode    = getContentNode(movedElement);
        //Ask all of the node's child relationships to update the line!
        for (let rel of movedNode.childrenList) {
            rel.onParentMoved();
        }
        //Ask all of the node's parent relationships to update the line!
        for (let rel of movedNode.parentList) {
            rel.onChildMoved(movedNode);
        }
    }
}




