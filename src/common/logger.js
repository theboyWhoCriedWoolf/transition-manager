
/**
 * Logger Class
 * @return {object} Logger
 */
export default (function() {
	
	return {

		/* toggle active state */
		enabled 	: true,

		initLogger( active ) {
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
	};

})();

