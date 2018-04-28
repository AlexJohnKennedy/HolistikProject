//Include Mongoose and open a connection to our database
const mongoose = require('mongoose');
//let err = mongoose.connect('mongodb://jaidenkf:HelloWorld123@ds061474.mlab.com:61474/holistik-prod');



//For client side AJAX testing, we are using hardcoded JSON in the server side for now.
let stateJSON_2 = '[{"idString":"contentNode0","colour":"#a6cdf2","titleText":"New concept","descriptionText":"See the \'Help\' page for some tips on using Holistik!","childrenList":[]},{"idString":"contentNode1","colour":"#a6cdf2","titleText":"New concept","descriptionText":"See the \'Help\' page for some tips on using Holistik!","childrenList":[{"displayedLabel":"Child","categoryLabel":"child","parentNode":"contentNode1","children":["contentNode0","contentNode2"]}]},{"idString":"contentNode2","colour":"#a6cdf2","titleText":"SUppity Bup","descriptionText":"See the \'Help\' page for some tips on using Holistik!","childrenList":[]}]';
let arrangmentJSON_2 = '{ "contextNodeId": "contentNode1", "nodeData": [{"idString":"contentNode0","translation":{"x":84,"y":327},"size":{"height":60,"width":120},"isExpanded":true,"isShowingInfo":false},{"idString":"contentNode1","translation":{"x":269,"y":135},"size":{"height":60,"width":120},"isExpanded":true,"isShowingInfo":false},{"idString":"contentNode2","translation":{"x":268,"y":420},"size":{"height":60,"width":120},"isExpanded":false,"isShowingInfo":false}] }';


