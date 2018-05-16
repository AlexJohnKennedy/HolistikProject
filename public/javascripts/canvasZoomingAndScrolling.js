
//Variable used to track the current 'scaling' of the drawing canvas (used to control zooming in and out)
let canvasScale = 1.0;     //Defaults to normal zoom, of course.

/**
 * Used to control how zoomed in the drawing canvas is. It will set the canvasScale variable (which will be used for translation
 * calculations, to normalise things based on zoom).
 *
 * And obviously setting the drawing Canvas transform: scale()
 *
 * @param scaleFactor
 */
function setCanvasZoomScale(scaleFactor) {
    //Only check we need to do is make sure that we're not zooming so far out that the drawing canvas is smaller than the canvas window.
    let canvasWindow = document.getElementById("canvasWindow");
    let windowwidth = canvasWindow.offsetWidth;
    let windowheight = canvasWindow.offsetHeight;

    let minimumWidthScaleFactor  = windowwidth  / CANVAS_WIDTH;
    let minimumHeightScaleFactor = windowheight / CANVAS_HEIGHT;

    let minFactor = (minimumWidthScaleFactor > minimumHeightScaleFactor ? minimumWidthScaleFactor : minimumHeightScaleFactor);

    if (scaleFactor < minFactor) {
        scaleFactor = minFactor + 0.01;
    }

    //Set the scaling!
    canvasScale = scaleFactor;
    let drawingCanvas = document.getElementById("drawingCanvas");
    drawingCanvas.style.transform = "scale("+canvasScale+")";

    //Because of how scaling works, we need to move the canvas left and up (relative to the canvas window) by HALF the amount
    //that the size is reduced by, by this scaling amount.
    let horizontalReduction  =  CANVAS_WIDTH - CANVAS_WIDTH * canvasScale;
    let verticalReduction    =  CANVAS_HEIGHT - CANVAS_HEIGHT * canvasScale;
    drawingCanvas.style.left = -(horizontalReduction/2) + "px";
    drawingCanvas.style.top  = -(verticalReduction/2)   + "px";
}

function convertCoordinateByZoomScale(value) {
    return value / canvasScale;
}

/** This function will calculate the scrollx and scrolly settings to centre the given coordinates on the canvas.
 *  If the coord cannot be centred, it will get as close as it can.
 * @param x
 * @param y
 */
function centreCoordinatesOnCanvas(x, y) {
    //Use the canvas window to determins the offsets to scroll, since it will tell us how large the viewing window currently is.
    let canvasWindow = document.getElementById("canvasWindow");

    let windowwidth = canvasWindow.offsetWidth;
    let windowheight = canvasWindow.offsetHeight;

    let scrollLeft;
    let scrollTop;

    //Calculate the left scroll.
    if (windowwidth/2 >= x) {
        //scroll all the way to the left.. clamping!
        scrollLeft = 0;
    }
    else if (windowwidth/2 >= (CANVAS_WIDTH - x)) {
        //Scroll all the way to the right.. clamping!
        scrollLeft = CANVAS_WIDTH - windowwidth - 3;    //3 is only there for small padding and so forth.
    }
    else {
        //No need to clamp!
        scrollLeft = x - windowwidth/2;
    }

    //Calculate the top scroll.
    if (windowheight/2 >= y) {
        //scroll all the way to the left.. clamping!
        scrollTop = 0;
    }
    else if (windowheight/2 >= (CANVAS_HEIGHT - y)) {
        //Scroll all the way to the right.. clamping!
        scrollTop = CANVAS_HEIGHT - windowheight - 3;    //3 is only there for small padding and so forth.
    }
    else {
        //No need to clamp!
        scrollTop = y - windowheight/2;
    }

    //Set the scroll!
    canvasWindow.scroll({
        top: scrollTop,
        left: scrollLeft,
        behavior: 'smooth'
    });
}
