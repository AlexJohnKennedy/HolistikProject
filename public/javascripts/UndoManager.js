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
    constructor(numUndoStatesToRemember) {
        //Track how many states we should allow ourselves to remember
        this.maxUndoStates = numUndoStatesToRemember;

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
     * In other words, this is invoked AFTER every 'undoable' change!
     */
    recordChange() {
        //DEBUG
        console.log("Undo manager: Change recorded!");

        //To avoid double callback errors causing weird behaviour, we should first check that the state we are about to record is not the same as the
        //previous state!
        let newState = {
            structure : serialiseNodeState(),
            arrangement : serialiseNodeArrangement(),
            globalContextArrangement : canvasState.globalContextArrangement
        };

        if (newState.structure === this.currentState.structure &&
            newState.arrangement === this.currentState.arrangement &&
            newState.globalContextArrangement === this.currentState.globalContextArrangement) {
            //OOPS! We probably shouldn't record this
            console.log("Undo manager was asked to record the same change twice!!");

            return;
        }

        //The first thing to do, is push the current state into the undo stack. This is so we can return to it later!
        //We should make sure we do not push null states though (should never happen anyway, but let's be safe aye?)
        if (this.currentState) {
            this.undoStates.push(this.currentState);
        }

        //Now, we need to make sure we record the new current state, by serialising it!
        this.currentState = newState;

        //Any previously stored redo states are now invalid, since the user made a new state change and thus have branched away from the redo state chain.
        //Clear it!
        this.redoStates = [];

        //Finally, trim the undo states to make sure we are not storing to many, as defined by our limit.
        while (this.undoStates.length > this.maxUndoStates) {
            //Trim the FRONT item (the oldest state..)
            this.undoStates.shift();    //Don't need to keep the old one..
        }

        //Update buttons accordingly
        this.makeRedoButtonUnavailable();
        this.makeUndoButtonAvailable();
    }

    /**
     * When invoked, this performs an undo operation!!
     *
     * Will pop a state from the undo stack, load it, and set the currentState to be the state we just popped.
     * The original current state will be pushed to the REdo stack before it is overwritten, so that redoing is possible.
     */
    undo() {
        //DEBUG
        console.log("Undo method called!");

        //Firstly, if this is invoked when there is nothing to undo, just do nothing..
        if (this.undoStates.length === 0) {
            return;
        }

        //Alright! lets do it.
        this.redoStates.push(this.currentState);

        let poppedState = this.undoStates.pop();
        this.currentState = poppedState;

        //Load the state!!
        fullyRebuildCanvasStateFromJSON(poppedState.structure, poppedState.arrangement, poppedState.globalContextArrangement);

        //Update buttons accordingly
        this.makeRedoButtonAvailable();
        if (this.undoStates.length === 0) {
            this.makeUndoButtonUnavailable();
        }
    }

    //Basically all the same logic as an undo, but in reverse.
    redo() {
        //DEBUG
        console.log("Redo method called!");

        if (this.redoStates.length === 0) {
            return;
        }

        this.undoStates.push(this.currentState);

        let poppedState = this.redoStates.pop();
        this.currentState = poppedState;

        //Load the state!!
        fullyRebuildCanvasStateFromJSON(poppedState.structure, poppedState.arrangement, poppedState.globalContextArrangement);

        this.makeUndoButtonAvailable();
        if (this.redoStates.length === 0) {
            this.makeRedoButtonUnavailable();
        }
    }


    // -----------------------------------------------------------------------------------------------------------------
    // --- Undo and redo button management functions -------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------

    makeUndoButtonUnavailable() {
        //Set opacity to 50%, so it looks 'greyed out'
        this.undoButtonElem.style.opacity = "0.15";

        //Set the 'title' to have a tooltip which informs the user that there is nothing to undo
        this.undoButtonElem.setAttribute("title", "Nothing to undo!");

        //Set the cursor to auto, so it doesn't look clickable.
        this.undoButtonElem.style.cursor = "auto";
    }
    makeRedoButtonUnavailable() {
        //Set opacity to 50%, so it looks 'greyed out'
        this.redoButtonElem.style.opacity = "0.15";

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