/**
 * This file contains all the callback functions, and intergration function calls relating to implementing the
 * interact.js library into the application. Here is where we ask interact.js to provide our app with the interactive
 * functionality it provides, and then trigger the appropriate logic handling call backs when certain interaction
 * event listeners are triggered.
 */


/**
 * Define 'draggable' behaviour for all HTML elements which have the 'draggable' class associated to them.
 * This will be all of our content and resource nodes on the canvas page.
 *
 * On every 'onmove' event, a basic callback will be activated which translates the html element by however much
 * the cursor was moved. This facilitates the 'dragging' functionality.
 *
 * On every 'onend' event (triggered when the drag motion finishes) we will send a callback message to the logic
 * controller which tells it to update it's state, and allow it to perform any follow-up operations if the new node
 * translation requires it.
 *
 * ----------------------------------------------------------------------------------------------------------------
 *
 * Define 'resizeable' behaviour for all node elements as well (chained call below).
 *
 * On every 'resizemove' event, a basic callback will be activated to invoke the element change, and additionally
 * update the logical model 'size' properties to reflect any changes.
 */
interact('.draggable').draggable({
    inertia : true,     //Enable inertia for the draggable elements
    autoScroll : true,  //Dragging items to edge of the screen will scroll the page
    ignoreFrom: '.expandChildrenButton',    //Don't want to be able to drag the node when pressing the utility buttons.
    restrict: {
        restriction: "parent",  //Keep the moveable object within the boundaries of it's HTML parent element
        endOnly: true,
        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
    },
    // Callback function, triggered when the item first begins to be dragged.
    onstart : onDragStart,

    // Callback function, triggered on every dragmove event.
    onmove : onDragMove,

    // Callback function, triggered on every dragend event.
    onend : onDragMoveFinished
}).resizable({
    //Can only resize node from the bottom right.
    edges: {right: true, bottom: true},

    // keep the edges inside the parent
    restrictEdges: {
        outer: 'parent',
        endOnly: true,
    },

    //Minimum size for nodes will be equal to the default node size (starting size).
    restrictSize: {
        min: {
            width: 100, height: 50
        },
        max: {
            width: 300, height: 200
        }
    },

    //NO intertia for resizing.
    inertia: true,
}).on('resizestart', function (event) {
    let targetElem = event.target;
    targetElem.style.zIndex = currTopZIndex;   //Sets to be at the front!
    currTopZIndex++;

    //Set the transform transition to be zero, so any loitering transition settings do not affect this drag action
    targetElem.classList.add("noTransitions");

}).on('resizemove', function (event) {
    let target = event.target;
    let node = getContentNode(target);

    //FIRSTLY: If this node is 'showing info', then do not allow any resize actions. Doing so would completely break everything!
    if (node.isShowingInfo) {
        //DO NOTHING IN THIS CASE
        return;
    }

    // update the element's style
    target.style.width  = event.rect.width + 'px';
    target.style.height = event.rect.height + 'px';

    //Access the logical node and directly update the size.
    node.size.height = event.rect.height;
    node.size.width  = event.rect.width;

    //Now, we need to reposition the 'buttons' on the node itself to make sure they stay in the corners.
    //We also need to resize the 'root node border' sub-element!
    node.repositionButtons(node.size.width, node.size.height, false);   //False for no animations, we want the repositioning to occur instantly!

    /* This method will ALSO reposition the title text element of the node: if over a certain height threshold, we will
    * make the text appear centered. If under a certain threshold, then we will make the title text appear at the 'top' of
    * the node. */
    let titleTextDiv       = target.getElementsByClassName('nodeTitleText').item(0);            //Should only match one!
    if (node.size.height >= CENTRE_VERTICAL_ALIGNMENT_HEIGHT_THRESHOLD) {
        titleTextDiv.style.position = 'relative';
        titleTextDiv.style.top      = '35%';
    }
    else {
        titleTextDiv.style.position = 'static'; //Default positioning will render it at the top of the element.
    }

    //CODE NOT NEEDED FOR NOW, SINCE NOT ALLOWING RESIZE FROM TOP OR LEFT.
    //let x = (parseFloat(target.getAttribute('xTranslation')) || 0),
    //let y = (parseFloat(target.getAttribute('yTranslation')) || 0);
    // translate when resizing from top or left edges
    //x += event.deltaRect.left;
    //y += event.deltaRect.top;
    //target.style.webkitTransform = target.style.transform =
    //    'translate(' + x + 'px,' + y + 'px)';
    //target.setAttribute('xTranslation', x);
    //target.setAttribute('yTranslation', y);
    
}).on('resizeend', function(event) {
    //All we want to do here is remove the noTransitions class from the element and it's children, so that we can re-enable the default animations rule
    event.target.classList.remove("noTransitions");
    for (let childElem of event.target.children) {
        childElem.classList.remove("noTransitions");
    }
});


