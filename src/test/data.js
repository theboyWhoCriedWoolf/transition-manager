module.exports = {

	'STATE_INITIAL' : {
		// view 			: '',
		initial 		: true,

		actions : { 
			'ACTION_INIT_HOME' : {
				transitionType	: 'SlideInInitial',
				target 			: 'STATE_HOME',

				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView', ]
					}
				]
			},
			'ACTION_INIT_ABOUT' : {
				transitionType	: 'SlideInInitial',
				target 			: 'STATE_ABOUT'
			},
			'ACTION_INIT_CONTACT' : {
				transitionType	: 'SlideInInitial',
				target 			: 'STATE_CONTACT'
			}
		}
	},


	'STATE_HOME' : {
		view 			: 'homeView',
		// initial 		: true,

		actions : {
			'ACTION_ABOUT' : {
				target 			: 'STATE_ABOUT',
				transitionType	: 'SlideInOut',
				views 			: [ 'aboutView' ],
				
				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView', ]
					}
					
				]

			},

			'ACTION_CONTACT' : {
				target 			: 'STATE_CONTACT',
				transitionType	: 'SlideInOut',
				views 			: [ 'contactView' ],

				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView' ]
					}
				]
			}
		}
	},

	'STATE_ABOUT' : {
		view 	: 'aboutView',

		actions : {
			'ACTION_HOME' : {
				target 			: 'STATE_HOME',
				transitionType	: 'SlideInOut',
				views 			: [ 'homeView',  'logoView' ]
				
				// transitions : [
				// 	{
				// 		transitionType  : 'LogoSlide',
				// 		views 			: [ 'logoView' ]
				// 	}
				// ]
			},

			'ACTION_CONTACT' : {
				target 			: 'STATE_CONTACT',
				transitionType	: 'SlideInOut',
				// views 			: [ 'contactView' ]
				
				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView' ]
					}
				]
			},
		}
	},

	'STATE_CONTACT' : {
		view 	: 'contactView',

		actions : {
			
			'ACTION_HOME' : {
				target 			: 'STATE_HOME',
				transitionType	: 'SlideInOut',
				views 			: [ 'homeView' ],

				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView' ]
					}
				]
			},

			'ACTION_ABOUT' : {
				target 			: 'STATE_ABOUT',
				transitionType	: 'SlideInOut',
				views 			: [ 'aboutView' ],
				transitions : [
					{
						transitionType  : 'LogoSlide',
						views 			: [ 'logoView' ]
					}
				]
			}
		}

		
	}
}