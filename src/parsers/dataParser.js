import forein from '../utils/forIn';
import unique from '../utils/unique';


const AppDataParser = {};

(function()
{	
	/**
	 * extract the actual transition data for the state
	 * @param  {object} configState - state data
	 * @return {array} transition array - FSM
	 */
	function _extractActions( opts )
	{
		// main properties
		const 	data 		= opts.data,
				configState = opts.stateData,
				stateView 	= opts.stateView,
				stateName  	= opts.stateName;

		// new defined properties
		let stateTransitions = [],
			viewData 		 = opts.viewData,
			appDataView,
			action,
			statePrefix;

		forein( configState.actions, ( prop, actionName ) => {

			statePrefix = (stateName+ '->' +actionName);
			appDataView = data[ prop.target ].view;

			// Return action data for FSM
			action = {
				action 		: actionName,
				target 		: prop.target,
				_id 		: statePrefix
			};

			// return ViewData for View manager and append all views
			viewData[ statePrefix ] = {
				currentView 		: stateView,
				nextView 			: appDataView,
				linkedVTransModules : _extractTransitions( prop, stateView, appDataView ),
				name  				: actionName
			};

			// // assign fsm action to state
			stateTransitions[ stateTransitions.length ] = action;
		});

		return { stateTransitions : stateTransitions, viewData : viewData };
	}

	/**
	 * extract transition information
	 * and extract data if transition information is
	 * an array of transitions
	 * @param  {onbject} prop     
	 * @param  {string} stateView - id of state view
	 * @param  {string} nextView  - id of view this transition goes to
	 * @return {array} array of transitions fot this action
	 */
	function _extractTransitions( prop, stateView, nextView )
	{
		var groupedTransitions = [];
		if( prop.transitions ) { // if more transitions exist, add them
		 	groupedTransitions = prop.transitions.map( ( transitionObject ) => { 
		 		return transitionObject; 
		 	});
		}
		prop.views = unique( prop.views, [ stateView, nextView ] );
		groupedTransitions.unshift( { transitionType : prop.transitionType, views : prop.views } );
		return groupedTransitions;
	}


	/**
	 * Extract only the FSM data from the config file
	 * create states
	 * @param  {object} data 
	 * @return {object} fsm formatted config
	 */
	AppDataParser.parseData = function( data )
	{
		if( !data ){ throw new Error('*Data Object is undefined!'); return false; }

		let config 		= [],
			viewData	= {},
			extracted,
			state;

		forein( data, ( stateData, stateName ) =>
		{
			extracted = _extractActions({
				data 			: data, 
				stateData 		: stateData, 
				viewData 		: viewData, 
				stateView 		: stateData.view,
				stateName 		: stateName
			});

			state = {
				name 				: stateName,
				initial 			: stateData.initial,
				stateTransitions 	: extracted.stateTransitions
			};

			config[ config.length ] = state;
		});

		return { fsmConfig : config, TVMConfig : extracted.viewData };
	};

})();

export default AppDataParser;