//Called whenever the user starts dragging an element on the screen.
function onDragStart (event) {
    console.log("Drag event fired! HTML element is "+event.target.getAttribute('id'));

    //Firstly, we want any item that is being dragged by the user to render ON TOP of everything else, so they can
    //always see what they are doing.
    let targetElem = event.target;
    targetElem.style.zIndex = currTopZIndex;   //Sets to be at the front!
    currTopZIndex++;

    //Since the user is about to move this node, we should take this oppurtunity to save the current position in the
    //'previousTranslation' variable. That way, return to previous position funcitonality will work!
    let contentNode = getContentNode(targetElem);
    contentNode.previousTranslation.x = contentNode.translation.x;
    contentNode.previousTranslation.y = contentNode.translation.y;

    //Set the transform transition to be zero, so any loitering transition settings do not affect this drag action
    targetElem.classList.add("noTransitions");

    /*Now, this dragging event will trigger the follow up event of activating all potential dropzones.
      To avoid insanely confusing structures, we will ENFORCE that this dragged node cannot be nested inside one of its children/descendents.
      Thus, we must dictate HERE that all descendant nodes are no longer potential 'dropzones' for the time being!
      To do this, we will simply remove the 'dropzone' class from all of this node's descendants. Then, when we are finished dragging this node,
      we will re-add that class to all descendants, so that they can be seen as dropzones again for other potential nodes.
    */
    //Cycle all children, and deactive them as drop zones.
    removeHtmlClassFromAllDescendants(contentNode, "dropzone");
}

