export default {
	id : 'testView',

	viewReady( promise ) {
		
		promise.resolve('not ready yet');
		console.log('cehcking ready :: ', promise );
	}
}