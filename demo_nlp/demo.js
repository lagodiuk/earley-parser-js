function init() {
   
    // Example from: https://en.wikipedia.org/wiki/CYK_algorithm#Example
    var grammar = new tinynlp.Grammar([
        'S -> NP VP',
        'VP -> VP PP | V NP | V',
        'PP -> P NP',
        'NP -> Det N | N'
    ]);

    grammar.terminalSymbols = function(token) {
        if(token == 'eats') return ['V'];
        if(token == 'fish') return ['N'];
        if(token == 'fork') return ['N'];
        if(token == 'she') return ['N'];
        if(token == 'a') return ['Det'];
        if(token == 'with') return ['P'];
        // otherwise:
        return [];
    }

    // S - sentence
    // V - verb
    // N - noun
    // P - preposition
    // Det - determiner
    // NP - noun phrase
    // VP - verb phrase
    // PP - preposition phrase

    // You have to tokenize input by yourself!
    // Creating array of tokens
    var tokens = 'she eats a fish with a fork'.split(' ');

    // Parsing
    var rootRule = 'S';
    var chart = tinynlp.parse(tokens, grammar, rootRule);

    console.log('\n')

    // Get array with all parsed trees
    var trees =  chart.getFinishedRoot(rootRule).traverse();

    // Iterate over all parsed trees and display them on HTML page
    for (var i in trees) {
        console.log(JSON.stringify(trees[i]))
        document.body.innerHTML += '<div class="tree" id="displayTree"><ul>' + displayTree(trees[i]) + '</ul></div></br>'
    }

    function displayTree(tree) {
        if (!tree.subtrees || tree.subtrees.length == 0) {
            return '<li><a href="#">' + tree.root + '</a></li>';
        }
        var builder = [];
        builder.push('<li><a href="#">');
        builder.push(tree.root);
        builder.push('</a>')
        builder.push('<ul>')
        for (var i in tree.subtrees) {
            builder.push(displayTree(tree.subtrees[i]))
        }
        builder.push('</ul>')
        builder.push('</li>')
        return builder.join('');
    }
}
