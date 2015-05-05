
import logger  			from '../common/logger.js';
import defaultProps  	from '../utils/default';
import mixin		  	from '../utils/mixin';

/* dispatcher signals */
import {
	transitionComplete,
	allTransitionCompleted,
	transitionStarted,
	allTransitionsStarted
} from '../common/dispatcher';

/* promises */
import { 
	all,
	Deferred,
} from '../common/promiseFacade';


/* create class and extend logger */
const TransitionController = mixin({ name : 'TransitionController' } , logger);


(function()
{	
	let _tranistionComplete = null,

		_options = { // default options
			debug 	 			: false,
			transitions 		: null
		};

	/**
	 * transition the views, find the transition module if it 
	 * exists then pass in the linked views, data and settings
	 * 
	 * @param  {onject} transitionObj  - contains {transitionType, views, currentViewID, nextViewID}
	 * @param  {array} viewsToDispose  - array to store the views passed to each module to dispatch on transition completed
	 * @return {array} promises from Deferred 
	 */
	function _transitionViews( transitionObj )
	{
		if( !transitionObj ){ return TransitionController.error('transition is not defined'); }
		const transitionModule = _options.transitions[ transitionObj.transitionType ];
		
		if( transitionModule )  {

			const 	deferred 		= Deferred(),
					views 			= transitionObj.views,
					currentViewRef 	= transitionObj.currentViewID,
					nextViewRef 	= transitionObj.nextViewID;

			/* individual transition completed */
			deferred.promise.then( () => {
				transitionComplete.dispatch( transitionObj );
				TransitionController.log( transitionObj.transitionType +' -- completed');
			});

			if( transitionModule.initialize ){
				transitionModule.initialize( views, transitionObj.data, deferred, currentViewRef, nextViewRef );
			}

			transitionStarted.dispatch( transitionObj );
			TransitionController.log( transitionObj.transitionType +' -- started');
			transitionModule.animate( views, deferred, currentViewRef, nextViewRef );
			
			return deferred.promise;
		}
		else {
			TransitionController.error(transitionObj.transitionType + ' does NOT exist' );
		}
	}


	function _prepareAndStart( transitions )
	{
		const 	initialTransiion 	= transitions.shift(0),
				transitionsLength 	= transitions.length;
		
		let 	deferredTransitions = [],
				i 					= 0,
				transitionObj;

		// get the first transition to prevent looping unnecessarily
		deferredTransitions.push( _transitionViews( initialTransiion ) );

		while( i < transitionsLength )
		{
			transitionObj 	= transitions[ i ];
			deferredTransitions[ deferredTransitions.length ] = _transitionViews( transitionObj );

			++i;
		}

		// listen for completed modules
		all( deferredTransitions ).then( () => {
			TransitionController.log('transition queue empty ---- all transitions completed');

			_tranistionComplete();
			allTransitionCompleted.dispatch();

		}, TransitionController.error );

	}

	/**
	 * remove a module by name from the dictionary 
	 * of modules if they exist
	 * 
	 * @param  {string} moduleName [
	 * @return {object} TransitionController
	 */
	TransitionController.removeModule = function( moduleName )
	{
		if( !moduleName ) { return false; }

		if( moduleName instanceof Array ) {
			moduleName.forEach(function(module) {
				this.removeModule( module );
			}, this );
			return this;
		}
		
		if(  _options.transitions[ moduleName ] ) {
			delete _options.transitions[ moduleName ];
		}
		return this;
	};

	/**
	 * Add module by name 
	 * @param {string/array} moduleName [description]
	 * @param {object} module - transition module class
	 * @return {object} TransitionController
	 */
	TransitionController.addModule = function( moduleName, module )
	{
		if( !moduleName ) { return false; }
		if( moduleName instanceof Array ) {
			
			moduleName.forEach(function(moduleData) {
				let key = Object.keys(moduleData)[0];
				this.addModule( key , moduleData[key] );
			}, this );

			return this;
		}

		if( _options.transitions[ moduleName ] ) { return false; }
		_options.transitions[ moduleName ] = module;

		return this;
	};


	/**
	 * start processing the requested transition
	 * @param  {array/object} - transition objects or array of ytransition objects
	 */
	TransitionController.processTransition = function( transitions )
	{
		allTransitionsStarted.dispatch( transitions );

		// prepare and start the transitions
		TransitionController.log('-- start transitioning views --');
		_prepareAndStart( transitions );
	};


	/**
	 * init the transition controller
	 * @param  {object} options - options to override defaults
	 */
	TransitionController.init = function( options )
	{
		// get transitions from init options
		defaultProps( _options, options );

		TransitionController.initLogger( _options.debug );
		TransitionController.log('initiated');
	};

	/**
	 * link external methid to change the transition completedx state
	 */
	Object.defineProperty(TransitionController, 'transitionCompleted', { set( method ) { _tranistionComplete = method; }  });



})();



export default TransitionController;