import fsm 			from './core/fsm';
import tvm 			from './core/transitionViewManager';
import tc 			from './core/transitionController';
import parser 		from './parsers/dataParser';
import Logger 		from './common/logger';

import mixin 		from './utils/mixin';
import pick		  	from './utils/pick';
import dispatcher 	from './common/dispatcher';



/* fsm config pluck keys */
const fsmKeys = [
	'qHistory',
	'debug'
];
/* tvm config pluck keys */
const tvmKeys = [
	'viewManager',
	'views',
	'useCache',
	'debug'
];
/* tc config pluck keys */
const tcKeys = [
	'qtransitions',
	'transitions',
	'limitq',
	'debug'
];
/* this config pluck keys */
const indexKeys = [
	'data',
	'debug'
]


/**
 * ransition manager - Transition component facad wrapper
 * @type {Object}
 */
var TransitionManager = mixin({}, Logger);


(function()
{

	TransitionManager.init = function( config )
	{
		let parsedData = parser.parseData(config.data);
			
		/* FSM setup */
		fsm.init( mixin( pick( config, fsmKeys ), config.fsm ) );
		fsm.create( parsedData.fsmConfig );

		/* Transition View Manager setup */
		let tvmConfig =  mixin( { config : parsedData.TVMConfig }, pick( config, tvmKeys ), config.tvm );
		tvm.create( tvmConfig );

		/* Transition Controller setup */
		tc.init( mixin( pick( config, tcKeys ), config.tc ) );
		
	}	

	TransitionManager.start = function() {
		fsm.start();
	}


	/**
	 * 	Getters for the Transition Manager Components
	 *  - action - declare action to start 
	 *  - currentState - get current state
	 *  - cancel - cancel fsm transition
	 *  - addTransition - add a transition component
	 *  - removeTransition - remove transition
	 */

	Object.defineProperty( TransitionManager, 'action', { get : function() { return fsm.action; } });
	Object.defineProperty( TransitionManager, 'currentState', { get : function() { return fsm.getCurrentState; } });
	Object.defineProperty( TransitionManager, 'cancel', { get : function() { return fsm.cancel; } });
	Object.defineProperty( TransitionManager, 'addTransition', { get : function() { return tc.addModule; } });
	Object.defineProperty( TransitionManager, 'removeTransition', { get : function() { return tc.removeModule; } });
	
	 
	 /**
	  * Signals
	  * - fsm state changed 
	  * - tc transition started
	  * - tc allTransitionStarted
	  */
	 Object.defineProperty( TransitionManager, 'onStateChanged', { get : function() { return dispatcher.stateChanged; } });
	 Object.defineProperty( TransitionManager, 'onTransitionStarted', { get : function() { return dispatcher.transitionStarted; } });
	 Object.defineProperty( TransitionManager, 'onAllTransitionStarted', { get : function() { return dispatcher.transitionsStarted; } });
	 Object.defineProperty( TransitionManager, 'onAllTransitionCompleted', { get : function() { return dispatcher.allTransitionCompleted; } });
	 Object.defineProperty( TransitionManager, 'transitionComplete', { get : function() { return dispatcher.transitionComplete; } });

	


})()

export default TransitionManager;
