function init() {
    var grammar = new tinynlp.Grammar([
        'R -> N',
        'S -> S add_sub M | M',
        'M -> M mul_div T | T',
        'N -> S lt_gt S | S',
        'T -> num | ( S )',
    ]);

    grammar.terminalSymbols = function(token) {
        if ('<' === token || '>' === token) return ['lt_gt'];
        if ('+' === token || '-' === token) return ['add_sub'];
        if ('*' === token || '/' === token) return ['mul_div'];
        if ('(' === token) return ['('];
        if (')' === token) return [')'];
        return ['num'];
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

    $('#txt').bind('input', function() {
        var s = $(this).val();

        var tokenStream = s.replace(/\+/g, ' + ').replace(/-/g, ' - ').replace(/\*/g, ' * ').replace(/\//g, ' / ').replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/\s+/g, ' ').trim().split(' ');
        var chart = tinynlp.parse(tokenStream, grammar, 'R');
        console.log('\n')
        var state = chart.getFinishedRoot('R');
        if (state) {
            var trees = state.traverse();
            for (var i in trees) {
                console.log(JSON.stringify(trees[i]))
                $('#dv').html('<div class="tree" id="displayTree"><ul>' + displayTree(trees[i]) + '</ul></div></br>');
            }
        }
    });
}
