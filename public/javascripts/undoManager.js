/* This file is responsibly for maintaining a set list of 'previous states' locally in the browser, which can be
 * reloaded manually by the user by pressing the undo button.
 *
 * For now, I will do this is a somewhat wasteful (but still functionally acceptable) way, by fully serialising the
 * entire project state into JSON (as though to be saved on the server) whenever there is a state change in the project.
 *
 * That way i can really easily reuse existing code. However, when a single node moves, it shouldn't be necessary to
 * completely serialise EVERYTHING, only the thing which changed.
 * TODO - Make this more efficient in the future.
 */

class UndoManager {
    constructor(numUndoStatesToRember) {
        //Track how many states we should allow ourselves to remember
        this.maxUndoStates = numUndoStatesToRember;

        //Set up internal state objects, which will remember all our states and so on.
        this.undoStates = [];   //Will store undo states as a stack.

        //When the user 'undoes' something, the state that was overwritten from the undo state will be stored here.
        //Then, on a 'normal' change, the redo lists will be cleared. (i.e. you can only 'redo' after undoing. useful if you undo too far.)
        this.redoStates = [];

        //Used to temporarily store 'current' state, so that on the NEXT change, we can save it as an undo state!
        //Upon setup, we should grab the current state!
        this.currentState = {
            structure : serialiseNodeState(),
            arrangement : serialiseNodeArrangement(),
            globalContextArrangement : canvasState.globalContextArrangement
        };

        //This object is also responsible for managing it's HTML element buttons.
        this.undoButtonElem = document.getElementById("undoButton");
        this.redoButtonElem = document.getElementById("redoButton");

        //Initially, both of these buttons should be in the 'not available' state, since there are zero undo and redo states!
        //TODO - consider having the backend also save undo states, so that they are preserved over project sessions. For now, they don't.
        this.makeUndoButtonUnavailable();
        this.makeRedoButtonUnavailable();
    }

    /**
     * This function is invoked when you want to tell the undo manager object that 'hey, we want to record this current state as something we can
     * return to using the undo functionality!
     *
     * In other words, this is invoked on every 'undoable' change!
     */
    recordChange() {

    }




    // -----------------------------------------------------------------------------------------------------------------
    // --- Undo and redo button management functions -------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

    makeUndoButtonUnavailable() {
        //Set opacity to 50%, so it looks 'greyed out'
        this.undoButtonElem.style.opacity = "0.5";

        //Set the 'title' to have a tooltip which informs the user that there is nothing to undo
        this.undoButtonElem.setAttribute("title", "Nothing to undo!");

        //Set the cursor to auto, so it doesn't look clickable.
        this.undoButtonElem.style.cursor = "auto";
    }
    makeRedoButtonUnavailable() {
        //Set opacity to 50%, so it looks 'greyed out'
        this.redoButtonElem.style.opacity = "0.5";

        //Set the 'title' to have a tooltip which informs the user that there is nothing to undo
        this.redoButtonElem.setAttribute("title", "Nothing to redo!");

        //Set the cursor to auto, so it doesn't look clickable.
        this.redoButtonElem.style.cursor = "auto";
    }

    makeUndoButtonAvailable() {
        //Set opacity to 100%, so it looks 'active' / normal
        this.undoButtonElem.style.opacity = "1.0";

        //Set the 'title' to have a tooltip which informs the user that there is stuff to undo
        this.undoButtonElem.setAttribute("title", "Undo");

        //Set the cursor to pointer, so it looks clickable.
        this.undoButtonElem.style.cursor = "pointer";
    }
    makeRedoButtonAvailable() {
        //Set opacity to 100%, so it looks 'active' / normal
        this.redoButtonElem.style.opacity = "1.0";

        //Set the 'title' to have a tooltip which informs the user that there is stuff to redo
        this.redoButtonElem.setAttribute("title", "Redo");

        //Set the cursor to pointer, so it looks clickable.
        this.redoButtonElem.style.cursor = "pointer";
    }
}