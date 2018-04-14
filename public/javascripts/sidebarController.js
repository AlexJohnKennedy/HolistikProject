//keep track of various sidebar data structures
const sidebarState = {
    sidebarElements : [],
};

//simple function to fuck off everything from the list container and clear the sidebar elements array
function clearList() {
    //fuck off all of the current list elements
    let listContainer = document.getElementById("listContainer");
    listContainer.innerHTML = null;
    sidebarState.sidebarElements = [];

}

/*
generates the indented lists by looping through the root nodes, and bfsing through the children
 */
function buildListElements(nodeList) {
    for (let node of nodeList) {
       if (node.parentList.length === 0) {
           constructTree(node, 0);
       }
    }
}

/*
breadth first search to construct the indented lists. note that nodes may appear more than once since node structure
is not a DAG.
*/
function constructTree(curr, depth) {
    //define identifier
    let idPrefix = "unorderedListOfDepth";

    //get the ul corresponding to the current depth, if it doesn't exist, make it!
    let currList = document.getElementById(idPrefix+depth.toString());
    if (currList === null) {
        currList = document.createElement("ul");
        currList.setAttribute("id", idPrefix+depth.toString());
        //add this list as a child of the list of one less depth
        //if depth is zero, dump the list in the list container
        if (depth === 0) {
            let listContainer = document.getElementById("listContainer");
            listContainer.appendChild(currList);
        } else {
            document.getElementById(idPrefix+(depth-1).toString()).appendChild(currList);
        }
    }

    //build a corresponding sidebar element object
    let newSidebarElem = new SidebarElement(curr.idString, document.getElementById(idPrefix+depth.toString()));
    sidebarState.sidebarElements.push(newSidebarElem);

    //iterate over children and do the same shit
    for (let rel of curr.childrenList) {
        //Recurse for all children, making them visible
        for (let child of rel.children) {
            //Recurse within this child
            constructTree(child, depth+1);
        }
    }
}

//wrapper function to be called any time something has changed in the canvas
function refreshSidebar(nodeList) {
    this.clearList();
    this.buildListElements(nodeList);
}

function getSidebarElement(element) {
    //Find by id.
    let id = element.getAttribute("id");

    //look for the right sidebar element by matching ids
    for (let sidebarElem of sidebarState.sidebarElements) {
        if (sidebarElem.idString === id) {
            console.log("found corresponding obj! id; " + sidebarElem.idString);
            return sidebarElem;
        }
    }

    //We didn't find it...
    alert("Could not find a matching sidebar element object with id: "+id);
    console.trace("Could not find a matching sidebar element object with id: "+id);
    return null;
}

//simply give the whole canvas the sidebar-element-dropzone class
function addSidebarDropzoneClassFromCanvas() {
    let canvasReference = document.getElementById("svgObject");
    canvasReference.classList.add("sidebar-element-dropzone");
}

//opposite of above
function removeSidebarDropzoneClassFromCanvas() {
    let canvasReference = document.getElementById("svgObject");
    canvasReference.classList.remove("sidebar-element-dropzone");
}
