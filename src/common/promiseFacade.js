
import {Promise} from 'es6-promise';

/**
 * Promise facad object
 * creates a facad for application promises, 
 * detatches feom the library being used to serve promises to the app
 * @type {Object}
 */
let PromiseFacade = {};


/**
 * Deffer the promise 
 * @return {object} { resolve : function, reject : function }
 */
export function Deferred()
{
	let result = {};
	result.promise = new Promise(( resolve, reject ) =>
	{
		result.resolve = resolve;
		result.reject  = reject;
	});
	return result;
}

/**
 * create a facad for es6-promise all
 * ovrridden facad to display error logs for development 
 * due to es6-promise error suppression issue
 * @param  {array}   promises 
 * @return {function} 
 */
export function all() {

	let externalError,
		error = (e) => { 
			console.error( ' --- PROMISE CAUGHT ERROR --- ', arguments[0].stack, e ); 
			if(externalError){ externalError('es6-promise all error ', arguments[0].stack, e); };
		};
		
	return () => {
		let all = Promise.all( arguments[0] );
		return {
			then () {
				externalError =  arguments[1];
				all.then(arguments[0]).catch( error );
			}
		};
	}(arguments);
}


/**
 * return object getters
 * 
 * - all - checks to see if all promises has completed before continuing
 * - Promise - returns a Promise
 * - Deferred - returns an un resolved promise and an object with the resolve and reject functions
 * @return {function}   [description]
 */
Object.defineProperty( PromiseFacade, 'all', { get : function() { return all; } });
Object.defineProperty( PromiseFacade, 'Promise', { get : function() { return Promise; } });
Object.defineProperty( PromiseFacade, 'Deferred', { get : function() { return Deferred; } });

/* export defaults */
export default PromiseFacade;
