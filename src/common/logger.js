
import { errorSignal } from './dispatcher';


export default (function() {
	
	
	return {

		id  		: 0,
		/* toggle active state */
		enabled 	: true,

		initLogger( active, id ) {
			this.id = id;
			this.enabled =  active;
		},

		setState( active ) {
			this.enabled = active;
		},

		log( msg ) {
			if( this.enabled ){
				console.log(  ':::: '+ this.name +' :::: [ ' + msg + ' ] ');
			}
		},

		error ( msg ) {
			if( this.enabled ){
				console.error(':::: '+ this.name +' :::: ***** ERROR ***** - [ ' + msg + ' ] ');
			}
		}
	}

})();

