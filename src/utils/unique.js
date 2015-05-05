'use strict';


/**
 * join two arrays and prevent duplication
 * @param  {array} target 
 * @param  {array} arrays 
 * @return {array} 
 */
function unique( target, arrays )
{
	target = target || [];
	var combined = target.concat( arrays );
		target 	 = [];

	var len = combined.length,
		i = -1,
		ObjRef;

		while(++i < len) {
			ObjRef = combined[ i ];
			if( target.indexOf( ObjRef ) === -1 && ObjRef !== '' & ObjRef !==  (null || undefined) ) {
				target[ target.length ] = ObjRef;
			}
		}
		return target;
}

export default unique;