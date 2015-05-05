# Transition Manager

**Transition-Manager** is a component that helps you easily transition visual elements within your application based on your application state.

It is completely framework independant, giving you the freedom to use it regardless the framework or tools you are using within your application.

At its core, the library uses a simple state machine to dictate its transitions. When a State change is fired, the TM checks for a valid transition, fetches and prepares the associated views, then injects the views into the correct transition module.

See more in the [overview guide](/docs/overview.md).

### Installation

```js
npm install transition-manager --save-dev
```

### Basic Setup
------------
##### config.js

```js
// basic config.js - can also be .json
export default {
    /* 
        the initial state can not have a transition, 
        so in order to transition the first view in, 
        you supply an initial state with no view passing in initialActions. 
        This will transition into the homeView. 
    */
    'STATE_INITIAL' : {
        /* must be included to indicate the initial transition */
        initial         : true,
        /* Actions specify the available transitions from this state */
        actions : { 
            'action_init_home' : { // can transition to home
                /* specify the transition type to use for the animation */
                transitionType  : 'fooTransition',
                /* specify the target - where you want to end up */
                target          : 'STATE_HOME'
            },
            'action_init_about' : { // can transition to about
                transitionType  : 'fooTransition',
                target          : 'STATE_ABOUT'
            },
            'action_init_contact' : { // can transition to contact
                transitionType  : 'fooTransition',
                target          : 'STATE_CONTACT'
            }
        }
    }, // end initial state

    'STATE_HOME' : {
        view  : 'homeView',
        actions : {
            'action_go_about' : {
                transitionType  : 'barTransition',
                target          : 'STATE_ABOUT',
                /* 
                    views can be used to include any extra views that you need
                    to access for this transition, by default, the 
                    transition-manager will include the current state view
                    and the target view.
                */
                views           : [ 'fooView', 'barView' ],

                /* ******* optional *********
                    you are able to add an array of additional transitions
                    containing the transition type and the associated views.
                    By default they will still have the current 
                    view and the next view available.
                */
                transitions : [ // to be instantiated with this transition
                    {
                        transitionType  : 'barSpinTransition',
                        views           : [ 'fooOneView', 'barOneView' ]
                    },
                    {
                        transitionType  : 'fooTwirlTransition',
                        views           : [ 'fooOneView' ]
                    }
                ]

            },
            'action_go_Contact' : {
                transitionType  : 'barTransition',
                target          : 'STATE_CONTACT',
                /* 
                if 'views:[]' is not specified, so the transition manager
                will inject  homeView and contactView into the config 
                */
            }
        }
    }, // end state home
    /* 
    STATE_ABOUT   : {}
    STATE_CONTACT : {}
    */
}
```

##### main.js

```js
import transitionManager from 'transition-manager';
import configData        from './config.js';
// views
import homeView          from './homeView';
import aboutView         from './aboutView';
import contactView       from './contactView';
// transitions
import transitionModule  from './fooTransition';

 /* instantiate passing in basic config */
transitionManager.init({
    data : configData,
    /* 
        specify view objects, *ID's must match those specified 
        in the configData.
        View objects can be any object that will get pased to your 
        transition module, allowing you to access a DOM reference 
        anyway you want.
    */
    views : {
        'homeView'    : homeView,
        'aboutView'   : aboutView,
        'contactView' : contactView
    }
    /* specify transiton modules, *ID's must match those 
    specified in the configData */
    transitions : {
        'fooTransition' : transitionModule
    };
})

/* start the transitionManager - transitions to initial state */
transitionManager.start();

/* transition in the homeView */
transitionManager.action('action_init_home');
```
##### fooTransition.js
```js
export default {
    
    /* optional method to setup transitions */
    initialize : function(views, data, deferred, currentViewRef, nextViewRef) {
        // setup code here
    },

    /**
     * @param  {object} views - { currentView, nextView, *additionalViews }
     * @param  {object} data - any data sent with the Action
     * @param  {object} deferred Promise 
     * @param  {string} currentViewRef
     * @param  {string} nextViewRef
     */
    animate : function(views, data, deferred, currentViewRef, nextViewRef) {
        // animation code here

         /* on Complete */
        deferred.resolve();
    }
}
```

Config Parameters
--------
- **data** (object) Configuration data 
- **views** (object) view objects *can be any object you want passed to your transition module
- **transitions** (object) transition modules
- **viewManager** (object) *optional*, allows yu to pass a custome view manager
- **qtransitions** (boolean) *default=true*, if previous transition has not completed, queue the next one up.
- **limitq** (boolean) *default=true*, only queue the last transition (make sure next transition is possible from that state)
- **history** (boolean) *default=false* Store all actions in a history array
- **useCache** (boolean) *default=false* Speed up transitions by storing ready prepared transitions in *cache*. Only use if your views remain static and are not manipulated between transitions
- **debug** (boolean) *default=false* Traces out info steps


Public Methods
--------
- **action** - Start action
- **currentState** - Returns the current state object
- **cancel** - Cancel the transition
- **addTransition** - Dynamically add a transition module
- **removeTransition** - Dynamically remove a transition module
- **getHistory** - Get the action history

Events
--------
- **onStateChanged** - triggered when a state is changed
- **onTransitionStarted** - triggered when a transition module has started
- **onAllTransitionStarted** - triggered when all transitions have started for that Action
- **onAllTransitionCompleted** - triggered when all transitions have completed
- **transitionComplete** - triggered when a single module transition has completed. Receives the transition object as a parameter

