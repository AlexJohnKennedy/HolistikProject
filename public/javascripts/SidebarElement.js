function SidebarElement(id, parentList) {
    //make a new list item
    let newElem = document.createElement("li");
    newElem.innerText = id;
    //give it the draggable class to facilitate the addition of a node that isn't already shown to the canvas
    //also needs the sidebar-element class to make dragging into a dropzone work
    newElem.setAttribute("class", "draggable-sidebar-node sidebar-element");
    //assign it its id
    newElem.setAttribute("id", id);
    //add this list item to the parent list
    parentList.appendChild(newElem);

    //save the necessary shit
    this.htmlElement = newElem;
    this.idString = id;
    this.translation = {
        x : newElem.x,
        y : newElem.y
    };
    this.previousTranslation = {
        x: newElem.x,
        y: newElem.y
    };
    this.parentList = parentList;
}

