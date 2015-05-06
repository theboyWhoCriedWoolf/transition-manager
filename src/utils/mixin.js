 /*jshint unused:false*/
import forOwn from './forOwn';


function mixin( target, objects ) {
	var i = 0,
    n = arguments.length,
    obj;
    while(++i < n){
        obj = arguments[i];
        if (obj != null) {
            forOwn(obj, copyProp, target);
        }
    }
    return target;
}

function copyProp(val, key){
    this[key] = val;
}

export default mixin;