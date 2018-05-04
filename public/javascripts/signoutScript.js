/**
 * Logout needs to be handled by a small script, because we want to ensure that the local storage is cleared before
 * signing out
 */
function clearLocalStorage() {
    //Clear the local storage
    window.localStorage.removeItem("projectId");
    window.localStorage.removeItem("projectName");
}