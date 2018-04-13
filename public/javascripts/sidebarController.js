function SidebarController() {
    this.sidebar = document.getElementById("sidebar");
    this.nodeList = document.getElementById("nodeList");
}

SidebarController.prototype.clearList = function() {
    //fuck off all of the current list elements
    nodeList.innerHTML = null;
    //let newElem = document.createElement("li");
    //sidebar.appendChild(newElem);
};

SidebarController.prototype.buildListElements = function(nodeList) {
    for (let node of nodeList) {
       if (node.parentList.length === 0) {
           constructTree(node);
       }
    }
};

SidebarController.prototype.constructTree = function(curr) {

};
