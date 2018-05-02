//These two functions are used in profile page to regulate the visibility of create new notebook window.
function showMeThePopUpWindow() {
    var create = document.getElementById('create');
    create.style.display = 'block';
};

function unseeThePopUpWindow() {
    var create = document.getElementById('create');
    create.style.display = 'none'
}