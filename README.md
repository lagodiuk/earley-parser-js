# earley-parser-js
Tiny JavaScript implementation of context-free languages parser - [Earley parser](https://en.wikipedia.org/wiki/Earley_parser)

###General information###

The Earley parser is an algorithm for parsing strings that belong to a given [context-free language](https://en.wikipedia.org/wiki/Context-free_language) (the algorithm, named after its inventor, [Jay Earley](https://en.wikipedia.org/wiki/Jay_Earley)).

This algorithm is appealing because it can parse all context-free languages, unlike [LR parsers](https://en.wikipedia.org/wiki/LR_parser) and [LL parsers](https://en.wikipedia.org/wiki/LL_parser), which are more typically used in compilers but which can only handle restricted classes of languages. 

Complexity of Earley parsing algorithm (in terms of *n* - the length of the parsed string):
- *O(n<sup>3</sup>)* - cubic time in the general case
- *O(n<sup>2</sup>)* - quadratic time for unambiguous grammars
- *O(n)* - linear time for almost all LR(k) grammars

Earley parser performs particularly well when the rules are written left-recursively.

##Usage##

Attach to your project - single file with implementation of Earley algorithm: https://rawgithub.com/lagodiuk/earley-parser-js/master/earley-oop.min.js

###Grammar with hardcoded terminal symbols###
```javascript
// Define grammar
var grammar = new tinynlp.Grammar([
     // Define grammar production rules
     'R -> S',
     'S -> S add_sub M | M | num',
     'M -> M mul_div T | T | num',
     'T -> num',
     
     // Define terminal symbols
     'num -> 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0',
     'add_sub -> + | -',
     'mul_div -> * | /'
]);

// You have to tokenize input by yourself!
// Creating array of tokens
var tokens = '2 + 3 * 4'.split(' ');

// Parsing
var rootRule = 'R';
var chart = tinynlp.parse(tokens, grammar, rootRule);

// Get array with all parsed trees
// In case of ambiguous grammar - there might be more than 1 parsing tree
var trees =  chart.getFinishedRoot(rootRule).traverse();

// Iterate over all parsed trees and display them on HTML page
for (var i in trees) {
     console.log(JSON.stringify(trees[i]))
}
```

###Customizing logic of tokens classification into terminal symbols###
Potentially, this approach allows to extend parser with custom classifier of tokens - into terminal symbols (e.g. recognize terminal symbols using Regular expressions or more sophisticated classifiers):
```javascript
var grammar = new tinynlp.Grammar([
    'R -> S',
    'S -> S add_sub M | M | num',
    'M -> M mul_div T | T | num',
    'T -> num',
]); 

// Define function, which will classify tokens into terminal types
grammar.terminalSymbols = function( token ) { 
    // Actually, this method might be customized 
    // to use some more sophisticated classification mechanisms
    
    if( '+' === token || '-' === token ) return ['add_sub'];
    if( '*' === token || '/' === token ) return ['mul_div'];
    if( token.match(/^\d+$/) ) return ['num'];
    // It is also possible that classifier returns 
    // more than one terminal symbol, e.g.: ['term1', 'term2']
    
    // Otherwise:
    throw new Error("Can't recognize token: " + token);
}   

// You have to tokenize input by yourself!
// Creating array of tokens
var tokens = '2 + 3 * 4'.split(' ');

// Parsing
var rootRule = 'R';
var chart = tinynlp.parse(tokens, grammar, rootRule);

// Get array with all parsed trees
// In case of ambiguous grammar - there might be more than 1 parsing tree
var trees =  chart.getFinishedRoot(rootRule).traverse();

// Iterate over all parsed trees and display them on HTML page
for (var i in trees) {
     console.log(JSON.stringify(trees[i]))
}
```
###Traversing parsed trees
Following snippet shows how to transform parsed trees into nested HTML lists:
```javascript
function toNestedList(tree) {
   if (!tree.subtrees || tree.subtrees.length == 0) {
       return '<li>' + tree.root + '</li>';
   }   
   var builder = []; 
   builder.push('<li>');
   builder.push(tree.root);
   builder.push('<ul>')
   for (var i in tree.subtrees) {
       builder.push(toNestedList(tree.subtrees[i]))
   }   
   builder.push('</ul>')
   builder.push('</li>')
   return builder.join('');
} 
```
Example of usage:
```javascript
// Iterate over all parsed trees and display them on HTML page
for (var i in trees) {
     htmlRepresentstion = '<ul>' + toNestedList(trees[i]) + '</ul>'
     // embed htmlRepresentstion into HTML page
}
```
