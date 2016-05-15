//   Copyright 2015 Yurii Lahodiuk (yura.lagodiuk@gmail.com)
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

var tinynlp = (function(){
    
    function Grammar(rules) {
        this.lhsToRhsList = {};
        for (var i in rules) {
            var rule = rules[i];
            // "A -> B C | D" -> ["A ", " B C | D"]
            var parts = rule.split('->');
            // "A"
            var lhs = parts[0].trim();
            // "B C | D"
            var rhss = parts[1].trim();
            // "B C | D" -> ["B C", "D"]
            var rhssParts = rhss.split('|');
            if (!this.lhsToRhsList[lhs]) {
                this.lhsToRhsList[lhs] = [];
            }
            for (var j in rhssParts) {
                this.lhsToRhsList[lhs].push(rhssParts[j].trim().split(' '));
            }
            // now this.lhsToRhsList contains list of these rules:
            // {... "A": [["B", "C"], ["D"]] ...}
        }
    }
    Grammar.prototype.terminalSymbols = function(token) {
        return [];
    }
    Grammar.prototype.getRightHandSides = function(leftHandSide) {
            var rhss = this.lhsToRhsList[leftHandSide];
            if (rhss) {
                return rhss;
            }
            return null;
    }
    Grammar.prototype.isEpsilonProduction = function(term) {
        // This is needed for handling of epsilon (empty) productions
        // TODO: get rid of this hardcode name for epsilon productions
        return "_EPSILON_" == term;
    }
    
    //------------------------------------------------------------------------------------
    
    loggingOn = true;
    function logging(allow) {
        loggingOn = allow;
    }

    function Chart(tokens) {
        this.idToState = {};
        this.currentId = 0;
        this.chart = [];
        for (var i = 0; i < tokens.length + 1; i++) {
            this.chart[i] = [];
        }
    }
    Chart.prototype.addToChart = function(newState, position) {
        newState.setId(this.currentId);
        // TODO: use HashSet + LinkedList
        var chartColumn = this.chart[position];
        for (var x in chartColumn) {
            var chartState = chartColumn[x];
            if (newState.equals(chartState)) {
            
                var changed = false; // This is needed for handling of epsilon (empty) productions
                
                changed = chartState.appendRefsToChidStates(newState.getRefsToChidStates());
                return changed;
            }
        }
        chartColumn.push(newState);
        this.idToState[this.currentId] = newState;
        this.currentId++;
        
        var changed = true; // This is needed for handling of epsilon (empty) productions
        return changed;
    }
    Chart.prototype.getStatesInColumn = function(index) {
        return this.chart[index];
    }
    Chart.prototype.countStatesInColumn = function(index) {
        return this.chart[index].length;
    }
    Chart.prototype.getState = function(id) {
        return this.idToState[id];
    }
    Chart.prototype.getFinishedRoot = function( rootRule ) {
        var lastColumn = this.chart[this.chart.length - 1];
        for(var i in lastColumn) {
            var state = lastColumn[i];
            if(state.complete() && state.getLeftHandSide() == rootRule ) {
                // TODO: there might be more than one root rule in the end
                // so, there is needed to return an array with all these roots
                return state;
            }
        }
        return null;
    }
    Chart.prototype.log = function(column) {
        if(loggingOn) {
            console.log('-------------------')
            console.log('Column: ' + column)
            console.log('-------------------')
            for (var j in this.chart[column]) {
                console.log(this.chart[column][j].toString())
            }
        }
    }
    
    //------------------------------------------------------------------------------------
    
    function State(lhs, rhs, dot, left, right) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dot = dot;
        this.left = left;
        this.right = right;
        this.id = -1;
        this.ref = [];
        for (var i = 0; i < rhs.length; i++) {
            this.ref[i] = {};
        }
    }
    State.prototype.complete = function() {
        return this.dot >= this.rhs.length;
    }
    State.prototype.toString = function() {
        var builder = [];
        builder.push('(id: ' + this.id + ')');
        builder.push(this.lhs);
        builder.push('→');
        for (var i = 0; i < this.rhs.length; i++) {
            if (i == this.dot) {
                builder.push('•');
            }
            builder.push(this.rhs[i]);
        }
        if (this.complete()) {
            builder.push('•');
        }
        builder.push('[' + this.left + ', ' + this.right + ']');
        builder.push(JSON.stringify(this.ref))
        return builder.join(' ');
    }
    State.prototype.expectedNonTerminal = function(grammar) {
        var expected = this.rhs[this.dot];
        var rhss = grammar.getRightHandSides(expected);
        if (rhss !== null) {
            return true;
        }
        return false;
    }
    State.prototype.setId = function(id) {
        this.id = id;
    }
    State.prototype.getId = function() {
        return this.id;
    }
    State.prototype.equals = function(otherState) {
        if (this.lhs === otherState.lhs && this.dot === otherState.dot && this.left === otherState.left && this.right === otherState.right && JSON.stringify(this.rhs) === JSON.stringify(otherState.rhs)) {
            return true;
        }
        return false;
    }
    State.prototype.getRefsToChidStates = function() {
        return this.ref;
    }
    State.prototype.appendRefsToChidStates = function(refs) {
    
        var changed = false; // This is needed for handling of epsilon (empty) productions
        
        for (var i = 0; i < refs.length; i++) {
            if (refs[i]) {
                for (var j in refs[i]) {
                    if(this.ref[i][j] != refs[i][j]) {
                    	changed = true;
                    }
                    this.ref[i][j] = refs[i][j];
                }
            }
        }
        return changed;
    }
    State.prototype.predictor = function(grammar, chart) {
        var nonTerm = this.rhs[this.dot];
        var rhss = grammar.getRightHandSides(nonTerm);
        var changed = false; // This is needed for handling of epsilon (empty) productions
        for (var i in rhss) {
            var rhs = rhss[i];
            
            // This is needed for handling of epsilon (empty) productions
            // Just skipping over epsilon productions in right hand side
            // However, this approach might lead to the smaller amount of parsing tree variants
            var dotPos = 0;
            while(rhs && (dotPos < rhs.length) && (grammar.isEpsilonProduction(rhs[dotPos]))) {
            	dotPos++;
            }
            
            var newState = new State(nonTerm, rhs, dotPos, this.right, this.right);
            changed |= chart.addToChart(newState, this.right);
        }
        return changed;
    }
    State.prototype.scanner = function(grammar, chart, token) {
        var term = this.rhs[this.dot];
        
        var changed = false; // This is needed for handling of epsilon (empty) productions
        
        var tokenTerminals = token ? grammar.terminalSymbols(token) : [];
        if(!tokenTerminals) {
            // in case if grammar.terminalSymbols(token) returned 'undefined' or null
            tokenTerminals = [];
        }
        tokenTerminals.push(token);
        for (var i in tokenTerminals) {
            if (term == tokenTerminals[i]) {
                var newState = new State(term, [token], 1, this.right, this.right + 1);
                changed |= chart.addToChart(newState, this.right + 1);
                break;
            }
        }
        
        return changed;
    }
    State.prototype.completer = function(grammar, chart) {
    
        var changed = false; // This is needed for handling of epsilon (empty) productions
        
        var statesInColumn = chart.getStatesInColumn(this.left);
        for (var i in statesInColumn) {
            var existingState = statesInColumn[i];
            if (existingState.rhs[existingState.dot] == this.lhs) {
            
                // This is needed for handling of epsilon (empty) productions
                // Just skipping over epsilon productions in right hand side
                // However, this approach might lead to the smaller amount of parsing tree variants
                var dotPos = existingState.dot + 1;
                while(existingState.rhs && (dotPos < existingState.rhs.length) && (grammar.isEpsilonProduction(existingState.rhs[dotPos]))) {
                  dotPos++;
                }
                
                var newState = new State(existingState.lhs, existingState.rhs, dotPos, existingState.left, this.right);
                // copy existing refs to new state
                newState.appendRefsToChidStates(existingState.ref);
                // add ref to current state
                var rf = new Array(existingState.rhs.length);
                rf[existingState.dot] = {};
                rf[existingState.dot][this.id] = this;
                newState.appendRefsToChidStates(rf)
                changed |= chart.addToChart(newState, this.right);
            }
        }
        
        return changed;
    }
    
    //------------------------------------------------------------------------------------
    
    // Returning all possible correct parse trees
    // Possible exponential complexity and memory consumption!
    // Take care of your grammar!
    // TODO: instead of returning all possible parse trees - provide iterator + callback
    State.prototype.traverse = function() {
        if (this.ref.length == 1 && Object.keys(this.ref[0]).length == 0) {
            // This is last production in parse tree (leaf)
            var subtrees = [];
            if (this.lhs != this.rhs) {
                // prettify leafs of parse tree
                subtrees.push({
                    root: this.rhs,
                    left: this.left,
                    right: this.right
                });
            }
            return [{
                root: this.lhs,
                left: this.left,
                right: this.right,
                subtrees: subtrees
            }];
        }
        var rhsSubTrees = [];
        for (var i = 0; i < this.ref.length; i++) {
            rhsSubTrees[i] = [];
            for (var j in this.ref[i]) {
                rhsSubTrees[i] = rhsSubTrees[i].concat(this.ref[i][j].traverse());
            }
        }
        var possibleSubTrees = [];
        combinations(rhsSubTrees, 0, [], possibleSubTrees);
        var result = [];
        for (var i in possibleSubTrees) {
            result.push({
                root: this.lhs, 
                left: this.left,
                right: this.right,
                subtrees: possibleSubTrees[i]
            })
        }
        return result;
    }
    
    // Generating array of all possible combinations, e.g.:
    // input: [[1, 2, 3], [4, 5]]
    // output: [[1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]]
    //
    // Empty subarrays will be ignored. E.g.:
    // input: [[1, 2, 3], []]
    // output: [[1], [2], [3]]
    function combinations(arrOfArr, i, stack, result) {
        if (i == arrOfArr.length) {
            result.push(stack.slice());
            return;
        }
        if(arrOfArr[i].length == 0) {
            combinations(arrOfArr, i + 1, stack, result);
        } else {
            for (var j in arrOfArr[i]) {
                if(stack.length == 0 || stack[stack.length - 1].right == arrOfArr[i][j].left) {
                    stack.push(arrOfArr[i][j]);
                    combinations(arrOfArr, i + 1, stack, result);
                    stack.pop();
                }
            }
        }
    }
    
    //------------------------------------------------------------------------------------
            
    State.prototype.getLeftHandSide = function() {
        return this.lhs;
    }
            
    //------------------------------------------------------------------------------------
    
    function parse(tokens, grammar, rootRule) {
        var chart = new Chart(tokens);
        var rootRuleRhss = grammar.getRightHandSides(rootRule);
        for (var i in rootRuleRhss) {
            var rhs = rootRuleRhss[i];
            var initialState = new State(rootRule, rhs, 0, 0, 0);
            chart.addToChart(initialState, 0);
        }
        for (var i = 0; i < tokens.length + 1; i++) {
        
            var changed = true; // This is needed for handling of epsilon (empty) productions
            
            while(changed) {
                changed = false;
                j = 0;
                while (j < chart.countStatesInColumn(i)) {
                    var state = chart.getStatesInColumn(i)[j];
                    if (!state.complete()) {
                        if (state.expectedNonTerminal(grammar)) {
                            changed |= state.predictor(grammar, chart);
                        } else {
                            changed |= state.scanner(grammar, chart, tokens[i]);
                        }
                    } else {
                        changed |= state.completer(grammar, chart);
                    }
                    j++;
                }
            }
            chart.log(i)
        }
        return chart;
    }    
    
    var exports = {};
    exports.Grammar = Grammar;
    exports.State = State;
    exports.Chart = Chart;
    exports.parse = parse;
    exports.logging = logging;
    return exports;
})();