//Moves the element based on mouse drag data.
function onDragMove (event) {
    let target = event.target,
        // keep the dragged translation in attributes stored directly in the HTML element object. Allows easier access for interact.js
        x = (parseFloat(target.getAttribute('xTranslation')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('yTranslation')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

    // update the position attributes, so that we can access the new position information later
    target.setAttribute('xTranslation', x);
    target.setAttribute('yTranslation', y);
}

//Callback for whenever a dragged node stops being dragged.
function onDragMoveFinished(event) {
    console.log("Drag finished event fired! HTML element is "+event.target.getAttribute('id'));

    //Access the HTMLElement object, so that we can send it back to the logic controller
    let targetElement = event.target;

    //To avoid weird interpolated rendering, we should round our translation to the nearest whole number of pixels.
    let x = Math.round(parseFloat(targetElement.getAttribute('xTranslation')) || 0);
    let y = Math.round(parseFloat(targetElement.getAttribute('yTranslation')) || 0);
    targetElement.style.webkitTransform = targetElement.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    targetElement.setAttribute('xTranslation', x);
    targetElement.setAttribute('yTranslation', y);

    //Tell the controller to update the logic object representing this html element.
    onNodeMoved(targetElement);

    //Re-enable default transitions
    targetElement.classList.remove("noTransitions");

    //Finally, re-add the 'dropzone' class to this node and all descendants, so that other nodes may use them as dropzones for nesting if they need.
    let contentNode = getContentNode(targetElement);
    addHtmlClassFromAllDescendants(contentNode, "dropzone");

    //If this node was showing info, when we finish dragging it, we should hide it's info? possibly? //TODO Figure this shit out
    if (contentNode.isShowingInfo) { contentNode.hideInfo(); }
}

/**
 * This is a function used to tell the controller that one particular node was moved by the user.
 * This is invoked by the 'on move finisheded' callback by whatever system is handling the user input and drag/drop
 * functionality.
 *
 * When this is called, it is passed the element of the node that just changed. Then, we can look for it, and apply a logical
 * update to it!
 * @param elem the HTMLElement object which refers
 */
function onNodeMoved(elem) {
    //The movement function stores the x and y movement translation values in the 'xTranslation' and 'yTranslation' attributes of the element.
    //They therefore store the 'updated' translation values, which we can parse in order to pass back to the contentNode logical object.
    let xPos  = parseFloat(elem.getAttribute('xTranslation'));
    let yPos = parseFloat(elem.getAttribute('yTranslation'));

    //Find the logical object representing this element
    let contentNode = getContentNode(elem);

    //Update the logical object, so it stays in sync. The reason we do this is to avoid string parsing constantly when doing
    //collision calculations in the logic model. Similary, we only update it at the end of the move, rather than during the drag itself,
    //becuase it's kinda pointless to do so many updates.
    contentNode.translation.y = yPos;
    contentNode.translation.x = xPos;
}




// ---------------------------------------------------------------------------------------------------------------------
// --- 'Dropzone' functionality ----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Define behaviour for any HTML Element that has the class of 'dropzone' - used for NODES that other nodes can be parented to
 * A Dropzone element means that other nodes can be dragged and dropping INTO the dropzone element, which usually means
 * that the dropzone node becomes the parent of the dragged-and-dropped node!
 *
 * Events associated with this interaction:
 * ----------------------------------------
 *
 * ondropactivate:
 * This event fires (on the DROPZONE element) whenever some other draggable element is being dragged.
 * Thus, we use this event to provide visual feedback that 'this node is a potential dropzone!'
 *
 * ondragenter:
 * This fires when a draggable object is dragged into a dropzone element. We can access both elements from the event parameter
 * to this callback.
 * Thus, we use this event to provide 'can be dropped' feedback.
 *
 * ondragleave:
 * This fires when an element is dragged OUT of a potential dropzone.
 * Thus, we use this event to remove the 'can be dropped' feedback and return it to the previous styling.
 *
 * ondrop:
 * This fires when a draggable element is dropped into a dropzone. Both elements are accessible from the event parameter
 * to this callback.
 * Thus, we use this to invoke the 'add child' method on the dropzone node, passing in the draggable node.
 *
 * ondropdeactivate:
 * This fires when a 'dropped in' node is picked back up or moved back out of the dropzone element.
 * PROBABLY NOT USED BY US, FOR NOW
 *
 */
interact('.dropzone').dropzone({
    // only accept elements matching this CSS selector
    accept: '.node',

    // Require a 25% element overlap for a drop to be possible
    overlap: 0.25,

    // --- Event Listeners -----------------------------------
    // assign callback functions which will listen for dropzone related events:
    ondropactivate: onDropzoneActivate,
    ondropdeactivate: onDropzoneDeactivate,

    ondragenter: onElementDraggedIntoDropzone,
    ondragleave: onElementDraggedOutOfDropzone,

    ondrop: onElementDropped
});

function onDropzoneActivate(event) {
    //console.log("onDropzoneActive event fired! HTML element is "+event.target.getAttribute('id'));

    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    //Okay. Let's add some visual feedback to all potential 'dropzones', whenever an item starts being dragged.
    //To do this, we will simply add a HTML Class to the element, making CSS update the style for that element!
    dropzone.classList.add("potentialDropzone");
}

function onDropzoneDeactivate(event) {
    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    //Remove visual feedback for potential drop zones
    dropzone.classList.remove("potentialDropzone");
    dropzone.classList.remove("potentialDropzoneHasItemHovering");
}

function onElementDraggedIntoDropzone(event) {
    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    dropzone.classList.add("potentialDropzoneHasItemHovering");
}

function onElementDraggedOutOfDropzone(event) {
    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    dropzone.classList.remove("potentialDropzoneHasItemHovering");
}

function onElementDropped(event) {
    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    // Okay, the element was dropped!
    // Remove the 'potential drop' visual indicators, as they are no longer needed
    dropzone.classList.remove("potentialDropzone");
    dropzone.classList.remove("potentialDropzoneHasItemHovering");

    //Gain access to both of the logical objects representing these elements.
    //We need to make the 'beingdragged' node a child of the dropzone node.
    let dropped = getContentNode(beingDragged);
    let parent  = getContentNode(dropzone);

    //If this node was previously a root node, now it is not! Since we just nested it inside some visible node.
    removeRootNode(dropped);

    parent.addChildNoLabel(dropped);
}

// ---------------------------------------------------------------------------------------------------------------------

/*
 * This set of functions define general dropzone behaviour for utility dropzones; 'potential dropzone' visual feedback.
 *
 * Note that here, we are just defining the visual feedbacks common to all utility dropzones.
 * Since different utility dropzones will do different things when you actually drop a node into them (e.g. delete,
 * move, and so on), the 'onDrop' callback just removes styling.
 *
 * Actual onDrop behaviour for specific types of utility nodes will be defined in another interact().dropzone() call,
 * with more specific selectors for each one. They will define further 'onDrop' event handlers!
 */
function utilityActivate(event) {
    //Simply add potential utility dropzone feedback
    event.target.classList.add("potentialUtilityDropzone");
}
function utilityDeactivate(event) {
    let dropzone     = event.target;

    //Remove visual feedback for potential drop zones
    dropzone.classList.remove("potentialUtilityDropzone");
    dropzone.classList.remove("potentialUtilityDropzoneHasItemHovering");
}
function utilityDragEnter(event) {
    let dropzone     = event.target;
    dropzone.classList.add("potentialUtilityDropzoneHasItemHovering");
}
function utilityDragLeave(event) {
    let dropzone     = event.target;
    dropzone.classList.remove("potentialUtilityDropzoneHasItemHovering");
}
function utilityDropVisualFeedback(event) {
    let dropzone     = event.target;
    dropzone.classList.remove("potentialUtilityDropzone");
    dropzone.classList.remove("potentialUtilityDropzoneHasItemHovering");
}

interact('#detachNodeDropZone').dropzone({
    // only accept elements matching this CSS selector
    accept: '.node',

    // Require a 25% element overlap for a drop to be possible
    overlap: 0.25,

    // --- Event Listeners -----------------------------------
    // assign callback functions which will listen for dropzone related events:
    ondropactivate: utilityActivate,
    ondropdeactivate: utilityDeactivate,
    ondragenter: utilityDragEnter,
    ondragleave: utilityDragLeave,

    ondrop: function(event) {
        let draggedNode = getContentNode(event.relatedTarget);

        //Nodes that are actively detached via the interface will be defined as a new root node, so that it
        //doesn't just 'disappear' confusingly.
        //Add as a root node to the canvas state, if it wasn't already there.
        addNewRootNode(draggedNode);

        //Simply detach this node from all of it's parents!
        draggedNode.detachFromAllParents();

        //Finally, animate the node back to it's previous position before the drag-and-drop
        draggedNode.returnToPreviousPosition(true);
    }
});

/**
 * Define behaviour of delete-node utility dropzone. Basically, when you drop something into this
 * it will ask the canvas controller to simply delete the node!
 */
interact('#deleteNodeDropZone').dropzone({
    // only accept elements matching this CSS selector
    accept: '.node',

    // Require a 25% element overlap for a drop to be possible
    overlap: 0.25,

    ondropactivate: utilityActivate,
    ondropdeactivate: utilityDeactivate,
    ondragenter: utilityDragEnter,
    ondragleave: utilityDragLeave,

    ondrop: function(event) {
        //Gain access to the logic object representing the dropped html element, I.e. the node
        let beingDragged = event.relatedTarget;
        let dropped = getContentNode(beingDragged);

        //Now, simply ask the canvas Controller to permanently delete the node. the CC will define
        //how to handle deleation operations!
        //deleteContentNode(dropped, false);  //Do not splice the tree
        deleteContentNode(dropped, true); //splice the tree
    }
});

// ---------------------------------------------------------------------------------------------------------------------
// --- Sidebar draggable section ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

interact('.draggable-sidebar-node').draggable({
    inertia : true,     //Enable inertia for the draggable elements
    autoScroll : true,  //Dragging items to edge of the screen will scroll the page
    ignoreFrom: '.expandChildrenButton',    //Don't want to be able to drag the node when pressing the utility buttons.
    restrict: {
        endOnly: true,
        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
    },
    // Callback function, triggered when the item first begins to be dragged.
    onstart : sidebarOnDragStart,

    // Callback function, triggered on every dragmove event.
    onmove : sidebarOnDragMove,

    // Callback function, triggered on every dragend event.
    onend : sidebarOnDragMoveFinished
});

function sidebarOnDragStart(event) {
    console.log("Drag event fired! HTML element is "+event.target.getAttribute('id'));

    //Firstly, we want any item that is being dragged by the user to render ON TOP of everything else, so they can
    //always see what they are doing.
    let target = event.target;
    let sidebarElem = getSidebarElement(target);
    target.style.zIndex = currTopZIndex;   //Sets to be at the front!
    currTopZIndex++;

    //Set up the html element
    target.setAttribute("nodeId", sidebarElem.nodeId);
    target.setAttribute("xTranslation", target.offsetLeft);
    target.setAttribute("yTranslation", target.offsetTop);

    let wrapper = document.getElementById("mainAppContainer");
    wrapper.appendChild(target);
    target.style.position = 'absolute';

    //Since the user is about to move this node, we should take this oppurtunity to save the current position in the
    //'previousTranslation' variable. That way, return to previous position funcitonality will work!
    sidebarElem.previousTranslation.x = sidebarElem.translation.x;
    sidebarElem.previousTranslation.y = sidebarElem.translation.y;

    //finally, make the canvas a dropzone
    addSidebarDropzoneClassFromCanvas();
}

function sidebarOnDragMove(event) {
    let target = event.target,
        // keep the dragged translation in attributes stored directly in the HTML element object. Allows easier access for interact.js
        x = (parseFloat(target.getAttribute('xTranslation')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('yTranslation')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

    // update the position attributes, so that we can access the new position information later
    target.setAttribute('xTranslation', x);
    target.setAttribute('yTranslation', y);
}

function sidebarOnDragMoveFinished(event) {
    console.log("Drag finished event fired! HTML element is "+event.target.getAttribute('id'));

    let targetElement = event.target;

    let wrapper = document.getElementById("mainAppContainer");
    wrapper.removeChild(targetElement);

    //no longer draggin - fuck off the sidebar dropzone class from the canvas!
    removeSidebarDropzoneClassFromCanvas();

    refreshSidebar(canvasState.contentNodeList);
}


// ---------------------------------------------------------------------------------------------------------------------
// --- Sidebar dropzone section ----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

interact('.sidebar-element-dropzone').dropzone({
    // only accept elements matching this CSS selector
    accept: '.sidebar-element',

    // Require a 25% element overlap for a drop to be possible
    overlap: 0.25,

    // --- Event Listeners -----------------------------------
    // assign callback functions which will listen for dropzone related events:
    ondropactivate: sidebarOnDropzoneActivate,
    ondropdeactivate: sidebarOnDropzoneDeactivate,

    ondragenter: sidebarOnElementDraggedIntoDropzone,
    ondragleave: sidebarOnElementDraggedOutOfDropzone,

    ondrop: sidebarOnElementDropped
});

function sidebarOnDropzoneActivate(event) {
    console.log("sidebarOnDropzoneActive event fired! HTML element is "+event.target.getAttribute('id'));

    let dropzone     = event.target;

    //Okay. Let's add some visual feedback to all potential 'dropzones', whenever an item starts being dragged.
    //To do this, we will simply add a HTML Class to the element, making CSS update the style for that element!
    dropzone.classList.add("potentialSidebarDropzone");
}

function sidebarOnDropzoneDeactivate(event) {
    let dropzone     = event.target;

    //Remove visual feedback for potential drop zones
    dropzone.classList.remove("potentialSidebarDropzone");
    dropzone.classList.remove("potentialSidebarDropzoneHasItemHovering");
}

function sidebarOnElementDraggedIntoDropzone(event) {
    let dropzone     = event.target;

    dropzone.classList.add("potentialSidebarDropzoneHasItemHovering");
}

function sidebarOnElementDraggedOutOfDropzone(event) {
    let dropzone     = event.target;

    dropzone.classList.remove("potentialSidebarDropzoneHasItemHovering");
}

function sidebarOnElementDropped(event) {
    let beingDragged = event.relatedTarget;
    let dropzone     = event.target;

    // Okay, the element was dropped!
    // Remove the 'potential drop' visual indicators, as they are no longer needed
    dropzone.classList.remove("potentialSidebarDropzone");
    dropzone.classList.remove("potentialSidebarDropzoneHasItemHovering");

    //make a new node for the thing that just got dropped and pass the new x y to dump it where the mouse was
    reinstantiateExistingNode(beingDragged.getAttribute("nodeId"), parseFloat(beingDragged.getAttribute("xTranslation"))-240, parseFloat(beingDragged.getAttribute("yTranslation"))); //Adjust left by width of canvas
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Canvas dragging functionality -----------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

interact('#drawingCanvas').draggable({
    inertia : true,     //Enable inertia for the draggable elements
    autoScroll : true,  //Dragging items to edge of the screen will scroll the page
    ignoreFrom: '.node',    //Don't want to be able to drag the node when pressing the utility buttons.
    restrict: {
        endOnly: true,
        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
    },
    // Callback function, triggered when the item first begins to be dragged.
    onstart : function() {
        //Do nothing.
    },

    // Callback function, triggered on every dragmove event.
    onmove : function(event) {
        //Scroll the window element by the moved amount.
        let windowElem = document.getElementById("canvasWindow");

        //Scroll the window!
        windowElem.scrollTop -= event.dy;
        windowElem.scrollLeft -= event.dx;
    },

    // Callback function, triggered on every dragend event.
    onend : function() {
        //Do nothing.
    }
});