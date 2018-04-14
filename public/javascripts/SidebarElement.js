function SidebarElement(element, id, x, y, parentList) {
    this.htmlElement = element;
    this.idString = id;
    this.translation = {
        x : x,
        y : y
    };
    this.previousTranslation = {
        x: x,
        y: y
    };
    this.parentList = parentList;
}

