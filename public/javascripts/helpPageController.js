/**
 * function called when the help button in the nav bar is pressed
 */
function spawnHelpWindow() {
    console.log("spawining help window!");

    //fully sick blackout effect
    let blackoutElem = document.getElementById("fade");
    blackoutElem.style.display = "block";
    blackoutElem.style.opacity = "0.5";

    //make the div containing the help info visible
    let helpWindow = document.getElementById("popupHelpWindow");
    helpWindow.style.display = "block";
    helpWindow.style.opacity = "1";
}

/**
 * this function is to be called when the close button is pressed
 */
function closeHelpWindow() {
    console.log("closing help window!");

    //fully sick blackout effect
    let blackoutElem = document.getElementById("fade");
    blackoutElem.style.display = "none";
    blackoutElem.style.opacity = "0";

    //make the div containing the help info visible
    let helpWindow = document.getElementById("popupHelpWindow");
    helpWindow.style.display = "none";
    helpWindow.style.opacity = "0";
}