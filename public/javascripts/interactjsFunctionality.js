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
    restrict: {
        restriction: "parent",  //Keep the moveable object within the boundaries of it's HTML parent element
        endOnly: true,
        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
    },
    // Callback function, triggered on every dragmove event.
    onmove : onDragMove,

    // Callback function, triggered on every dragend event.
    onend : onDragMoveFinished
});

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
    //Access the HTMLElement object, so that we can send it back to the logic controller
    let targetElement = event.target;

    //Tell the controller to update the logic object representing this html element.
    onNodeMoved(targetElement);
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

    contentNode.translation.y  = yPos;
    contentNode.translation.x = xPos;

    //DEBUG
    alert("The new translation of this node is considered to be y = "+yPos+" x = "+xPos);
}

// this is used later in the resizing and gesture demos
//window.dragMoveListener = onDragMove;