
//Create local 'state' objects to remember all the canvas related logic objects.
//This will be a storage of all the content nodes, and all the 'resource' nodes (To be implemented later..)
//Access to the relationship objects will be done VIA the content nodes, and they cannot exist in isolation.
//(See the OOP modelling for nodes)
const canvasState = {
    contentNodeList : [],   //Initially, there are no nodes! Of course there must be some 'load' function to reload previous projects.
    resourceNodeList : []
};

//Define a default position (relative to the drawing canvas) to place newly created nodes at.
//Later on, we should probably make nodes appear on a cursor position, or something more user-friendly.
const defaultNodePosition = {
    top  : 100,     //Corresponding values to CSS 'absolute position' coordinates.
    left : 100
};
const defaultColour = "blue";
const defaultNodeSize = {
    height : "50",
    width  : "100"
};
const defaultNodeTitle = "New concept";

//Define a counter which will track the current 'id' number to append
let currIdNum = 0;
const idPrefix  = "contentNode";



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
    let newElemDetails = createNewNode_HtmlElement(defaultNodePosition.left, defaultNodePosition.top);

    //Use the returned details to create a new logical object representing the HTML element, and store it.
    let newNode = new ContentNode(newElemDetails.elementReference, newElemDetails.elementId);
    canvasState.contentNodeList.push(newNode);

    /*TODO - automatically rearrange nodes on screen after placing a new one, since it may be overlapping if there was a node already in the default spawn location*/
}

function createNewNode_HtmlElement(leftPos, topPos) {
    //Access the DOM, and find the drawingCanvas element. We will add the new content node as a DIV nested inside of this
    let drawingCanvas = document.getElementById("drawingCanvas");

    let newElem = document.createElement("div");

    //assign an id for the new element based on the current 'tracking'
    let idString = idPrefix + currIdNum;
    currIdNum++;

    newElem.setAttribute("id", idString);    //Assign the id.
    //Assign the classes we need. Most of them facilitate interaction with interact.js library.
    newElem.setAttribute("class", "draggable drag-drop dropzone contentNode node");

    newElem.style.color  = defaultColour;
    newElem.innerText    = defaultNodeTitle;
    newElem.style.height = defaultNodeSize.height;
    newElem.style.width  = defaultNodeSize.width;
    newElem.style.top    = topPos.toString();
    newElem.style.left   = leftPos.toString();

    //Return the html element we just made, and it's id string.
    return {
        elementReference : newElem,
        elementId        : idString
    }
}



