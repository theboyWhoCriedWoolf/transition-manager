import fsm 			from './core/fsm';
import tvm 			from './core/transitionViewManager';
import tc 			from './core/transitionController';
import defaultVm 	from './core/defaultViewManager';
import parser 		from './parsers/dataParser';
import Logger 		from './common/logger';

import mixin 		from './utils/mixin';
import pick		  	from './utils/pick';

/* import signals */
import {
	stateChanged,
	transitionStarted,
	transitionComplete,
	allTransitionsStarted,
	allTransitionCompleted
} 	from './common/dispatcher';


/* fsm config pluck keys */
const fsmKeys = [
	'history',
	'limitq',
	'qtransitions',
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
	'transitions',
	'debug'
];
/* this config pluck keys */
const indexKeys = [
	'debug',
	'views',
	'viewManager'
]


/**
 * ransition manager - Transition component facad wrapper
 * @type {Object}
 */
var TransitionManager = {};

(function()
{	
	/* private Logger */
	const Log = mixin({ name : 'TransitionManager' }, Logger );

	TransitionManager.init = function( config )
	{
		let parsedData = parser.parseData(config.data);

		/* FSM setup */
		fsm.init( mixin( pick( config, fsmKeys ), config.fsm ) );
		fsm.create( parsedData.fsmConfig );

		/* Transition View Manager setup */
		config.viewManager 	= config.viewManager || defaultVm.init( pick( config, indexKeys ) );
		let tvmConfig 		=  mixin( { config : parsedData.TVMConfig }, pick( config, tvmKeys ), config.tvm );
		tvm.create( tvmConfig );

		/* Transition Controller setup */
		tc.init( mixin( pick( config, tcKeys ), config.tc ) );

		/*** Connect each module ***/
		fsm.stateChangedMethod  = tvm.processViews;
		tvm.viewsReady 			= tc.processTransition;
		tc.transitionCompleted  = fsm.transitionComplete;

		Log.initLogger( config.debug );
		Log.log( 'initiated' );

	}	

	/**
	 * start the transition-manager
	 * transitions to the initial state
	 */
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
	 *  - history - action history
	 */

	Object.defineProperty( TransitionManager, 'action', { get : function() { return fsm.action; } });
	Object.defineProperty( TransitionManager, 'currentState', { get : function() { return fsm.getCurrentState; } });
	Object.defineProperty( TransitionManager, 'cancel', { get : function() { return fsm.cancel; } });
	Object.defineProperty( TransitionManager, 'addTransition', { get : function() { return tc.addModule; } });
	Object.defineProperty( TransitionManager, 'removeTransition', { get : function() { return tc.removeModule; } });
	Object.defineProperty( TransitionManager, 'getHistory', { get : function() { return fsm.getHistory; } });
	
	 
	 /**
	  * Signals
	  * - fsm state changed 
	  * - tc transition started
	  * - tc allTransitionStarted
	  */
	 Object.defineProperty( TransitionManager, 'onStateChanged', { get : function() { return stateChanged; } });
	 Object.defineProperty( TransitionManager, 'onTransitionStarted', { get : function() { return transitionStarted; } });
	 Object.defineProperty( TransitionManager, 'onAllTransitionStarted', { get : function() { return transitionsStarted; } });
	 Object.defineProperty( TransitionManager, 'onAllTransitionCompleted', { get : function() { return allTransitionCompleted; } });
	 Object.defineProperty( TransitionManager, 'onTransitionComplete', { get : function() { return transitionComplete; } });

})();

export default TransitionManager;
