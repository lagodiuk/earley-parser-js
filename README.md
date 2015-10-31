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

###With hardcoded terminal symbols###
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

###With possibility to classify tokens - into terminal symbols (more generic approach)###
```javascript
var grammar = new tinynlp.Grammar([
    'R -> S',
    'S -> S add_sub M | M | num',
    'M -> M mul_div T | T | num',
    'T -> num',
]); 

// Define function, which will classify tokens into terminal types
grammar.terminalSymbols = function( token ) { 
    if( '+' === token || '-' === token ) return ['add_sub'];
    if( '*' === token || '/' === token ) return ['mul_div'];
    if( token.match(/^\d+$/) ) return ['num'];
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
