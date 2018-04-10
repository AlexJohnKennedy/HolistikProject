// ---------------------------------------------------------------------------------------------------------------------
// --- RenderLine object prototype -------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function RenderLine(sourceNode, destNode) {
    console.log("a new RenderLine was created, from "+sourceNode.idString+" and "+destNode.idString);

    //Store reference to the information we are going to need.
    this.sourceNode = sourceNode;
    this.destNode   = destNode;

    this.sourceHtmlElement = sourceNode.htmlElement;
    this.destHtmlElement   = destNode.htmlElement;

    //When the RenderLine is created, we access the SVG canvas object and add a 'line' to it, spanning from source to destination
    let svg = document.getElementById("svgObject");

    //Create a <line> and store it as a property of this object.
    let line = document.createElementNS('http://www.w3.org/2000/svg', "line");
    line.setAttribute("x1", (sourceNode.translation.x + 0.5*sourceNode.size.width).toString());
    line.setAttribute("y1", (sourceNode.translation.y + 0.5*sourceNode.size.height).toString());
    line.setAttribute("x2", (destNode.translation.x + 0.5*sourceNode.size.width).toString());
    line.setAttribute("y2", (destNode.translation.y + 0.5*sourceNode.size.height).toString());
    svg.appendChild(line);

    this.line = line;
}

/**
 * This function is intended to be called whenever the source or dest nodes move on screen, so that the line can follow their positions.
 *
 * Access the source and destination elements, and directly extract the x and y translation values.
 * Then, update the <line> attributes to move the line in accordance to the node positions.
 */
RenderLine.prototype.update = function() {
    let x1 = parseFloat(this.sourceHtmlElement.getAttribute('xTranslation')) + 0.5*this.sourceNode.size.width;
    let y1 = parseFloat(this.sourceHtmlElement.getAttribute('yTranslation')) + 0.5*this.sourceNode.size.height;
    let x2 = parseFloat(this.destHtmlElement.getAttribute('xTranslation')) + 0.5*this.destNode.size.width;
    let y2 = parseFloat(this.destHtmlElement.getAttribute('yTranslation')) + 0.5*this.destNode.size.height;

    this.line.setAttribute("x1", x1.toString());
    this.line.setAttribute("x2", x2.toString());
    this.line.setAttribute("y1", y1.toString());
    this.line.setAttribute("y2", y2.toString());
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
};