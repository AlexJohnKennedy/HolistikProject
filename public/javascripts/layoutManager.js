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


function autoArrangeVisibleNodes() {
    //Topologically sort visible nodes.
    let topSorted = topologicalSortVisibleNodes();

    //Assign layer numbers to each visible node.
    let layerAssigned = assignVerticesToLayers(topSorted);

    //DEBUG:
    console.log(layerAssigned);

    //Build dummy vertices (point to a NULL contentNode) in each layer, to represent relationships that span across more
    //than one layer. This is done so that we can encompass spanning relationships in our layer-by-layer permutation calculations
    //when we try to find a layer ordering which results in the fewest relationship line cross-overs.
    let layersWithDummyVerts = addDummyVertices(layerAssigned);

    //Construct a 'group meta graph' based on grouping vertices with similar parent paths.
    let groupMatrix = buildGroupsByAssociation(layersWithDummyVerts);

    //DEBUG:
    console.log(layersWithDummyVerts);
    for (let layer of layersWithDummyVerts) {
        for (let v of layer) {
            if (v.contentNode == null) {
                let str = "Dummy vert going from";
                for (let e of v.incomingEdges) {
                    str = str + ", ";
                    str = str + (e.contentNode ? e.contentNode.titleText : "DUMMY");
                }
                str = str + ", to "+ (v.outgoingEdges[0].vertex.contentNode ? v.outgoingEdges[0].vertex.contentNode.titleText : "DUMMY");
                console.log(str);
            }

            //If there is an outgoing edge which still spans more than one layer, we have FUCKING FAILED CUNT.
            for (let e of v.outgoingEdges) {
                if (e.vertex.layer > v.layer + 1) {
                    console.log("ERROR: Relationship from "+ (v.contentNode ? v.contentNode.titleText : "DUMMY")
                                + " to " + (e.vertex.contentNode ? e.vertex.contentNode.titleText : "DUMMY")
                                + " spans " + (e.vertex.layer - v.layer) + "layers :(");
                }
            }
        }
    }

    //DEBUG2:
    console.log(groupMatrix);

    groupMatrix = findLeastCrossoverOrdering(groupMatrix);

    //DEBUG3:
    console.log("AFTER ARRANGEING WITH CROSSOVER HEURISTICS:");
    console.log(groupMatrix);
}




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
        if (contentNode.isVisible) {
            for (let rel of contentNode.childrenList) {
                for (let child of rel.children) {
                    //Add this edge to the wrapper vertex, with the same label as the relationships original one.
                    if (child.isVisible) {
                        contentNode.vertexWrapper.addOutgoingEdge(child.vertexWrapper, rel.categoryLabel);
                    }
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

    //Quickly just restore the removed edges from all the vertices, for later processing capabilities
    for (let v of finalOrdering) {
        v.outgoingEdges = v.removedOutgoingEdges;
        v.removedOutgoingEdges = [];
    }

    return finalOrdering;   //This list should be topologically sorted!!
}

/**
 * Assigns vertices which are already in topologically sorted order to 'layers', by assigning layer number as the
 * longest path from a root to the given vertex.
 *
 * @param topologicallySortedNodes
 * @return matrix of layers. (list of lists, where each item in the outer list is a list of all nodes for a given layer)
 */
function assignVerticesToLayers(topologicallySortedNodes) {
    //Since nodes are already topologically sorted, we can just scan through once and assign..
    let layerMatrix = [];
    let maxLayer = 0;

    //The root nodes should all have a layer of 'zero' assigned to them. These are vertices with no incoming edges.
    //Loop broke. From here, assign the layer to be the max layer of parents, plus one.
    for (let i=0; i <topologicallySortedNodes.length; i++) {
        let layer = 0;
        for (let par of topologicallySortedNodes[i].incomingEdges) {
            if (par.layer >= layer) {
                layer = par.layer + 1;
            }
        }
        topologicallySortedNodes[i].layer = layer;

        if (layerMatrix[layer] === undefined) {
            layerMatrix[layer] = [topologicallySortedNodes[i]];     //Add new inner list for this later with the vert inside it already
        }
        else {
            layerMatrix[layer].push(topologicallySortedNodes[i]);
        }

        //The layer should also account for which index of the final matrix we appear in.
        if (layer > maxLayer) {
            maxLayer = layer;
        }
    }

    /*
    for (let i=0; i <= maxLayer; i++) {
        layerMatrix.push([]);
    }
    for (let i=0; i < topologicallySortedNodes.length; i++) {
        layerMatrix[topologicallySortedNodes[i].layer].push(topologicallySortedNodes[i]);
    }
    */

    //Done!
    return layerMatrix;
}

/**
 * Traverse the graph and replace all outgoing edges which span multiple layers with edges going to dummy vertices, which are
 * newly inserted into the graph structure.
 *
 * After this step, all outgoing edges should only span one layer.
 *
 * Dummy vertices will be re-used by sets of parents which have spanning links to the same child, for grouping purposes.
 *
 * @param layerMatrix
 * @return {*}
 */
function addDummyVertices(layerMatrix) {
    //Loop through each vertex in the graph, in layer order. We will then identify outgoing edges which span across more
    //than one layer, and assign dummy verts into that layer matrix list (for the layers which are spanned 'over')
    for (let layer of layerMatrix) {
        for (let v of layer) {

            //Look through each outgoing edge..
            for (let edge of v.outgoingEdges) {
                //Alright. Check if it spans more than one layer.
                if (edge.vertex.layer > v.layer + 1) {
                    //We will need to replace this outgoing edge with one which goes to a dummy node, instead...
                    //However, we need to make sure that there is not already a dummy node in this layer which represents
                    //relationships going to this particular child, so that spanning relationships from different parents but to same child
                    //may be grouped together with the same dummy vertex.

                    let dummy = null;
                    //Look through the next layer's list to see if a corresponding dummy already exists..
                    for (let potentialDummy of layerMatrix[v.layer+1]) {
                        if (potentialDummy.contentNode == null && potentialDummy.outgoingEdges.length === 1 && potentialDummy.outgoingEdges[0].vertex === edge.vertex) {
                            //Found a corrsponding dummy! Woohoo!
                            dummy = potentialDummy;
                            break;  //Stop looking boi.
                        }
                    }

                    //If the 'dummy' is still null, that means there was no existing one. So i'm going to create it now!
                    if (dummy == null) {
                        dummy = new Vertex(null);   //Pass null so that we know it's a dummy; it doesn't directly represent an original ContentNode!
                        dummy.layer = v.layer+1;    //Dummy vertex will sit in the layer directly below the currently examined vertex.
                        dummy.addOutgoingEdge(edge.vertex, edge.label); //Dummy should look to the original target child.

                        //WARNING: THIS WILL FUCK UP THE CHILD'S INCOMING EDGE LISTING!! DO NOT USE FROM NOW ON
                        //TODO: AVOID THIS ISSUE BY EFFICIENTLY MUTATING INCOMING NODE LIST IN CHILD VERTEX, IF NEED BE

                        //Finally, push this new dummy into the corresponding layer.
                        layerMatrix[dummy.layer].push(dummy);
                    }

                    //Alright! Now, we need to remove the original outgoing edge, and replace it with an outgoing edge going to this dummy instead!
                    edge.vertex = dummy;
                    dummy.incomingEdges.push(v);
                }
            }
        }
    }

    return layerMatrix;
}


function buildGroupsByAssociation(layerMatrix) {
    //First, instantiate an empty matrix object which we will use to add groups into.
    let groups = [];
    groups[0] = [];     //Empty list is the first element of the outer list..

    //For layer zero, each root vertex should be it's own group!
    for (let v of layerMatrix[0]) {
        groups[0].push(new GroupVertex([v]));
    }

    //Now, build temporary grouping association markers into those vertices from each group
    for (let i=0; i < groups[0].length; i++) {
        let group = groups[0][i];
        for (let v of group.members) {
            //For each child of this vertex in 'group', add an association tracker element, to indicate group linkage.
            for (let edge of v.outgoingEdges) {
                edge.vertex.groupIndexes.add(i);
                edge.vertex.groupIncomingEdges.add(group);
            }
        }
    }

    //Sweet! now, let us iterate through the layers, and figure out how many groups to make for each one, based on the
    //connections to groups in the layer above it.
    let map = new Map();    //Empty map boi! We will use this to tell if a group object already exists for a given combination of parent-group relationships.
    for (let j=1; j < layerMatrix.length; j++) {
        groups[j] = [];
        let layer = layerMatrix[j];

        //First, cycle the vertices and place them into group objects, using the map to lookup if the given group object
        //has been instantiated yet, for that vertex's specific combination of parent groups. (since each group is defined as a collection
        //of vertices which have the same set of groups as parents). If not instantiated, create it and insert it into the map!
        for (let v of layer) {
            //the 'key' for a given group is a sorted-order set of parent indexes, where the index represents the location in the layer-above group list
            //corresponding to that group
            let key = generateGroupKeyString(v.groupIndexes);
            let group = null;
            if (map.has(key)) {
                group = map.get(key);
                group.addMember(v);     //Add this vertex to the group
            }
            else {
                //Doesn't exist yet! Let's change that.
                group = new GroupVertex([v]);
                map.set(key, group);
            }
            //Now, for all of the parent groups which look at this vertex, add this child group as a child.
            for (let parentGroup of v.groupIncomingEdges) {
                parentGroup.addOutgoingEdge(group);
            }

            //Finally, remove the grouping clutter bullshit from the vertex object
            v.groupIncomingEdges = new Set();
            v.groupIndexes       = new Set();
        }

        //Second, insert all of the new GroupVertex objects into the group matrix, for this layer.
        for (let [key, group] of map) {
            groups[j].push(group);

            console.log("Group "+key+" has members: ");
            for (let m of group.members) { console.log((m.contentNode ? m.contentNode.titleText : "DUMMY")); }
        }

        //TODO: For any group which only has one parent, and where that parent only has one child (this), then split that group
        //TODO: into a separate sub-groups where each new group is a single vertex in the original group. This is to avoid grouping stagnation
        //TODO: where one-to-one group relationships emerge. (the rationale here is that groups with a 1-1 indicate that the upper group can
        //TODO: behave as a new 'root' group, allowing us to essentially restart the grouping process recursively within that group's sub-tree.

        //Okay, now we can loop through each edge in each vertex in each group in this layer, and begin the set up for the
        //next layer of group construction by once again tagging associations to parent groups in the next-layer of vertices.
        for (let i=0; i < groups[j].length; i++) {
            let group = groups[j][i];
            for (let v of group.members) {
                //For each child of this vertex in 'group', add an association tracker element, to indicate group linkage.
                for (let edge of v.outgoingEdges) {
                    edge.vertex.groupIndexes.add(i);
                    edge.vertex.groupIncomingEdges.add(group);
                }
            }
        }
        map = new Map();    //Clear the temporary map, for the next iteration to use.
    }

    //Done! return the matrix of groups-by-layer. (note also, that the GroupVertex's form a DAG as well!)
    return groups;
}

//helper
function generateGroupKeyString(indexSet) {
    let indexArray = [];
    for (let idx of indexSet) {
        indexArray.push(idx);
    }
    indexArray.sort();
    let ret = "";
    for (let i of indexArray) {
        ret = ret+"_"+i;
    }
    return ret;
}


/**
 * Takes a graph of vertices (either base vertices or group vertices) and permutes layer ordering to find the minimum relationship crossovers.
 *
 * Doing FUCKING RAW permutations is way too expensive. Instead, we will do the following approximations to try find a decent ordering:
 *
 * Place nodes under parents in 'positions' determined by the average position of any vertex's parents. (the layers above any layer
 * being processed has a fixed ordering, as layers are processed sequentially).
 *
 * Scan through the layer, and pick each pair of adjacent vertexes. If swapping these two vertices reduces the number of line
 * overlaps between the two layers, swap them, and continue.
 *      (optional) Keep scanning until no more swaps, or some set limit of scans (??) Not sure if feasible..
 *
 *      To determine no. of crossovers for a pair of vertices, labelled v1 and v2, compute: (INSIDE HELPER FUNCTION)
 *      - compare each edge-to-parent of v1 to every edge which doesn't go to v1, and count crossovers.
 *      - compare each edge-to-parent of v2 to every edge which doesn't go to v1 or v2, and count crossovers.
 *      - add results together to get the 'score' for v1 and v2 in that arrangement.
 *
 *      - SWAP POSITIONS OF v1 and v2, and do the above calculation again.
 *      - If the score is higher than on the first arrangement, swap v1 and v2 back to their original positions, else do nothing.
 *
 *      - return.
 *
 * @param layerMatrix
 */
function findLeastCrossoverOrdering(groupMatrix) {
    //For now, we just have one layer of groupings. So do group arrangements once, then vert arrangements once.
    groupArrangement(groupMatrix);
    baseVertexArrangement(groupMatrix);

    return groupMatrix;
}

function groupArrangement(matrix) {
    //First, just leave the root ordering as is!
    insertParentIndexCollectionIntoChildren_Groups(matrix[0]);

    for (let i=1; i < matrix.length; i++) {
        arrangeLayer(matrix[i], 3);     //3 scans for now as a test..
        insertParentIndexCollectionIntoChildren_Groups(matrix[i]);
    }
}

function baseVertexArrangement(groupMatrix) {
    //First, just leave the root layer ordering as is
    insertParentIndexCollectionIntoChildren_BaseVerts(groupMatrix[0]);

    for (let i=1; i < groupMatrix.length; i++) {
        //For each layer, arrange each vertex subset based on the groupings.
        for (let group of groupMatrix[i]) {
            arrangeLayer(group.members, 3);
        }
        insertParentIndexCollectionIntoChildren_BaseVerts(groupMatrix[i]);
    }
}

function insertParentIndexCollectionIntoChildren_Groups(orderedLayerArray) {
    for (let i=0; i < orderedLayerArray.length; i++) {
        let curr = orderedLayerArray[i];
        for (let child of curr.outgoingEdges) {
            if (child.incomingEdgeOrderingIndexes === undefined) {
                child.incomingEdgeOrderingIndexes = [i];
            }
            else {
                child.incomingEdgeOrderingIndexes.push(i);
            }
        }
    }
}
function insertParentIndexCollectionIntoChildren_BaseVerts(orderedLayerArray) {
    for (let i=0; i < orderedLayerArray.length; i++) {
        let group = orderedLayerArray[i];
        for (let v of group.members) {
            for (let edge of v.outgoingEdges) {
                let child = edge.vertex;
                if (child.incomingEdgeOrderingIndexes === undefined) {
                    child.incomingEdgeOrderingIndexes = [i];
                }
                else {
                    child.incomingEdgeOrderingIndexes.push(i);
                }
            }
        }
    }
}

/**
 * Function which invoked the swap-if-required function repeatedly on a layer of vertices
 *
 * FUNCTION RELIES ON THE CALLING FUNCTION HAVING SET UP INCOMING EDGE COLLECTION IN THE CHILDREN WHICH INDICATES THE INDEX OF THE PARENT IN THE
 * ABOVE LAYER ORDERING! THIS SHOULD BE DONE AS A PRELIMINARY STEP!
 *
 * @param layer
 * @param numScans
 */
function arrangeLayer(layer, numScans) {
    //For now, scan through successively and make swaps if it improves things.. Later we might do multiple scans in a more intelligent way.
    while(numScans > 0) {
        for (let i=1; i < layer.length; i++) {
            swapVerticesIfItImproves(layer, i-1, i);
        }
        numScans--;
    }
}
/*
function arrangeLayerSubset(layerGroups, groupToSortIndex, numScans) {
    while(numScans > 0) {
        for (let i=1; i < layer.length; i++) {
            swapVerticesIfItImproves(layer, i-1, i);
        }
        numScans--;
    }
}
*/

/**
 * FUNCTION RELIES ON THE CALLING FUNCTION HAVING SET UP INCOMING EDGE COLLECTION IN THE CHILDREN WHICH INDICATES THE INDEX OF THE PARENT IN THE
 * ABOVE LAYER ORDERING! THIS SHOULD BE DONE AS A PRELIMINARY STEP!
 * @param parentLayer
 * @param childLayer
 * @param v1index
 * @param v2index
 */
function swapVerticesIfItImproves(childLayer, v1index, v2index) {
    let originalOverlaps = countOverlapsForPair(childLayer, v1index, v2index);

    //Swap the vertices and count again..
    let tmp = childLayer[v1index];
    childLayer[v1index] = childLayer[v2index];
    childLayer[v2index] = tmp;

    let newOverlaps      = countOverlapsForPair(childLayer, v1index, v2index);

    //If the made things worse, swap back
    if (newOverlaps > originalOverlaps) {
        let tmp = childLayer[v1index];
        childLayer[v1index] = childLayer[v2index];
        childLayer[v2index] = tmp;

        return false;   //indicate no swap was made
    }
    else {
        return true;    //indicate we swapped!
    }
}

function countOverlapsForPair(childLayer, v1index, v2index) {
    let overlaps = 0;

    //Check all potential overlaps with each edge-line to v1
    for (let v1Edge of childLayer[v1index].incomingEdgeOrderingIndexes) {
        //for child-layer vertices which PRECEDE v1 in the ordering, it will be an overlap if the parent coordinate for a tested edge is HIGHER than the v1 parent index.
        for (let i=0; i < v1index; i++) {
            //Check all edges for preceding verts
            for (let candidateEdge of childLayer[i].incomingEdgeOrderingIndexes) {
                if (candidateEdge > v1Edge) {
                    //OVERLAPS!
                    overlaps++;
                }
            }
        }
        //for child-layer vertices which SUCCEED v1 in the ordering, it will be an overlap if the parent coordinate is LOWER than the v1 parent.
        for (let i = v1index+1; i < childLayer.length; i++) {
            //Check all edges for succeeding verts
            for (let candidateEdge of childLayer[i].incomingEdgeOrderingIndexes) {
                if (candidateEdge < v1Edge) {
                    //OVERLAPS!
                    overlaps++;
                }
            }
        }
    }
    //Check all potential overlaps with each edge-line to v2, except those which go to v1, since they have already been checked.
    for (let v2Edge of childLayer[v2index].incomingEdgeOrderingIndexes) {
        for (let i=0; i < v2index; i++) {
            if (i == v1index) {
                continue;   //Skip this iteration if we are to be comparing with v1
            }

            //Check all edges for preceding verts
            for (let candidateEdge of childLayer[i].incomingEdgeOrderingIndexes) {
                if (candidateEdge > v2Edge) {
                    //OVERLAPS!
                    overlaps++;
                }
            }
        }
        for (let i = v2index+1; i < childLayer.length; i++) {
            if (i == v1index) {
                continue;   //Skip this iteration if we are to be comparing with v1
            }

            //Check all edges for succeeding verts
            for (let candidateEdge of childLayer[i].incomingEdgeOrderingIndexes) {
                if (candidateEdge < v2Edge) {
                    //OVERLAPS!
                    overlaps++;
                }
            }
        }
    }
    return overlaps;
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

        this.incomingEdges = [];

        this.incomingEdgeCount = 0; //Used to detect when there are no more incoming nodes!

        this.layer = -1;    //Int used to track which 'layer' a vertex belongs in. 0 will refer to a root node, and so on. < 0 will indicate that a layer has not been calculated.

        this.groupIndexes = new Set();     //Used for building groups later in the algorithm.
        this.groupIncomingEdges = new Set();
    }

    //Functions used to build the graph, during the setup phase.
    addOutgoingEdge(otherVertex, relationshipLabel) {
        this.outgoingEdges.push({
            vertex: otherVertex,
            label: relationshipLabel
        });

        //Increment the other vertex's incoming edge counter (used in the topological sorting)
        otherVertex.incomingEdgeCount++;

        //Add an incoming edge reference as well, for longest path calculations POST topological sorting.
        otherVertex.incomingEdges.push(this);
    }

    //Functions used to remove outgoing edges, during Kahn's algorithm operation.

    /**
     * This function will remove the first outgoing edge from this vertex's adjacency list, decrement the incoming edge counter
     * of that vertex, and then return the vertex that was popped. This is designed to be repeatedly called by Kahn's algorithm
     * during the part where we traverse to each child of an independent node, remove the edges, then test each child to see if
     * they are now independent.
     *
     * NOTE: THIS WILL NOT MUTATE THE CHILD NODE'S INCOMING EDGE LIST, ONLY THE COUNTER, AS IT'S NOT NECESSARY TO DO BOTH!
     */
    removeFrontMostEdge() {
        let removed = this.outgoingEdges.pop();
        removed.vertex.incomingEdgeCount--;     //Decrement the counter of that vertex, since this edge no longer exists.
        this.removedOutgoingEdges.push(removed);

        return removed.vertex;  //Return that vertex, so that the algorithm using this function can examine it/test conditions/continue using it
    }
}

class GroupVertex {
    constructor(memberList) {
        this.members = [];  //Simple list of objects that belong in this group.
        this.outgoingEdges = [];
        this.incomingEdges = [];

        if (memberList !== undefined) {
            for (let member of memberList) {
                this.addMember(member);
            }
        }
    }

    addOutgoingEdge(childGroup) {
        this.outgoingEdges.push(childGroup);
        childGroup.incomingEdges.push(this);
    }

    removeOutgoingEdge(g) {
        let i = this.outgoingEdges.indexOf(g);
        if (i !== -1) {
            this.outgoingEdges.splice(i, 1);
            i = g.incomingEdges.indexOf(this);
            if (i !== -1) {
                g.incomingEdges.splice(i, 1);
            }
        }
    }

    addMember(obj) {
        this.members.push(obj);
    }

    removeMember(obj) {
        let i = this.members.indexOf(obj);
        if (i !== -1) {
            this.members.splice(i,1);
        }
    }
}

