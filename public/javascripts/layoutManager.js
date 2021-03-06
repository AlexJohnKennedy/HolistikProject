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

const SET_NODE_HEIGHT = 85;
const LAYER_ADDITIONAL_SPACING   = 130;  //Vertical pixels between the tops of nodes on separate layers.
const NODE_SPACING    = 40;
let   GROUP_SPACING   = 100;
const GROUP_SPACING_ORIGINAL_METHOD = 100;
const DUMMY_SPACING   = 0;
const HORIZONTAL_WIDTH_PADDING_RATIO = 0.5;     //Ratio of horizontal padding to adjust for layer width differences (0.5 means pad half the difference)

function autoArrangeVisibleNodes(useSimpleGrouping) {
    //If there are no nodes, return immediately
    if (canvasState.contentNodeList.length === 0) {
        return;
    }

    //Before we do anything, we should shrink all of the 'showing info' nodes
    hideAllInfo();

    //Topologically sort visible nodes.
    let topSorted = topologicalSortVisibleNodes();

    if (topSorted === null || topSorted === undefined) { return; }

    //Assign layer numbers to each visible node.
    let layerAssigned = assignVerticesToLayers(topSorted);

    //DEBUG:
    //console.log(layerAssigned);

    //Build dummy vertices (point to a NULL contentNode) in each layer, to represent relationships that span across more
    //than one layer. This is done so that we can encompass spanning relationships in our layer-by-layer permutation calculations
    //when we try to find a layer ordering which results in the fewest relationship line cross-overs.
    let layersWithDummyVerts = addDummyVertices(layerAssigned);

    //Construct a 'group meta graph' based on grouping vertices with similar parent paths.
    let groupMatrix;
    if (useSimpleGrouping) {
        GROUP_SPACING = NODE_SPACING;
        groupMatrix = buildGroupsByAssociation_SIMPLE_METHOD(layersWithDummyVerts);
    }
    else {
        GROUP_SPACING = GROUP_SPACING_ORIGINAL_METHOD;
        groupMatrix = buildGroupsByAssociation_ORIGINAL_METHOD(layersWithDummyVerts);
    }

    //DEBUG:
    //debugPrint_LayersWithDummyVerts(layersWithDummyVerts);

    //DEBUG2:
    console.log(groupMatrix);

    let verticesWithGroupBoundaries = findLeastCrossoverOrdering(groupMatrix);

    //DEBUG3:
    debugPrint_LayersAfterArrangement(verticesWithGroupBoundaries);

    //Pray..
    animateToFinalPositions(verticesWithGroupBoundaries, true);
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
        //Only consider the outgoing relationships if the node is both visible AND expanded!
        if (contentNode.isVisible && contentNode.isExpanded) {
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
        if (contentNode.vertexWrapper.incomingEdges.length === 0) {
            independentVertices.push(contentNode.vertexWrapper);
        }
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


/**
 * The grouping method was sort of a failure, but because of how coupled this bad-code is, i need to create group verts anyway to keep the rest of
 * the algorithm working.. So i'm just going to assign every vertex to it's own group, to simulate the effects of not having grouping to begin with.
 * Yes, this does mean pointless work is done on the base-vertex calculation level, but it should be negligible to the outer layer complexity anyway, and it
 * serves as a sufficient workaround unitl i have time to rewrite the ararngment logic from scratch with the stuff i learned from my partially failed attempt here...
 * @param layerMatrix
 */
function buildGroupsByAssociation_SIMPLE_METHOD(layerMatrix) {
    //Just make every vertex it's own group as a 'workaround' for removing grouping logic entirely...
    let groups = [];
    for (let layer of layerMatrix) {
        let layerGroups = [];
        for (let v of layer) {
            let g = new GroupVertex([v]);
            v.g = g;    //Temp
            layerGroups.push(g);
        }
        groups.push(layerGroups);
    }

    //Assign group relationships directly to simulate base vertex relationships..
    for (let groupLayer of groups) {
        for (let g of groupLayer) {
            //Should only be one member in each, for 'simple' method..
            let v = g.members[0];
            for (let edge of v.outgoingEdges) {
                g.addOutgoingEdge(edge.vertex.g);
            }
        }
    }

    return groups;
}

/**
 * original way of forming groups, which ended up resulting in sorta weird behaviour that wasn't consistent.
 * For now i am considering replacing it with a less sophisicated method, which might sometimes give a less pretty arrangement, but is more consistent
 * and doesn't create unexpected/janky arrangements as often.(see 'simple method' version)
 */
function buildGroupsByAssociation_ORIGINAL_METHOD(layerMatrix) {
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
    //use the number of shared leaf descendants to approximate the best root node ordering.
    //(place roots which have the most shared desendants together)
    groupMatrix[0] = findBestRootLayerOrdering(groupMatrix[0], findLeaves(groupMatrix));

    //For now, we just have one layer of groupings. So do group arrangements once, then vert arrangements once.
    groupArrangement(groupMatrix);
    let verticesWithGroupBoundaries = baseVertexArrangement(groupMatrix);

    return verticesWithGroupBoundaries;
}
function findLeaves(matrix) {
    let toRet = [];
    for (let i=1; i < matrix.length; i++) {
        for (let member of matrix[i]) {
            if (member.outgoingEdges.length === 0) {
                 toRet.push(member);
            }
        }
    }
    return toRet;
}
/**
 * Use the number of shared leaf descendents as an estimate for the priority of pairing roots closesly next to each other
 * @param roots
 * @param leaves
 */
function findBestRootLayerOrdering(roots, leaves) {
    //Set up auxiliary data structures for the roots
    for (let root of roots) {
        root.sharedDescendents = new Map();
        for (let innerRoot of roots) {
            if (root !== innerRoot) {
                root.sharedDescendents.set(innerRoot, 0);   //Number represents the number of shared leaf descendants.
            }
        }
        //console.log("TESTING DIS SHIT");
        //console.log(root.sharedDescendents);
    }

    //Okay. From each leaf group, traverse UP to each root to figure out which root is accessible from each leaf.
    for (let leaf of leaves) {
        discoverSharedRootsFrom(leaf);
    }

    //DEBUG:
    debugPrint_sharedRoots(roots);

    //ALRIGHT. We can now begin searching through the root objects and chaining them together based on their most closesly 'bound' partners.
    //Start with the most highly coupled root in the center.
    let finalOrdering = [];
    let max = 0, maxIdx = 0;
    for (let i=0; i < roots.length; i++) {
        let currNum = 0;
        for (let [root, num] of roots[i].sharedDescendents) {
            currNum += num;
        }

        //If more coupled than the previous most coupled, pick it!. Tie break by the total number of children in general..
        if (currNum > max) {
            max = currNum;
            maxIdx = i;
        }
        else if (currNum === max && roots[i].outgoingEdges.length > roots[maxIdx].outgoingEdges.length) {
            maxIdx = i;
        }
    }

    //We just found the most tightly coupled root. This should go in the middle of the list!
    //let centralRoot = roots[maxIdx];
    finalOrdering.push(roots[maxIdx]);
    roots.splice(maxIdx, 1); //Remove from original list as it's location has already been placed.

    let frontAdd = true;
    while (roots.length > 0) {
        if (frontAdd) {
            //Add nearest neighbor to front of list
            let closest = findMostCoupledRemainingNeighbour(finalOrdering[0], roots);    //This function will pop the closest remaining neighbor from the passed in list
            finalOrdering.unshift(closest);
        }
        else {
            //Add nearest neighbor to end of list
            let closest = findMostCoupledRemainingNeighbour(finalOrdering[finalOrdering.length-1], roots);    //This function will pop the closest remaining neighbor from the passed in list
            finalOrdering.push(closest);
        }
        frontAdd = !frontAdd;   //Alternate inserting neighbors from front and back of list, to get a better average spread.
    }

    return finalOrdering;   //Return the new ordering as an an array of root verts/groups.
}

function findMostCoupledRemainingNeighbour(root, remainingRoots) {
    let max = 0;
    let maxIdx = 0;
    let closestNeighbour = null;
    for (let i=0; i < remainingRoots.length; i++) {
        let count = root.sharedDescendents.get(remainingRoots[i]);

        console.log(root);
        console.log(remainingRoots);
        console.log("Count is: "+count+", current max is "+max);

        //If it's more tightly coupled, or equally, with more children in general (tiebreaker)
        if ( (count > max) || ((count === max) && (closestNeighbour == null || remainingRoots[i].outgoingEdges.length > closestNeighbour.outgoingEdges.length)) ) {
            closestNeighbour = remainingRoots[i];
            maxIdx = i;
            max = count;
        }
    }

    //make sure to remove the chosen neighbor from the remaining root list..
    remainingRoots.splice(maxIdx, 1);

    console.log("Closest Neighbor is: "+closestNeighbour);

    return closestNeighbour;
}

function discoverSharedRootsFrom(leaf) {
    //Start with an empty list. This list will be populated with a list of all root groups accessible from
    //this leaf group. (the recursive function will do this!)
    let rootsAccessible = new Set();

    recurseUp(leaf, rootsAccessible);

    console.log("ROOTS REACHABLE FROM LEAF GROUP WITH: "+leaf.members[0].contentNode.titleText);
    console.log(rootsAccessible);

    //Alright, the list should now contain all of the roots. Now we simply tell those roots that they share this leaf
    //as a descendant!
    for (let r of rootsAccessible) {
        for (let r2 of rootsAccessible) {
            if (r !== r2) {
                //Increment the value!
                r.sharedDescendents.set(r2, r.sharedDescendents.get(r2) + 1);
            }
        }
    }
}
function recurseUp(curr, set) {
    //If the current vert has no parents, then it is a root! Add to list and return
    if (curr.incomingEdges.length === 0) {
        set.add(curr);
        return;
    }
    else {
        //Recurse to all parents
        for (let par of curr.incomingEdges) {
            recurseUp(par, set);
        }
    }
}


function groupArrangement(matrix) {
    //First, just leave the root ordering as is!
    insertParentIndexCollectionIntoChildren_Groups(matrix[0]);

    for (let i=1; i < matrix.length; i++) {
        //First, place each group at a position based on the average index of it's parents..
        matrix[i] = preliminaryArrangements(matrix[i]);

        //Make swaps to arrange better, after using this averaging technique
        arrangeLayer(matrix[i], 3);     //3 scans for now as a test..

        //Now that this layer has been finalised, set up the 'parent indexes' information in the children groups.
        insertParentIndexCollectionIntoChildren_Groups(matrix[i]);
    }
}
function preliminaryArrangements(list) {
    //for each group in the layer, calculate the average parent index.
    let resultingOrdering = [];
    for (let member of list) {
        member.averageParentOrderingIndex = calcAvgParentOrderingIndex(member);

        let i=0;    //Used to determine insertion location
        while (i < resultingOrdering.length && member.averageParentOrderingIndex > resultingOrdering[i].averageParentOrderingIndex) {
            i++;    //Keep looking...
        }

        //Okay, the correct position to insert is at position i.
        resultingOrdering.splice(i, 0, member);
    }

    return resultingOrdering;
}
function calcAvgParentOrderingIndex(v) {
    let total = 0;
    for (let parIdx of v.incomingEdgeOrderingIndexes) {
        total += parIdx;
    }
    if (v.incomingEdgeOrderingIndexes.length === 0) {
        return -1; /*ERROR CASE*/
    }
    else {
        return total / v.incomingEdgeOrderingIndexes.length;
    }
}

function baseVertexArrangement(groupMatrix) {
    //First, convert the group matrix into an object which has a vertex matrix, and a group-index-boundary matrix.
    let toRet = {
        vertexMatrix : [],
        groupBoundaryMatrix : []
    };
    for (let i=0; i < groupMatrix.length; i++) {
        //For each layer, add a new row in both matrices
        toRet.vertexMatrix[i] = [];
        toRet.groupBoundaryMatrix[i] = [];

        //For each layer, reset the group boundaries offset to zero.
        let boundary = 0;

        //loop through each group in this layer, adding the members into the array and tracking the boundaries appropriately
        for (let j=0; j < groupMatrix[i].length; j++) {

            //For each group, indicate which index the group starts at.
            toRet.groupBoundaryMatrix[i].push(boundary);

            for (let v of groupMatrix[i][j].members) {
                toRet.vertexMatrix[i].push(v);
            }

            boundary += groupMatrix[i][j].members.length;
        }
        toRet.groupBoundaryMatrix[i].push(boundary);   // Should be the size of the layer array of verts.
    }

    //Begin the swapping process!
    insertParentIndexCollectionIntoChildren_BaseVerts(groupMatrix[0]);

    for (let i=1; i < groupMatrix.length; i++) {
        //console.log("ARRANGING BASE VERTEX LAYER: "+i);
        for (let j=1; j < toRet.groupBoundaryMatrix[i].length; j++) {
            //console.log("Group subset: "+j);
            arrangeLayerSubset(toRet.vertexMatrix[i], toRet.groupBoundaryMatrix[i][j-1], toRet.groupBoundaryMatrix[i][j], 3);
        }
        insertParentIndexCollectionIntoChildren_BaseVerts(groupMatrix[i]);
    }

    return toRet;
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
        let index = 0;
        for (let v of group.members) {
            for (let edge of v.outgoingEdges) {
                let child = edge.vertex;
                if (child.incomingEdgeOrderingIndexes === undefined) {
                    child.incomingEdgeOrderingIndexes = [index];
                }
                else {
                    child.incomingEdgeOrderingIndexes.push(index);
                }
            }
            index++;
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

function arrangeLayerSubset(layer, start, stop, numScans) {
    while(numScans > 0) {
        for (let i=start+1; i < stop; i++) {
            //console.log("Considering verts "+ (i-1) + " and "+i);
            swapVerticesIfItImproves(layer, i-1, i);
        }
        numScans--;
    }
}


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
    if (newOverlaps >= originalOverlaps) {
        let tmp = childLayer[v1index];
        childLayer[v1index] = childLayer[v2index];
        childLayer[v2index] = tmp;

        //console.log("DID NOT SWAP: orig had "+originalOverlaps+" overlaps, swapped had "+newOverlaps+" overlaps");
        return false;   //indicate no swap was made
    }
    else {
        //console.log("SWAPPED: orig had "+originalOverlaps+" overlaps, swapped had "+newOverlaps+" overlaps");
        return true;    //indicate we swapped!
    }
}

function countOverlapsForPair(childLayer, v1index, v2index) {
    let overlaps = 0;

    //debugPrintLayer_DuringOverlapCounting(childLayer);

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
            if (i === v1index) {
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
            if (i === v1index) {
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

        //Temporary edge storage for algorithm processing.
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

// ---------------------------------------------------------------------------------------------------------------------
// --- Calculate position coordinates -----------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function animateToFinalPositions(verticesWithGroupBoundaries, setHeights) {
    console.log("Logging the verticesWithGroupBoundaries object passed to ");
    //find the layer with the greatest width, and use that as our 'base'
    let LAYER_SPACING = (setHeights ? SET_NODE_HEIGHT + LAYER_ADDITIONAL_SPACING : MAX_NODE_HEIGHT + LAYER_ADDITIONAL_SPACING);

    let layerWidths = [];
    let layerNum = 0;
    let maxWidth = 0;
    for (let layer of verticesWithGroupBoundaries.vertexMatrix) {
        let width = calculateLayerWidth(layer, verticesWithGroupBoundaries.groupBoundaryMatrix[layerNum]);

        if (width > maxWidth) {
            maxWidth = width;
        }

        layerWidths.push(width);
        layerNum++;
    }

    //ERROR if the canvas is too small for the proposed arrangement.
    if (maxWidth > CANVAS_WIDTH - 5 || verticesWithGroupBoundaries.vertexMatrix.length * LAYER_SPACING > CANVAS_HEIGHT - 5) {
        console.log("ERROR: Canvas is too small for auto arrangement!! Aborting arrangement attempt!!!");
        console.log("ERROR: Canvas is too small for auto arrangement!! Aborting arrangement attempt!!!");
        return;
    }

    let layerHorizontalOffsets = [];

    for (let i=0; i < verticesWithGroupBoundaries.vertexMatrix.length; i++) {
        let layer = verticesWithGroupBoundaries.vertexMatrix[i];
        let width = layerWidths[i];
        let groupBoundaries = verticesWithGroupBoundaries.groupBoundaryMatrix[i];
        let hOffsets = distributeLayerOverWidth(layer, groupBoundaries, width, maxWidth, HORIZONTAL_WIDTH_PADDING_RATIO);  //0.5 indicates edge to edge padding ratio

        layerHorizontalOffsets[i] = hOffsets;

        //DEBUG:
        console.log("LOGGING hOffsets for layer "+i);
        console.log(hOffsets);
    }

    //We should just whack this arrangement as centrally as we can, in the drawing canvas..
    let leftOffset = (CANVAS_WIDTH - maxWidth) / 2;
    let topOffset  = (CANVAS_HEIGHT - verticesWithGroupBoundaries.vertexMatrix.length * LAYER_SPACING) / 2;

    centreCoordinatesOnCanvas(CANVAS_WIDTH/2, topOffset + document.getElementById("canvasWindow").offsetHeight/2 * 0.75);

    //Rightio! let's fkn do this shit.
    for (let i=0; i < verticesWithGroupBoundaries.vertexMatrix.length; i++) {
        let hOffsets = layerHorizontalOffsets[i];

        let j=0;
        for (let v of verticesWithGroupBoundaries.vertexMatrix[i]) {
            //For every vert, if it is not a dummy, assign it's position based on the top offset and the leftOffset+currOffset
            if (v.contentNode) {
                //Not a dummy! move that boy! (increments j AFTER indexing, so that the next node gets the correct offset
                if (setHeights) {
                    v.contentNode.resizeNode(v.contentNode.size.width, SET_NODE_HEIGHT, true);
                }
                v.contentNode.moveNodeTo(leftOffset + hOffsets[j++], topOffset, true);
            }
        }

        //Before we move to the next layer, update the top offset!
        topOffset += LAYER_SPACING;
    }

    //FINALLY FUCKING DONE AFTER 1000 LINES OF PURE CANCER.
    //-----------------------------------------------------
    //TO ANYONE READING THIS. PLEASE FOR THE LOVE OF GOD ACTUALLY PLAN YOUR ALGORITHMS BEFORE YOU START CODING. I MADE THE MISTAKE OF
    //TRYING TO IMPROVISE THIS AFTER COMPLETELY UNDERESTIMATING THE COMPLEXITY OF THIS PROBLEM ON A HUNGOVER, NO SLEEP, SUNDAY MORNING.
    //DUE TO DEADLINES, I DID NOT HAVE TIME TO START FROM SCRATCH. THIS FILE IS OVER ONE THOUSAND LINES OF PURE, CANCEROUS SPAGHETTI.
    //I APOLOGISE TO ALL WHO HAVE THE MISFORTUNE OF COMING ACROSS THIS. TAKE SOLACE IN THE FACT THIS IT CAUSED ME AS MUCH PAIN CODING IT AS
    // IT CAUSED YOU TO HAVE TO READ IT.

    //I AM SORRY AND ASHAMED.

    //Sincerely, Alex Kennedy
}

function distributeLayerOverWidth(layer, groupBoundariesArray, layerWidth, widthToDistributeOver, differentialPaddingRatio) {
    console.log(layer);

    let offsets = [];   //length should end up being equal to the number of non-dummy nodes in the layer.

    //First, we need to calculate how much 'padding' there needs to be on the left and right side.
    let padding = differentialPaddingRatio * (widthToDistributeOver - layerWidth);

    //Set up the initial offset (the 'offset' will be continuously added to, to determine the placements of each node sequentially in the layer)
    let currOffset = padding/2; //Half, since we will want to equally pad on each side.

    //Okay, in order to determine the amount to 'stretch' the spacings by, we will need to know the total width of the vertices (minus spacings)
    let nospacingwidth = 0;
    let numVertSpacings = 0;    //These two counters will be used to adjust spacings!
    let numGroupSpacings = 0;
    let i=0, j=1;
    for (let v of layer) {
        nospacingwidth += (v.contentNode ? v.contentNode.size.width : DUMMY_SPACING);

        if (++i === groupBoundariesArray[j]) {
            //Group boundary reached!
            numGroupSpacings++;
            j++;
        }
        else {
            numVertSpacings++;
        }
    }
    numGroupSpacings--; //Take this off, since there is always an extra counted at the end of loop.

    //This 'stretch factor' will tell us how much to scale each spacing value by, to get the correct distribution.
    let spacingWidth       = numVertSpacings * NODE_SPACING + numGroupSpacings * GROUP_SPACING;

    let spacingScaleFactor = (spacingWidth + widthToDistributeOver - layerWidth - padding) / spacingWidth;

    //Okay! now all we have to do, is distribute the layer matey!
    i=0, j=1;
    for (let v of layer) {
        if (v.contentNode) {
            offsets.push(currOffset);   //Current nodes offsets
        }

        //Count the width of this vert's node
        currOffset += (v.contentNode ? v.contentNode.size.width : DUMMY_SPACING);

        if (++i === groupBoundariesArray[j]) {
            //Group boundary reached!
            currOffset += GROUP_SPACING * spacingScaleFactor;
            j++;
        }
        else {
            currOffset += NODE_SPACING * spacingScaleFactor;
        }
    }

    //Done! we now have an array for this layer containing all the horizontal offsets of the nodes, evenly distributed
    return offsets;
}

function calculateLayerWidth(layer, groupBoundariesArray) {
    let i=0, j=1;
    let width=0;
    for (let v of layer) {
        //Count the width of this vert's node
        width += (v.contentNode ? v.contentNode.size.width : DUMMY_SPACING);

        if (++i === groupBoundariesArray[j]) {
            //Group boundary reached!
            width += GROUP_SPACING;
            j++;
        }
        else {
            width += NODE_SPACING;
        }
    }
    return (width - GROUP_SPACING); //Take this off because it's always going to falsely add one at the end
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Debugging helpers -----------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

function debugPrintLayer_DuringOverlapCounting(layer) {
    let str = "Layer Verts:      ";
    for (let i=0; i < layer.length; i++) {
        let v = layer[i];
        str = str + "[" + i + "] " + (v.contentNode ? v.contentNode.titleText : "DUMMY") + " ";
    }
    console.log(str);

    str = "Incoming indexes: ";
    for (let i=0; i < layer.length; i++) {
        let v = layer[i];
        str = str + "[" + i + "] - ";

        for (let e of v.incomingEdgeOrderingIndexes) {
            str = str + e + " ";
        }
    }
    console.log(str);
}

function debugPrint_LayersWithDummyVerts(layersWithDummyVerts) {
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
}

function debugPrint_LayersAfterArrangement(verticesWithGroupBoundaries) {
    console.log("AFTER ARRANGEING WITH CROSSOVER HEURISTICS:");
    console.log(verticesWithGroupBoundaries);
    let layerNum=0;
    for (let layer of verticesWithGroupBoundaries.vertexMatrix) {
        console.log("--- Layer "+(layerNum)+"---");
        let str = "|";
        let i=0, j=1;
        for (let v of layer) {
            str = str + " "+(v.contentNode ? v.contentNode.titleText : "DUMMY") + ",";
            if (++i === verticesWithGroupBoundaries.groupBoundaryMatrix[layerNum][j]) {
                str = str + " |";
                j++;
            }
        }
        console.log(str);
        layerNum++;
    }
}

function debugPrint_sharedRoots(roots) {
    console.log("SHARED ROOTS MAP");
    for (let r of roots) {
        console.log(r.sharedDescendents);
    }
}