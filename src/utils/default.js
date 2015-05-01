'use strict';


/**
 * replace target object properties with the overwrite
 * object properties if they have been set
 * @param  {object} target    - object to overwrite
 * @param  {object} overwrite - object with new properies and values
 * @return {object} 
 */
function defaultProps( target, overwrite ) 
{
	overwrite = overwrite || {};
	for( var prop in overwrite ) {
		if( target.hasOwnProperty(prop) && _isValid( overwrite[ prop ] ) ) {
			target[ prop ] = overwrite[ prop ];
		}
	}
	return target;
}

/**
 * check to see if a property is valid
 * not null or undefined
 * @param  {object}  prop 
 * @return {Boolean} 
 */
function _isValid( prop ) {
	return ( prop !== undefined && prop !== null );
}



export default defaultProps;