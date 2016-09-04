function init() {

    $('.example').click(function(){     
        $('#txt').val($(this).text());
        $('#txt').trigger('input');
        return false;
    });

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

        var tokenStream = s.trim().split(' ');

        var rules = $('#grm').val().trim().split('\n')
        
        var grammar = new tinynlp.Grammar(rules);
        
        var rootProduction = 'S';
        var chart = tinynlp.parse(tokenStream, grammar, rootProduction);

        var state = chart.getFinishedRoot(rootProduction);
        if (state) {
            $('#dv').empty();
            for (var tree of state.traverse()) {
                console.log(JSON.stringify(tree))
                $('#dv').append('<div class="tree" id="displayTree"><ul>' + displayTree(tree) + '</ul></div></br>');
            }
        }
    });

}
