
import mixin 	from '../utils/mixin';
import Logger 	from '../common/logger';


const defaultViewManager = mixin( { name : 'DefaultViewManager' }, Logger );


/* views */
let views = {};

/**
 * initialize the default view manager
 * Used if a view manager has not been set
 * @param  {object} options
 */
defaultViewManager.init = function( options )
{
	views = options.views;
	defaultViewManager.initLogger( options.debug );

	defaultViewManager.log('initiated');
	return this;
};

/**
 * fetch view
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