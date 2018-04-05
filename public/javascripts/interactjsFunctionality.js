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
 */
interact('.draggable').draggable({
    inertia : true,     //Enable inertia for the draggable elements
    restrict: {
        restriction: "parent",  //Keep the moveable object within the boundaries of it's HTML parent element
        endOnly: true,
        elementRect: {top: 0, left: 0, bottom: 1, right: 1}
    },
    // call this function on every dragmove event
    onmove: dragMoveListener,
    // call this function on every dragend event
    onend: function (event) {
        let textEl = event.target.querySelector('p');

        textEl && (textEl.textContent =
            'moved a distance of '
            + (Math.sqrt(Math.pow(event.pageX - event.x0, 2) +
            Math.pow(event.pageY - event.y0, 2) | 0))
                .toFixed(2) + 'px');
    }
});

function dragMoveListener (event) {
    let target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// this is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener;