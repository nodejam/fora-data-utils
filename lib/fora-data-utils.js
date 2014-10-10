(function () {
    "use strict";

    var _;


    var isPrimitiveType = function(type) {
        return ['string', 'number', 'integer', 'boolean', 'array'].indexOf(type) > -1;
    };



    var isCustomType = function(type) {
        return !this.isPrimitiveType(type);
    };



    /*
        Clones an object.
    */
    var __Clone = function() {};
    var clone = function(obj) {
        __Clone.prototype = obj;
        return new __Clone();
    };


    /*
        Visits a data structure recursively, running transformation fn(x) on each property.
        Returns a transformed data structure
    */
    var visit = function*(obj, fn) {
        fn = fn || function*(o) { return { value: o }; yield false; };
        return yield* _visit(obj, fn, []);
    };

    var _visit = function*(obj, fn, visited) {
        var alreadyVisited;

        for(var vIndex = 0; vIndex < visited.length; vIndex++) {
            if (visited[vIndex].src === obj) {
                alreadyVisited = visited[vIndex];
                break;
            }
        }

        if(!alreadyVisited) {
            if (obj instanceof Array) {
                var newArray = [];
                for(var i = 0; i < obj.length; i++) {
                    newArray.push(yield* _visit(obj[i], fn, visited));
                }
                visited.push({ src: obj, dest: newArray });
                return newArray;
            } else {
                var visitResult = (yield* fn(obj)) || { value: obj };

                if (typeof(obj) === "object") {
                    var newObject = visitResult.value || {};

                    if (!visitResult.stop) {
                        var visitProperty = function*(key) {
                            if (!visitResult.fnMustVisit || (yield* visitResult.fnMustVisit(key, obj))) {
                                var newKey = visitResult.fnKey ? (yield* visitResult.fnKey(key)) : key;
                                if (newKey)
                                    newObject[newKey] = yield* _visit(obj[key], visitResult.fn || fn, visited);
                            }
                        }

                        if (visitResult.visitProperties) {
                            for (var iVP = 0; iVP < visitResult.visitProperties.length; iVP++) {
                                _ = yield* visitProperty(visitResult.visitProperties[iVP]);
                            }
                        } else {
                            for (var key in obj) {
                                _ = yield* visitProperty(key);
                            }
                        }
                    }

                    if (visitResult.fnAfterVisit)
                        _ = yield* visitResult.fnAfterVisit(newObject);

                    visited.push({ src: obj, dest: newObject });
                    
                    return newObject;

                } else {
                    return visitResult.value;
                }
            }
        } else {
            return alreadyVisited.dest;
        }
    };



    var extend = function(target, source, fnCanCopy) {
        for (var key in source) {
            var val = source[key];
            if (!target.hasOwnProperty(key) && (!fnCanCopy || fnCanCopy(key))) {
                target[key] = val;
            }
        }
        return target;
    };


    var getHashCode = function(str) {
        var hash = 0;
        if (str.length !== 0) {
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
        }
        return Math.abs(hash);
    };


    module.exports = {
        isPrimitiveType: isPrimitiveType,
        isCustomType: isCustomType,
        clone: clone,
        visit: visit,
        extend: extend,
        getHashCode: getHashCode
    };

})();