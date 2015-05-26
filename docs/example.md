# Simple Example

The example provides you with a basic idea of how to setup and use the **Transition-Manager**. This is a very basic setup and is just to get you started.

##Running The Example
Download the repo and cd to the project location, then run ```npm run watch```. This will start up the server at ```localhost:3000```.

##Config
The configuration data is very small and consists of just two states. Both states use the same transition module and transition from one to the other.

```
module.exports = {

    'STATE_ONE' : {
        view            : 'one',
        initial         : true,

        actions : {
            'CHANGE_STATE' : {
                target          : 'STATE_TWO',
                 // transition module
                transitionType  : 'SimpleExampleTransition'
            },
        }
    },

    'STATE_TWO' : {
        view            : 'two',

        actions : {
            'CHANGE_STATE' : {
                target          : 'STATE_ONE',
                // transition module
                transitionType  : 'SimpleExampleTransition'
            },
        }
    }
}
```

##Setup
The Transition-Manager setup is also very basic, the main thing to note here is that a custom ***viewManager*** is being used.

```
/**
 * initialize the view manager
 * passing in a custom viewManager
 */
transitionManager.init( {
    qtransitions : false, // make sure we dont queue transitions
    data         : config,
    viewManager  : viewManager,
    transitions  : {
        /* reuse one transition module */
        'SimpleExampleTransition' : simpleTransition
    }
} );
```

##Custom View Manager
Because of the way each view gets instantiated and used within this example, a custom ***viewManager*** is used instead of the default one.

For each transition, the ***viewManager*** returns a newly created view and an already existing view, providing the transition module with a currentView and nextView reference.

```
/**
 * Provide the transitionManager with the requested view
 * required method
 * @param  {string} viewRef as described in the config
 * @return {Node} dom element
 */
viewManager.fetchView = function( viewRef ) {
    
    /**
     * ignore the viewRef as we dynamically create and append the views
     * use toggle to return the currentView and nextView as 
     * only two views are used at any given time
     */

    toggle = !toggle;

    if( toggle ) {
        /* return existing view */
        return tmpCache[ currentSection ];
    }
    /* return new view */
    let data = fetchSectionData();
    let view = fetchView( data, currentSection );
    tmpCache[ currentSection ] = view;
    return view;
};
```

