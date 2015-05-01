
import logger  			from '../common/logger.js';
import defaultProps  	from '../utils/default';
import mixin		  	from '../utils/mixin';

import { 
	all,
	Deferred 
} from '../common/promiseFacade';

/* create class and extend logger */
const TVM = mixin({ name : 'TransitionViewManager' }, logger );

(function(){

	let _viewsReadyMethod = null,
		viewCache 		  = {},

	// options with defaults
	_options 				= {
		config  			: null,
		viewManager 		: null,
		debug 				: false,
		useCache 			: true
	};

	/**
	 * loop through all transition modules and prepare the
	 * views requested by the config
	 * 
	 * @param  {object} actionData containing all transition types and views required
	 * @param  {object} paramData sent with the action
	 * @return {object} promises array and pepared views array
	 */
	function _prepareViews( actionData, paramData )
	{
		let linkedViewsModules 	= actionData.linkedViewsModules, // look into slice speed over creating new array
		 	ViewsModuleLength 	= linkedViewsModules.length,
		 	promises 			= [],
		 	preparedViews 		= [],
		 	actionDataClone 	= null,
		 	viewCache 			= {},
		 	i 					= 0,
		 	viewsModuleObject;

	 		while( i < ViewsModuleLength ) {

 				viewsModuleObject 					  = linkedViewsModules[i];
	 			actionDataClone 					  = _cloneViewState( actionData, viewsModuleObject, paramData ); 
	 			preparedViews[ preparedViews.length ] = _fetchViews( viewsModuleObject.views, actionDataClone, promises, viewCache);
	 			
	 			++i;
	 		}

	 		viewCache = null;
		 	return { promises : promises, preparedViews : preparedViews };
	}

	/**
	 * loop through and fetch all the requested views, use viewReady
	 * and collect a promise for each to allow the view to build up and perform 
	 * its preperation tasks if required
	 * 
	 * @param  {array} views - string references
	 * @param  {object} actionDataClone - cloned data as to not override config
	 * @param  {array} promises - collect all view promises
	 * @param  {object} viewCache - prevents views from being instantiated and requested more than once
	 * @return {object} populated actionDataClone data object
	 */
	function _fetchViews( viewsToPrepare, actionDataClone, promises, viewCache )
	{
		const views 		= viewsToPrepare,
			  viewManager 	= _options.viewManager,
			  length 		= views.length,
			  currentViewID = actionDataClone.currentViewID,
			  nextViewID 	= actionDataClone.nextViewID;

		let i = 0,
			_deferred,
			view,
			foundView,
			viewRef;

		while( i < length )
		{
			viewRef = views[ i ];
			if(viewRef)
			{
				foundView = viewCache[ viewRef ];

				if(!foundView) { // cache the view instance for reuse if needed
					foundView = viewCache[ viewRef ] = viewManager.fetchView( viewRef );
					_deferred = Deferred();
					promises[ promises.length ] = _deferred.promise;

					if( !foundView ){ return TVM.error( viewRef+' is undefined' ); }
					foundView.viewReady( _deferred );
				}

				view = foundView;
				actionDataClone.views[ _viewRef(viewRef, [ currentViewID, nextViewID ]) ] = view;
			}

			++i;
		}
		
		return actionDataClone;
	}

	/**
	 * convert view named references to either current view
	 * or next view if the ID's match
	 * Makes it easier to access and build generic use cases
	 * 
	 * @param  {string} ref current View ID
	 * @param  {array} comparisonViews - currentView and nextView string IDS
	 * @return {string} - new IDS if matched
	 */
	function _viewRef( ref, comparisonViews ) {
	 	var index = comparisonViews.indexOf( ref );
	 		return (index === -1 )? ref : ['currentView', 'nextView'][ index ];
	}


	/**
	 * return cached views based on action type
	 * @param  {array} cached - previously prepared views
	 * @param  {object} data - action data passed through with action
	 * @return {array} - cached views
	 */
	function _getCached( cached, data )
	{
		if( !data ){ return cached; }

		let i = -1, len = cached.length;
        while (++i < len) {
            cached[i].data = data;
        }
        return cached;
	}

	/**
	 * clone the action data object
	 * fast clone and prevents the config references to be
	 * oweriden by instances or other settings
	 * @param  {object} actionData passed in from the config
	 * @param  {object} transitionObject - action data transition
	 * @param  {object} paramData sent with the action
	 * @return {object} new object with an instance or reference from the params
	 */
	function _cloneViewState( actionData, transitionObject, paramData ) {
	 	return {
			data 			: paramData,
			currentViewID 	: actionData.currentView, // optional
		 	nextViewID 		: actionData.nextView, 	  // optional
		 	views 			: {},
		 	transitionType  : transitionObject.transitionType
	 	};
	}

	/**
	 * processViews - start preparing the views
	 * Find views by their action ID in the config
	 * 
	 * @param  {object|string} actionID 
	 * @param  {object} data  passed by the action
	 */
	TVM.processViews = function( actionID, data )
	{
		if( !_options.config )  { return TVM.error('A Data Config object must be set via: ViewManager.create' ); }
		if( !actionID )			{ return TVM.error('processViews *actionID is undefined' );  }


		if(_options.useCache && viewCache[ actionID ] ) {
			_viewsReadyMethod( _getCached( viewCache[ actionID ], data ) );
			return false;
		}

		const actionData  = _options.config[ actionID ];
		if( actionData ) {

			let processedAction 	  = _prepareViews( actionData, data ),
				parsedActionData 	  = processedAction.preparedViews,
				pendingPromises 	  = processedAction.promises;

				viewCache[ actionID ] = parsedActionData.slice(0);

			// parse the views and wait for them to finish preparing themselves
			all( pendingPromises ).then( () => { 
				TVM.log('Views loaded and ready for ----- '+actionID);

				//* views are ready, dispatch them *//
				_viewsReadyMethod( parsedActionData );

			}, TVM.error );

		} else {
			TVM.error('processViews *actionData is undefined');
		}
	};

	/**
	 * Create the TransitionViewManager
	 * parse the passed in settings
	 * @param  {object} options
	 */
	TVM.create = function( options )
	{	
		defaultProps( _options, options );
		TVM.initLogger( _options.debug );
		TVM.log('initiated');
	};


	/**
	 * dispose of the TransitionViewManager and 
	 * all its components
	 */
	TVM.dispose = function() {
		_options  = null;
		viewCache = null;
	};

	/**
	 * link external methid to local
	 */
	Object.defineProperty(TVM, 'viewsReady', { set( method ) { _viewsReadyMethod = method; }  });


})();



export default TVM;

