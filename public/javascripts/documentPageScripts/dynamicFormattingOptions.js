let showingRelationshipTags = true;     //DEFAULT SETTING IS TRUE, HENCE IT STARTS AS TRUE!

function toggleShowRelationshipTags() {
    //Okay. For all the matching elements in the document, simply set their display to none!
    let docElem = document.getElementById("mainDocument");

    //Get all the relationship tag elements, by their identifying class!
    let tags = docElem.getElementsByClassName("childRelationshipText");

    //Lets do it!
    if (showingRelationshipTags) {
        //Need to turn them off!
        for (let tag of tags) {
            tag.style.display = "none";
        }
    }
    else {
        //Need to turn them on!
        for (let tag of tags) {
            tag.style.display = "block";
        }
    }

    //Toggle the state for next time around.
    showingRelationshipTags = !showingRelationshipTags;
}

// ---------------------------------------------------------------------------------------------------------------------

let showingInternalLinks = true;    //DEFAULT SETTING IS TRUE. BE SURE IT MATCHES THE CHECKBOX INITIAL 'CHECKED' SETTING IN THE EJS MARKUP

function toggleShowSemanticLinks() {
    //Okay. For all the matching elements in the document, simply set their display to none!
    let docElem = document.getElementById("mainDocument");

    //Get all the relationship tag elements, by their identifying class!
    let tags = docElem.getElementsByClassName("internalPageLinks");

    //Lets do it!
    if (showingInternalLinks) {
        //Need to turn them off!
        for (let tag of tags) {
            tag.style.display = "none";
        }
    }
    else {
        //Need to turn them on!
        for (let tag of tags) {
            tag.style.display = "inline-block";
        }
    }

    //Toggle the state for next time around.
    showingInternalLinks = !showingInternalLinks;
}

// ---------------------------------------------------------------------------------------------------------------------

let showingBorders = false;     //DEFAULT IS FALSE.

function toggleShowBorderlines() {
    //Okay. For all the matching elements in the document, simply set their display to none!
    let docElem = document.getElementById("mainDocument");

    //Get all the relationship tag elements, by their identifying class!
    let tags = docElem.getElementsByClassName("nodeContent");

    //Lets do it!
    if (showingBorders) {
        //Need to turn them off!
        for (let tag of tags) {
            tag.classList.remove("nodeContentLeftBorder");
        }
    }
    else {
        //Need to turn them on!
        for (let tag of tags) {
            tag.classList.add("nodeContentLeftBorder");
        }
    }

    //Toggle the state for next time around.
    showingBorders = !showingBorders;
}

// ---------------------------------------------------------------------------------------------------------------------

let showingHighlights = true;

function toggleHighlighting() {
    //Okay. For all the matching elements in the document, simply set their display to none!
    let docElem = document.getElementById("mainDocument");

    //Get all the relationship tag elements, by their identifying class!
    let tags = docElem.getElementsByClassName("nodeContent");

    if (showingHighlights) {
        removeHighlightListeners();
    }
    else {
        addHighlightListeners();
    }

    showingHighlights = !showingHighlights;
}

function addHighlightListeners() {
    //Acquire the link objects
    let docElem = document.getElementById("mainDocument");
    let links = docElem.getElementsByClassName("nodeLink");

    for (let link of links) {
        link.addEventListener("mouseenter", highlightCallback);
        link.addEventListener("mouseleave", unhighlightCallback);
    }
}

function removeHighlightListeners() {
    //Acquire the link objects
    let docElem = document.getElementById("mainDocument");
    let links = docElem.getElementsByClassName("nodeLink");

    for (let link of links) {
        link.removeEventListener("mouseenter", highlightCallback);
        link.removeEventListener("mouseleave", unhighlightCallback);
    }
}

//Callbacks
function highlightCallback(event) {
    let targetId   = event.currentTarget.getAttribute("href").substring(1);  //Get href target and trim the '#' colour.
    let targetElem = document.getElementById(targetId);

    targetElem.classList.add("highlight");
}
function unhighlightCallback(event) {
    let targetId   = event.currentTarget.getAttribute("href").substring(1);  //Get href target and trim the '#' colour.
    let targetElem = document.getElementById(targetId);

    targetElem.classList.remove("highlight");
}

window.onload = function() {
    if (showingHighlights) {
        addHighlightListeners();
    }
};