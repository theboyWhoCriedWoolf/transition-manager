import main from '../src/index.js';
import data  from './data';
// import React from 'react';



console.log('init ', window.innerWidth );

// init();
// 

// function init()
// {

// 	var CommentBox = React.createClass({

// 	  componentDidMount : function()
// 	  {
// 	  	console.log('mounting')
// 	  	this.props.hello = 'world';
// 	  },

// 	  viewReady : function()
// 	  {

// 	  },

// 	  render: function() {
// 	    return (
// 	      <div ref="myInput">
// 	        Hello, world! I am a boom.
// 	      </div>
// 	    );
// 	  }
// 	});


// 	var rendered = <CommentBox />;

// 	React.render(
// 	  rendered,
// 	  document.getElementById('content')
// 	);

// 	console.log('created view ', rendered );
	

// }

// // React.render(
// //   <viewOne />,
// //   document.getElementById('content')
// // );


main.init({
	
	data : data,
	debug : true,

	views : {
		homeView : getView( 'homeView' ),
		aboutView : getView( 'aboutView' ),
		contactView : getView( 'contactView' ),
		logoView : getView( 'logoView' )
	},

	transitions : {
		SlideInInitial : getTransition('SlideInInitial', 2000 ),
		SlideInOut : getTransition('SlideInOut', 2000),
		LogoSlide : getTransition('LogoSlide', 2000)
	},
	// tc : {
	// 	debug : true
	// },
	// fsm : {
	// 	debug : true
	// }
	
})

main.start();

main.action('ACTION_INIT_ABOUT');
main.action('ACTION_HOME');
// // main.action('ACTION_ABOUT');
// // main.action('ACTION_HOME');
// // main.action('ACTION_CONTACT');
// // main.action('ACTION_HOME');


function getView( name, delay ) {
	return {
		id : name,

		viewReady( promise ) {
			
			// promise.resolve('not ready yet');

			setTimeout( ()=> { promise.resolve() } , delay || 0 );
			// console.log('cehcking ready :: ', promise );
		}
	}
}

function getTransition( name, delay )
{
	return {
		initialize( views, data, deferred ) {
			console.log('Transition ', views );



			// deferred.resolve()
			setTimeout( ()=> { deferred.resolve() } , delay || 0 );
		},
		animate()
		{
			// console.log('started animating ' );
		}
	}
}



