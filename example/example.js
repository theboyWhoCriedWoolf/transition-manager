
import transitionManager from '../src/index.js';
import randomCol 		 from './randomCol';
import viewManager  	 from './ViewManager';
import config 			 from './simpleConfig';
import simpleTransition  from './SimpleExampleTransition';


/**
 * initialise the view manager
 * adding the initial view to the DOM
 */
viewManager.init();


/**
 * initialize the view manager
 * passing in a custom viewManager
 */
transitionManager.init( {
	qtransitions : false, // make sure we dont queue transitions
	data 		 : config,
	viewManager  : viewManager,
	transitions  : {
		/* reuse one transition module */
		'SimpleExampleTransition' : simpleTransition
	}
} );

/**
 * listen for the transition to complete
 * the remove the currentSection from the DOM
 */
transitionManager.onTransitionComplete.add( ( transitionObject )=> {
	viewManager.removeSection( transitionObject.views.currentView );
});

/* rstart the transition manager */
transitionManager.start();


/**
 * listen for click
 * and then action the transition
 */
window.addEventListener('click', (e)=>{
	/* pass in action data to change transition based on region */
	transitionManager.action( 'CHANGE_STATE', { region : clickRegion(e) } );
} );

/**
 * get click quadrant based on mouse position
 */
function clickRegion( e ) {
	
	let pos 	= {
		x : e.clientX,
		y : e.clientY
	},
	region 		= '',
	dividant 	= 4,
	right  		= window.innerWidth - (window.innerWidth / dividant),
	left   		= (window.innerWidth / dividant),
	top    		= (window.innerHeight / dividant),
	bottom 		= window.innerHeight - (window.innerHeight / dividant);

	if( pos.y <= top ) { region = 'top'; }
	else if(  pos.y >= bottom ) { region = 'bottom'; }

	if( pos.x <= left ) { region = 'left'; }
	else if(  pos.x >= right ) { region = 'right'; }

	return region;
}


