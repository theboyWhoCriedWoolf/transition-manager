
/* include the section view template */
import SimpleViewTemplate 	from './SimpleViewTemplate.ejs';
import sectionData 			from './sectionData';
import randomCol 			from './randomCol';

/* instantiate viewManager */
const viewManager = {};


/* consts */
const 	totalSections = sectionData.length,
		container 	  = document.getElementById('content');

/* setup vars */
let currentSection  = -1,
	toggle  		= false,
	tmpCache 		= {};


/**
 * initialise the view manager
 * loading the first element into the dom
 */
viewManager.init = function() {
	let data = fetchSectionData();
	let view = fetchView( data, currentSection );
	tmpCache[ currentSection ] = view;
	view.classList.remove('hidden');
};

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


/**
 * remove the currentView from the DOM
 * once it has finished transitioning
 *  - remove from cache also
 */
viewManager.removeSection = function( sectionEl ) {
	
	container.removeChild( sectionEl );
	tmpCache[ sectionEl.dataset.id ] = null;
}

/**
 * create and apped a new View 
 * to the DOM prepoppulating with 
 * view data
 * @param  {object} data 
 * @param  {int} id - incremented ID
 * @return {Node} 
 */
function fetchView( data, id ) {

	data.backgroundColor = randomCol();
	data.fontColour		 = data.backgroundImage? '' : getContrastYIQ( data.backgroundColor );

	let wrapper 		= document.createElement('div');
	wrapper.className 	= 'section hidden';
	wrapper.innerHTML 	= SimpleViewTemplate( data );
	wrapper.dataset.id  = id;

	container.appendChild( wrapper );
	return wrapper;
}

/*
 * change text colour based on the background colour
 */
function getContrastYIQ(hexcolor){
	hexcolor = hexcolor.substr(1,6);
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

/**
 * return data from array
 * keep looping available data objects
 * @return {object} section data
 */
function fetchSectionData() {
	return sectionData[ ++currentSection ] || sectionData[ (currentSection = 0) ] ;
}


export default viewManager;

