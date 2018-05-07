//These two functions are used in profile page to regulate the visibility of create new notebook window.
function showMeThePopUpWindow() {
    let create = document.getElementById('create');
    create.style.display = 'block';
};

function unseeThePopUpWindow() {
    let create = document.getElementById('create');
    create.style.display = 'none'
}

/**
 * Stores information needed to load the correct canvas in local browser storage.
 * Will be called when the user clicks on a project icon on the profile page, so that the local id infomration can
 * persist to the new page.
 * @param name
 * @param id
 */
function setProjectDataInLocalBrowserStorage(name, id) {
    //TODO - Enforce alphanumeric for project and user names

    window.localStorage.setItem("projectName", name);
    window.localStorage.setItem("projectId", id);

    console.log("projectName saved to local storage: "+window.localStorage.getItem("projectName"));
    console.log("projectId saved to local storage: "+window.localStorage.getItem("projectId"));
}

window.onload = function() {
    let elems = document.getElementsByClassName("projectPreviewBox");
    for (let elem of elems) {
        console.log("counting");

        //load
        loadButton = elem.getElementsByClassName("loadProjectBtn")[0];
        loadButton.addEventListener("click", function(event) {
            console.log("CLICKED LOAD");
            let e = event.target.parentElement;
            setProjectDataInLocalBrowserStorage(e.getAttribute("projectName"), e.getAttribute("projectId"));
            //Redirect to the main page
            window.location.href = "/main";
        });

        /*
        //delete
        deleteButton = elem.getElementsByClassName("deleteProjectBtn")[0];
        deleteButton.addEventListener("click", function(event) {
            console.log("CLICKED DELETE");

            //make call to server to delete the project


            //delete the list item and the accompanying break tag
            //UPDATE: the list will be rebuilt when redirected back from the project delete url
            let e = event.target.parentElement;
            elem.parentElement.nextElementSibling.remove();
            elem.parentElement.remove();
        });
        */
    }
};
