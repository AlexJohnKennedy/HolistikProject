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

    //find current x and y pos
    let rect = newElem.getBoundingClientRect();
    let xPos  = rect.left;
    let yPos = rect.top;

    //save the necessary shit
    this.htmlElement = newElem;
    this.idString = id;
    this.translation = {
        x : xPos,
        y : yPos
    };
    this.previousTranslation = {
        x: xPos,
        y: yPos
    };
    this.parentList = parentList;

    console.log("created sidebar element with trans:"+this.translation.x+" "+this.translation.y+" and prev trans: "+this.previousTranslation.x+" "+this.previousTranslation.y);
}

/**
 *
 */
SidebarElement.prototype.returnSidebarElemToPreviousPosition = function(animateTime) {
    console.log("sidebar elem with id: "+this.idString+" was asked to move back to it's previous position, which is x = "+this.previousTranslation.x+" y = "+this.previousTranslation.y);
    this.moveSidebarElementTo(this.previousTranslation.x, this.previousTranslation.y, animateTime);
};

/**
 *
 */
SidebarElement.prototype.moveSidebarElementTo = function(x, y, animateTime) {
    if (animateTime > 0.0) {
        //Set up a transition on the 'transform' property such that it takes 'animateTime' seconds to animate the object.
        this.htmlElement.style.transitionProperty = "transform";
        this.htmlElement.style.transitionDuration = animateTime.toString()+"s";
    }

    //Trigger the CSS animation by setting a new translation.
    this.htmlElement.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    //Update the logical nodes translation state
    this.translation.y = y;
    this.translation.x = x;

    //Update the html element tracking of the translation as well. (used by the interact.js framework)
    this.htmlElement.setAttribute("xTranslation", x.toString());
    this.htmlElement.setAttribute("yTranslation", y.toString());
};
