/**
 * This file is responsible for managing the 'automatic arrangement' operations for the application.
 *
 * This includes auto-arranging in the neatest possible tree structure.
 */

//NOTES: TOPOLOGICAL SORT
//-----------------------
//Okay. To run Kahn's algorithm we need to quickly build a representation of the node graph which we can mutate during
//the algorithm, without modifying the structure that the HTML DOM is rendering.

//Since our graph is likely to be sparesly connected (not guaranteed, as users COULD manually connect every node, but
//this would be unliekly as it would render the mind map un-usable do do the density of connections), we will
//use adjacency lists to represent edges.
//We will use a wrapper 'vertex' object to represent each node, and to represent each adjacency list. The wrapper object
//will be the meta-graph which the algorithm will run on.
//the wrapper vertex object will also include an 'incoming edges' counter, which will be decremented when we remove edges
//as part of the algorithm. This counter will be used to more efficiently detect when the number of incoming edges reaches zero
//(i.e., when a newly reached node can be added to the set of nodes which are no longer dependent on anything.)


/**
 * This function sorts all of the VISIBLE nodes on the canvas, starting from the current root nodes.
 *
 * It will traverse the VISIBLE nodes, and treat invisible ones as non existing. (this means that edges to and from
 * invisible nodes will also not be included in the sort).
 *
 * It will return a topologically sorted ordering of these nodes. Obviously we assume the DAG restrictions are in place.
 */
function topologicalSortVisibleNodes() {
    //Alright. All we have to do here, then, is construct the wrapper-representation of the node graph, only including visible
    //nodes and edges!

    //STEP 1: Build a vertex wrapper object for each contentNode, and TEMPORARILY attach the wrapper inside the contentNode to maintain access to it.
    for (let contentNode of canvasState.contentNodeList) {
        //add temporary member of the real node, so long as it is visible.
        if (contentNode.isVisible) {
            contentNode.vertexWrapper = new Vertex(contentNode);
        }
    }

    //STEP 2: Now that all the vertex wrapper objects exists, loop through the nodes again, and add all the outgoing edges for each node to each wrapper!
    for (let contentNode of canvasState.contentNodeList) {
        for (let rel of contentNode.childrenList) {
            for (let child of rel.children) {
                //Add this edge to the wrapper vertex, with the same label as the relationships original one.
                if (child.isVisible) {
                    contentNode.vertexWrapper.addOutgoingEdge(child.vertexWrapper, rel.categoryLabel);
                }
            }
        }
    }

    //STEP 3: Find the current root node vertices, and add them to our starting list, since those will be the parentless nodes if we're only using visible ones.
    let independentVertices = [];
    for (let contentNode of canvasState.rootNodes) {
        independentVertices.push(contentNode.vertexWrapper);
    }

    //STEP 4: REMOVE the temporary attribute from the original nodes, so as to not clutter them with auxiliary bullshit.
    for (let contentNode of canvasState.contentNodeList) {
        if (contentNode.isVisible) {
            delete contentNode.vertexWrapper;
        }
    }

    //SWEET. We have constructed a wrapper graph which we can run Kahn's algorithm on, and not disrupt the original node states.
    //Just return a topologically sorted ordering of these vertices!
    return topologicalSort(independentVertices);
}

/**
 * Run Kahn's algorithm on a set of 'start vertices' to topologically sort a DAG. Returns an ordered list of vertices.
 * @param independentSet
 */
function topologicalSort(independentSet) {
    if (independentSet.length === 0) {
        console.trace("ERROR: we were asked to topologically sort but was passed an empty independent set!");
        return null;
    }

    let finalOrdering = [];     //Will be constructed and returned by this algorithm.

    while (independentSet.length > 0) {
        //Pop a vertex, and append it into the final ordering list!
        let parent = independentSet.pop();
        finalOrdering.push(parent);

        //Remove all outgoing edges from the popped vertex, and if any of the ex-children now have no incoming edges, add to the independent set!
        while (parent.outgoingEdges.length > 0) {
            let child = parent.removeFrontMostEdge();
            if (child.incomingEdgeCount === 0) {
                //WOO! This vertex is now independent, baby!
                independentSet.push(child);
            }
        }
    }

    //DEBUG:
    console.log("Topologically sorted ordering:");

    //Quickly just restore the removed edges from all the vertices, for later processing capabilities
    for (let v of finalOrdering) {
        v.outgoingEdges = v.removedOutgoingEdges;
        v.removedOutgoingEdges = [];

        //DEBUG
        console.log(v.contentNode.titleText);
    }

    return finalOrdering;   //This list should be topologically sorted!!
}


/**
 * Constructor for the wrapper object which will represent a vertex in the graph. These objects are necessary because we will
 * need to run algorithms on the node graph under different conditions, without modifying the original data structures that
 * are tied to the HTML DOM and other application logic!
 * @constructor
 */
class Vertex {
    constructor(node) {
        this.contentNode = node;   //Reference to the REAL node, which this vertex is representing in our wrapper graph.

        this.outgoingEdges = [];    //Simple list of references to other Vertex object, representing an outgoing edge.
                                    //Note, that for categorisation purposes (when using algorithms which will try to
                                    //group/sort by relationship label, for example, this list will associate each edge
                                    //with a label string, as well.

        //Temporary edge storage for alogrithm processing.
        this.removedOutgoingEdges = []; //When we 'remove' outgoing edges from the wrapper graph (as part of the Kahn's algorithm, we should still keep them
                                        //here, so algorithms that FOLLOW the topological sort can still access them correctly (E.g. the layer-by-layer arrangement
                                        //algorithm which relies on the topological sort).


        this.incomingEdgeCount = 0; //Used to detect when there are no more incoming nodes!
    }

    //Functions used to build the graph, during the setup phase.
    addOutgoingEdge(otherVertex, relationshipLabel) {
        this.outgoingEdges.push({
            vertex: otherVertex,
            label: relationshipLabel
        });

        //Increment the other vertex's incoming edge counter
        otherVertex.incomingEdgeCount++;
    }

    //Functions used to remove outgoing edges, during Kahn's algorithm operation.

    /**
     * This function will remove the first outgoing edge from this vertex's adjacency list, decrement the incoming edge counter
     * of that vertex, and then return the vertex that was popped. This is designed to be repeatedly called by Kahn's algorithm
     * during the part where we traverse to each child of an independent node, remove the edges, then test each child to see if
     * they are now independent.
     */
    removeFrontMostEdge() {
        let removed = this.outgoingEdges.pop();
        removed.vertex.incomingEdgeCount--;     //Decrement the counter of that vertex, since this edge no longer exists.
        this.removedOutgoingEdges.push(removed);

        return removed.vertex;  //Return that vertex, so that the algorithm using this function can examine it/test conditions/continue using it
    }
}