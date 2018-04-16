/**
 * represents a list item in the sidebar
 * @param id
 * @param parentList
 * @constructor
 */
function SidebarElement(id, parentList, nodeName) {
    //make a new list item
    let newElem = document.createElement("li");
    newElem.innerText = nodeName;
    //give it the draggable class to facilitate the addition of a node that isn't already shown to the canvas
    //also needs the sidebar-element class to make dragging into a dropzone work
    newElem.setAttribute("class", "draggable-sidebar-node sidebar-element");
    //assign it its id
    newElem.setAttribute("id", id+"_sidebar");
    //add this list item to the parent list
    parentList.appendChild(newElem);

    //find current x and y pos
    let xPos  = newElem.style.left;
    let yPos = newElem.style.top;

    //save the necessary shit
    this.htmlElement = newElem;
    this.idString = id+"_sidebar";
    this.nodeId   = id;
    this.translation = {
        x : xPos,
        y : yPos
    };
    this.previousTranslation = {
        x: xPos,
        y: yPos
    };
    this.parentList = parentList;
}