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

SidebarController.prototype.populateList = function() {

};
