module.exports = {

	'STATE_ONE' : {
		view 			: 'one',
		initial 		: true,

		actions : {
			'CHANGE_STATE' : {
				target 			: 'STATE_TWO',
				transitionType	: 'SimpleExampleTransition',
			},
		}
	},

	'STATE_TWO' : {
		view 			: 'two',

		actions : {
			'CHANGE_STATE' : {
				target 			: 'STATE_ONE',
				transitionType	: 'SimpleExampleTransition',
			},
		}
	}
}