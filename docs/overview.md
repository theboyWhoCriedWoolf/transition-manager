# Transition Manager Overview

- [Custom View Manager](#custom-view-manager)
- [Preparing Your Views](#preparing-your-views)
- [Reusable Transition Modules](#reusable-transition-modules)

--
The **transition-manager** is really flexible when it comes to using your own custom components. 
- Views can be any object
- Transition modules can include any transitional code be it JS or CSS
- Pass is a custom **View Manager** to create/destroy/prepare views how you see fit.

### Custom View Manager
--
The **transition-manager** ships with a default **viewManager** class, if you wish to use your own, pass it into the config upon instantiation of the component. ``` {viewManager : yourCustomManager} ```.

####The default viewManager

```js

const defaultViewManage = {};

/* views */
let views = {};

/**
 * initialize the default view manager
 * Used if a view manager has not been set
 * @param  {object} options
 */
defaultViewManager.init = function( options ) {
    views = options.views;
};

/**
 * fetch view * must include this method for the
 * transition manager to work
 * @param  {string} viewRef 
 * @return {object} requested view
 */
defaultViewManager.fetchView = function( viewRef )
{
    if( views[ viewRef ] ) {
        return views[ viewRef ];
    }
};

export default defaultViewManager;

```

### Preparing Your Views
--
You may want to make sure your view has loaded correctly and has all the assets it needs before being displayed for the transition.
To do this, your view object just needs to have a ``` prepareView ``` method.

The **transition-manager** will automatically check for the existance of this method and call it allowing you to make sure your view is ready.

Each transition will wait for all its views to be ready before the transiion begins, so you will never end up with missing or unprepared views.

####Example View.js
```js

import Promise from 'es6-promise';

export default {

    el : '.someDomEl',

    /* Method called by the Transition Manager */
    prepareView : function(deferred) {
        this._fetchData(reqURL).then(function() {
            deferred.resolve();
        },function(error) {
            /* Handle Error */ 
        });
    },

     /* Fetch data */
    _fetchData : function()
    {
        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = function() {
                if (req.status == 200) {
                    resolve(req.response);
                } else {
                    reject(Error(req.statusText));
                }
            };
            req.onerror = function() {
                reject(Error("Network Error"));
            };
            req.send();
        });
    }
}
```

### Reusable Transition Modules
--
Each Transition module gets passed in a ```views``` object. This object allows you to reference views by the ID's you defined in the config.

To help create reusable transition modules, the **transition-manager** also finds and assigns the correct instances to the ```currentView``` and ```nextView```.
This allows you to reuse transitions only specifying the ```currentView``` and ```nextView``` views.
####Example fooTransition.js
```js
import gsap from 'gsap';

export default {
    
    /* optional method to setup transitions */
    initialize : function(views, data, deferred, currentViewRef, nextViewRef) {
        TweenLite.set( views.nextView.el, { x : '100%' } );
    },

    /**
     * @param  {object} views - { currentView, nextView, *additionalViews }
     * @param  {object} data - any data sent with the Action
     * @param  {object} deferred Promise 
     * @param  {string} currentViewRef
     * @param  {string} nextViewRef
     */
    animate : function(views, data, deferred, currentViewRef, nextViewRef) {
        // current and next views automatically assigned
        TweenLite.to( views.nextView.el, 0.5, { x : 0 } );
        TweenLite.to( views.currentView.el, 0.5, { x : '-100%', 
            onComplete : function()
            {   
                /* on Complete */
                deferred.resolve();
            }
        });
    }
}
```
