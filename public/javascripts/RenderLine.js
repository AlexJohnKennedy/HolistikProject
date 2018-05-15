// ---------------------------------------------------------------------------------------------------------------------
// --- RenderLine object prototype -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

//shift the label up and to the right slightly (PIXELS)
const LABEL_X_TRANS = 20;
const LABEL_Y_TRANS = (0-20);

function RenderLine(sourceNode, destNode, displayedLabel) {

    console.log("a new RenderLine was created, from "+sourceNode.idString+" and "+destNode.idString);

    //Store reference to the information we are going to need.
    this.sourceNode = sourceNode;
    this.destNode   = destNode;

    this.sourceHtmlElement = sourceNode.htmlElement;
    this.destHtmlElement   = destNode.htmlElement;

    //When the RenderLine is created, we access the SVG canvas object and add a 'line' to it, spanning from source to destination
    let svg = document.getElementById("svgObject");

    //Create a <polyline> and store it as a property of this object.
    let line = document.createElementNS('http://www.w3.org/2000/svg', "polyline");
    //string concatenation to for a line with a point in the middle to allow for a mid-line svg object
    let x1 = (sourceNode.translation.x + 0.5*sourceNode.size.width);
    let y1 = (sourceNode.translation.y + 0.5*sourceNode.size.height);
    let x2 = (destNode.translation.x + 0.5*sourceNode.size.width);
    let y2 = (destNode.translation.y + 0.5*sourceNode.size.height);
    let xMidpoint = ((x1+x2)/2);
    let yMidpoint = ((y1+y2)/2);
    let pointsString = x1+","+y1+" "+xMidpoint.toString()+","+yMidpoint.toString()+" "+x2+","+y2;
    line.setAttribute("points", pointsString);
    line.setAttribute("marker-mid", "url(#Triangle)");
    svg.appendChild(line);

    //make an invisible mega line to detect mouse enter/leave
    let megaLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    megaLine.setAttribute("points", pointsString);
    megaLine.setAttribute("class", "megaline");
    svg.appendChild(megaLine);

    //label
    let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", (xMidpoint + LABEL_X_TRANS).toString());
    label.setAttribute("y", (yMidpoint + LABEL_Y_TRANS).toString());
    label.innerHTML = displayedLabel;
    svg.appendChild(label);

    //line listeners to make the hover over thing work
    megaLine.addEventListener("mouseenter", function(event) {
        console.log("mouseenter line area");
        event.currentTarget.nextSibling.style.display = "block";
    });
    megaLine.addEventListener("mouseleave", function(event) {
        console.log("mouseleave line area");
        event.currentTarget.nextSibling.style.display = "none";
    });

    this.line = line;
    this.megaLine = megaLine;
    this.label = label;

    //The line objects will also have a 'isVisible' flag which we can use to determine visibility in the same way
    //as the nodes.
    this.isVisible = true;  //Default to being visible

    //Add this line to the global collection of lines, so that we can reference it in the visibilty calculations.
    canvasState.hierarchyLines.push(this);
}

/**
 * This function is intended to be called whenever the source or dest nodes move on screen, so that the line can follow their positions.
 *
 * Access the source and destination elements, and directly extract the x and y translation values.
 * Then, update the <line> attributes to move the line in accordance to the node positions.
 */
RenderLine.prototype.update = function() {
    let x1 = parseFloat(this.sourceHtmlElement.getAttribute('xTranslation')) + 0.5*parseFloat(this.sourceHtmlElement.style.width);
    let y1 = parseFloat(this.sourceHtmlElement.getAttribute('yTranslation')) + 0.5*parseFloat(this.sourceHtmlElement.style.height);
    let x2 = parseFloat(this.destHtmlElement.getAttribute('xTranslation')) + 0.5*parseFloat(this.destHtmlElement.style.width);
    let y2 = parseFloat(this.destHtmlElement.getAttribute('yTranslation')) + 0.5*parseFloat(this.destHtmlElement.style.height);

    let pointsString = (x1.toString())+","+
                       (y1.toString())+" "+
                       ((x1+x2)/2).toString()+","+
                       ((y1+y2)/2).toString()+" "+
                       (x2.toString())+","+
                       (y2.toString());
    this.line.setAttribute("points", pointsString);
    this.line.setAttribute("marker-mid", "url(#Triangle)");

    this.megaLine.setAttribute("points", pointsString);

    this.label.setAttribute("x", (((x1+x2)/2)+LABEL_X_TRANS).toString());
    this.label.setAttribute("y", (((y1+y2)/2)+LABEL_Y_TRANS).toString());
};

RenderLine.prototype.hideLine = function() {
    this.line.style.display = "none";
};

RenderLine.prototype.showLine = function () {
    this.line.style.display = "inline";
};

RenderLine.prototype.deleteLine = function() {
    console.log("Render line being deleted");
    let svg = document.getElementById("svgObject");
    svg.removeChild(this.line);

    //Remove from the canvas state as well!
    let index = canvasState.hierarchyLines.indexOf(this);
    if (index !== -1) {
        canvasState.hierarchyLines.splice(index,1);
    }
};