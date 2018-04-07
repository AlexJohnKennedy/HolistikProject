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
 */
interact('.draggable').draggable({
    inertia : true,     //Enable inertia for the draggable elements
    autoScroll : true,  //Dragging items to edge of the screen will scroll the page
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
});



//Called whenever the user starts dragging an element on the screen.
let currTopZIndex = 1;      //TODO figure out a non-cancerous overflow-vulnerable way of tracking the 'top' of the render stack
function onDragStart (event) {
    console.log("Drag event fired! HTML element is "+event.target.getAttribute('id'));

    //Firstly, we want any item that is being dragged by the user to render ON TOP of everything else, so they can
    //always see what they are doing.
    let targetElem = event.target;
    targetElem.style.zIndex = currTopZIndex;   //Sets to be at the front!
    currTopZIndex++;

    /*Now, this dragging event will trigger the follow up event of activating all potential dropzones.
      To avoid insanely confusing structures, we will ENFORCE that this dragged node cannot be nested inside one of its children/descendents.
      Thus, we must dictate HERE that all descendant nodes are no longer potential 'dropzones' for the time being!
      To do this, we will simply remove the 'dropzone' class from all of this node's descendants. Then, when we are finished dragging this node,
      we will re-add that class to all descendants, so that they can be seen as dropzones again for other potential nodes.
    */

    //Cycle all children, and deactive them as drop zones.
    let contentNode = getContentNode(targetElem);
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

    //Tell the controller to update the logic object representing this html element.
    onNodeMoved(targetElement);

    //Finally, re-add the 'dropzone' class to this node and all descendants, so that other nodes may use them as dropzones for nesting if they need.
    let contentNode = getContentNode(targetElement);
    addHtmlClassFromAllDescendants(contentNode, "dropzone");
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
 * Define behaviour for any HTML Element that has the class of 'dropzone'.
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
    console.log("onDropzoneActive event fired! HTML element is "+event.target.getAttribute('id'));

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

    parent.addChildNoLabel(dropped);
}