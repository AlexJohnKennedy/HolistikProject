/**
 * function called when the help button in the nav bar is pressed
 */
function spawnHelpWindow() {
    console.log("spawining help window!");

    //fully sick blackout effect
    let blackoutElem = document.getElementById("fade");
    blackoutElem.style.display = "block";

    //make the div containing the help info visible
    let editWindow = document.getElementById("popupHelpWindow");
    editWindow.style.display = "block";
}

/**
 * this function is to be called when the close button is pressed
 */
function closeHelpWindow() {
    console.log("closing help window!");

    //fully sick blackout effect
    let blackoutElem = document.getElementById("fade");
    blackoutElem.style.display = "none";

    //make the div containing the help info visible
    let editWindow = document.getElementById("popupHelpWindow");
    editWindow.style.display = "none";
}