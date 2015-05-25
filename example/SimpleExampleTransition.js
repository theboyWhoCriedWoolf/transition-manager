import gsap from 'gsap';

/**
 * Simple Transition Module
 * using gsap to transition views
 */
export default {

	animConfig : null,

	/**
	 * initialise the module, preparing and positioning each section
	 * before the aimation begins
	 */
	initialize(views, data, promise, currentViewRef, nextViewRef) {
		this.animConfig = this.getAnimationVars( data.region );
		TweenLite.set( views.nextView, { x : this.animConfig.inX, y : this.animConfig.inY } );
		views.nextView.classList.remove('hidden');
	},

	/**
	 * animate the sections
	 * on Complete - resolve promise
	 */
	animate( views, data, promise, currentViewRef, nextViewRef ) {

		let config = this.animConfig,
			tl 	   = new TimelineLite({ onComplete : ()=> { promise.resolve() } });

		/* use gsap timeline */
		tl.insertMultiple([
			TweenLite.to( views.currentView, 1, { x : config.outX, y : config.outY, ease : Cubic.easeOut, delay : 0.01 } ),
			TweenLite.to( views.nextView, 0.6, { x : '0%', y : '0%', ease : Cubic.easeOut } )
		]);

	},

	/**
	 * get the setup and transition properties
	 * based on the region data sent with each action
	 * @param  {string} region 
	 * @return {object} transition data
	 */
	getAnimationVars( region ) {

		let animData = {};

		switch( region ) {

			case 'top' :
				animData.inX  = '0';
				animData.inY  = '-100%';
				animData.outX = '0';
				animData.outY = '100%';
				break;

			case  'right' :
				animData.inX  = '100%';
				animData.inY  = '0';
				animData.outX = '-100%';
				animData.outY = '0';
				break;

			case 'bottom' :
				animData.inX  = '0';
				animData.inY  = '100%';
				animData.outX = '0';
				animData.outY = '-100%';
				break;

			case 'left' :
				animData.inX  = '-100%';
				animData.inY  = '0';
				animData.outX = '100%';
				animData.outY = '0';
				break;

			default :
				animData.inX  = '0';
				animData.inY  = '-100%';
				animData.outX = '0';
				animData.outY = '100%';
				break;
		}

		return animData;
	}

}