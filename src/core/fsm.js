
import logger 			from '../common/logger.js';
import {stateChanged} 	from '../common/dispatcher';
import defaultProps  	from '../utils/default';
import mixin		  	from '../utils/mixin';

/* create class and extend logger */
const FSM = mixin({ name : 'StateMachine' }, logger );

(function()
{	
	let 	_states 				= {},
			_currentState 			= null,
			_initial 				= null,
			_actionQueue 			= [],
			_history 				= [],
			_cancelled 				= false,
			_transitionCompleted 	= true,
			_stateChangedHandler    = null,

			_options = {
				qHistory : true,
				debug 	 : true
			}


	/**
	 * check to se if th animation has cancelled in 
	 * between state transitions
	 * @return {Boolean} cancelled
	*/
	function isCancelled() {
		if(_cancelled) {
			_transitionCompleted = true;
			_cancelled 			 = false;
			return true;
		}
		return false;
	}


	/**
	 * transition to the next state
	 * @param  {object} nextState        new state object
	 * @param  {string} action           actionID 
	 * @param  {object} data             data sent with the action
	 * @param  {string} actionIdentifier state and action combined to make a unique string
	*/

	function _transitionTo( nextState, action, data )
	{
		_cancelled 				= false;
		_transitionCompleted 	= false;

		if( isCancelled() ) { return false; }

		if( _currentState ) {
			let previousState = _currentState;
			if(_options.qHistory){ _history.push(previousState.name); }
		}
		
		_currentState = nextState;

		if( action ) {
			_stateChangedHandler( action, data ); 
		}

		_transitionCompleted = true;
		FSM.log('State transition Completed! Current State :: ' + _currentState.name );
		stateChanged.dispatch(_currentState,  data);

		_processActionQueue();
	}

	/**
	 * If states have queued up
	 * loop through and action all states in the queue until
	 * none remain
	 */
	function _processActionQueue()
	{	
		if( _actionQueue.length > 0 ) {
			var stateEvent = _actionQueue.shift();
			
			if(!_currentState.getTarget(stateEvent.action)) {
				_processActionQueue();
			} 
			else {
			}	FSM.action( stateEvent.action, stateEvent.data );
		}
		return this;
	}

	/**
	 * start FSM 
	 * set the initial state
	 */
	FSM.start = function()
	{
		

		FSM.initLogger( _options.debug );
		FSM.log('initiated');

		if(!_initial) { return FSM.log('ERROR - FSM must have an initial state set'); };
		_transitionTo( _initial, null );
		return this;
	}

	/**
	 * DO ACTION
	 * do action and change the current state if
	 * the action is available and allowed
	 * @param  {string} action to carry out
	 * @param  {object} data to send with the state
	 */
	FSM.action = function( action, data )
	{
		if( !_currentState ){ return FSM.log( 'ERROR : You may need to start the fsm first' ); }
		
		/* if transitioning, queue up next action */
		if(!_transitionCompleted) { 
			_actionQueue.push( {
				action  : action,
				data 	: data
			});
		}

		const 	target 		= _currentState.getTarget( action ),
				newState 	= _states[ target ],
				_actionId 	= _currentState.id( action );

		/* if a new target can be found, change the current state */
		if( newState ) {
			FSM.log('Changing state :: ' + _currentState.name + ' >>> ' + newState.name );
			_transitionTo( newState, _actionId, data );
		}
		else {
			FSM.error( 'State name ::: ' + _currentState.name + ' OR Action: ' + action + ' is not available' );
		}
	}

	/**
	 * cancel the current transition
	 */
	FSM.cancel 	 = function() { _cancelled = true; return this; }

	/**
	 * add a new state to the FSM
	 * @param {object}  state - FSM STATE
	 * @param {Boolean} isInitial
	 */
	FSM.addState = function( state, isInitial ) {

		if( !_states || _states[ state.name ] ) {
			return null;
		}
		
		_states[ state.name ] = state;
		if( isInitial ) { _initial = state; };
		return state;
	}

	/**
	 * initialise - pass in setup options
	 * @param  {object} options 
	 */
	FSM.init = function( options )
	{
		defaultProps( _options, options );
		FSM.log('initiated');
	}

	/**
	 * create states and transitions based on config data passed in
	 * if states are an array, loop and assign data
	 * to new state objects
	 * @param  {array/object} config - [{ name, transitions, initial }]
	 */
	FSM.create = function( config )
	{
		if( config instanceof Array ) {
			config.forEach( ( item ) => { this.create( item ); }, this );
			return this;
		}
		let initial 			= (_states.length === 0 || config.initial),
			state  				= new FSM.State( config.name, initial ),
			stateTransitions    = config.stateTransitions || [];

		stateTransitions.forEach( (transition) => {
			state.addTransition( transition.action, transition.target, transition._id );
		});	

		FSM.addState( state, initial );
	}
	
	/**
	 * return the current state
	 * @return {object} FSM state
	 */
	FSM.getCurrentState = function() { return _currentState; }

	/**
	 * dispose the state machin 
	 */
	FSM.dispose = function() {
		_states = null;
	}
	
	/* sets a statesChanged method instead of using a signal */
	Object.defineProperty( FSM, 'stateChangedMethod', { set: function( method ) { _stateChangedHandler = method; } });


	/****************************** [ Create FSM State] ******************************/

	/**
	 * FSM state class
	 * @param {string} name state name
	 */
	FSM.State = function( name, initial )
	{
		this._transitions 	= {}; 	// available transitions
		this._name 			= name; // name              	      	
		this._data 			= {};   // data to assosciate with the action
		this._initial  		= initial;
	}

	FSM.State.prototype = {

		_fetchTransition : function( action, method ) {
			if( this._transitions[ action ] ) {
				return this._transitions[ action ][ method ];
			}
			return false;
		},

		/**
		 * add the available trasitions for each state
		 * @param {string} action e.g.'GOTOHOME'
		 * @param {string} target e.g. 'HOME'
		 */
		addTransition : function( action, target, actionIdnentifier ) {
			if( this._transitions[ action ] ) { return false; }
			this._transitions[ action ] = { target : target, _id : actionIdnentifier };
		},

		getActionId : function( action ) { return this._fetchTransition( action, '_id' ); },
		getTarget   : function( action ) { return this._fetchTransition( action, 'target' ); }
	}

	/**
	 * create getters for the state 
	 *  - name
	 *  - transitions
	 *  - data
	 */
	Object.defineProperty(FSM.State.prototype, 'name', 			{ get: function() { return this._name; }} );
	Object.defineProperty(FSM.State.prototype, 'transitions', 	{ get: function() { return this._transitions; }} );
	Object.defineProperty(FSM.State.prototype, 'data', 			{ get: function() { return this._data; }} );
	Object.defineProperty(FSM.State.prototype, 'initial', 		{ get: function() { return this._initial; } });
	Object.defineProperty(FSM.State.prototype, 'id', 			{ get: function() { return this.getActionId; } });

})()

export default FSM;


