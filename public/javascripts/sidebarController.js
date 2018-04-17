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
generates the indented lists by looping through the root nodes, and DFSing through the children
 */
function buildListElements(nodeList) {
    //We will need a 'root' list to already exist. All parentless nodes will be attached to this global list!
    let globalList = document.createElement("ul");
    globalList.setAttribute("id", "rootList");

    let listContainer = document.getElementById("listContainer");
    listContainer.appendChild(globalList);

    //If the context is global, we will apply a styling to the entire sidebar to indicate that!
    if (canvasState.contextNode == null) {
        listContainer.classList.add("globalcontext_sidebarStyling");
    }
    else {
        listContainer.classList.remove("globalcontext_sidebarStyling");
    }

    //Now, loop through all the nodes and find all of them which have NO parents (true roots).
    //For each root, begin constructing a DFS list-tree structure, beginning with the global list.
    for (let node of nodeList) {
       if (node.parentList.length === 0) {
           //Found a root node!
           constructTree(node, 0, globalList);
       }
    }
}

/**
depth first search to construct the indented lists. note that nodes may appear more than once since node structure
is not a DAG.
*/
function constructTree(curr, depth, parentListElem) {
    //Firstly, we should append a list element corresponding to this node into our parently list!
    //build a corresponding sidebar element object
    let newSidebarElem = new SidebarElement(curr.idString, parentListElem, curr.titleText);
    sidebarState.sidebarElements.push(newSidebarElem);

    //Style visible-node list elements differently to invisible ones, for visual indication. Let CSS handle the styling!
    if (curr.isVisible) {
        newSidebarElem.htmlElement.classList.add("visibleListElem");
    }
    else {
        newSidebarElem.htmlElement.classList.add("invisibleListElem");
    }

    //If this node is a context node, apply a unique styling which overwrites the previous ones.
    if (curr === canvasState.contextNode) {
        newSidebarElem.htmlElement.classList.add("contextListElem");
    }

    //Now, if and only if this node has children, then we need to create a list of our own to represent this node's children!
    if (curr.childrenList.length !== 0) {
        let childListElem = document.createElement("ul");
        childListElem.setAttribute("id", curr.idString+"_ListOfChildren");

        //Add the list into the parent list, and then continue traversing!
        parentListElem.appendChild(childListElem);

        //iterate over children and do the same shit
        for (let rel of curr.childrenList) {
            //Recurse for all children, making them visible
            for (let child of rel.children) {
                //Recurse within this child
                constructTree(child, depth+1, childListElem);   //Pass in the newly created list instead of the parent
            }
        }
    }
}

/**
 * Public function which rebuilds the entire sidebar list(s) from scratch when invoked.
 *
 * This will be called by the canvas controller whenever it calls rebuildVisibility(). This ensures that it
 * is invoked every time some visual structure of the canvas changes.
 * NOTE: This must be called AFTER the rebuild visibility function completes (right before returning), so that we have
 * access to each node's respective 'isVisible' after they have just been recalculated.
 *
 * @param nodeList a list of all the content Nodes.
 */
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
