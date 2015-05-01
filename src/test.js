import main from './index.js';
// import data  from './test/data';




// main.init({
// 	viewManager : 'lalalala view manager',
// 	views : 'The Views',
// 	data : data,

// 	tvm : {
// 		viewManager : 'OVERRIDE'
// 	}
// })


// let parsedData = parser.parseData( data );

// console.log('Data Parsed ::: ', parsedData );

// fsm.create( parsedData.fsmConfig );

// tvm.create( {
// 	config : parsedData.TVMConfig,
	
	// viewManager : {
	// 	views : {
	// 		homeView : getView( 'homeView' ),
	// 		aboutView : getView( 'aboutView' ),
	// 		contactView : getView( 'contactView' ),
	// 		logoView : getView( 'logoView' )
	// 	},
	// 	fetchView( ref )
	// 	{
	// 		// console.log('return view for  :: ', ref );
	// 		return this.views[ref];
	// 	}
	// }
// } );



// tc.init({
// 	transitions : {
// 		SlideInInitial : getTransition('SlideInInitial'),
// 		SlideInOut : getTransition('SlideInOut'),
// 		LogoSlide : getTransition('LogoSlide')
// 	}
// });



// fsm.stateChangedMethod 	= tvm.processViews;
// tvm.viewsReady 			= tc.processTransition;



// // fsm.start();
// // fsm.action('ACTION_INIT_HOME');
// // fsm.action('ACTION_ABOUT');
// // fsm.action('ACTION_HOME');
// // fsm.action('ACTION_ABOUT');


// function getView( name ) {
// 	return {
// 		id : name,

// 		viewReady( promise ) {
			
// 			promise.resolve('not ready yet');
// 			// console.log('cehcking ready :: ', promise );
// 		}
// 	}
// }

// function getTransition( name )
// {
// 	return {
// 		initialize( views, data, deferred ) {
// 			// console.log('init', name );

// 			// deferred.resolve()
// 			setTimeout( ()=> { deferred.resolve() } , Math.random() * 1000 );
// 		},
// 		animate()
// 		{
// 			// console.log('started animating ' );
// 		}
// 	}
// }