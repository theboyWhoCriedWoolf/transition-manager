import main from '../index.js';
import data  from './data';




main.init({
	
	data : data,

	views : {
		homeView : getView( 'homeView' ),
		aboutView : getView( 'aboutView' ),
		contactView : getView( 'contactView' ),
		logoView : getView( 'logoView' )
	},

	transitions : {
		SlideInInitial : getTransition('SlideInInitial', 2000 ),
		SlideInOut : getTransition('SlideInOut', 2000),
		LogoSlide : getTransition('LogoSlide', 2000)
	},
	tc : {
		debug : true
	},
	fsm : {
		debug : true
	}
	
})

main.start();

main.action('ACTION_INIT_ABOUT');
main.action('ACTION_HOME');
main.action('ACTION_ABOUT');
main.action('ACTION_HOME');
main.action('ACTION_CONTACT');
main.action('ACTION_HOME');


function getView( name, delay ) {
	return {
		id : name,

		viewReady( promise ) {
			
			// promise.resolve('not ready yet');

			setTimeout( ()=> { promise.resolve() } , delay || 0 );
			// console.log('cehcking ready :: ', promise );
		}
	}
}

function getTransition( name, delay )
{
	return {
		initialize( views, data, deferred ) {
			// console.log('init', name );

			// deferred.resolve()
			setTimeout( ()=> { deferred.resolve() } , delay || 0 );
		},
		animate()
		{
			// console.log('started animating ' );
		}
	}
}



