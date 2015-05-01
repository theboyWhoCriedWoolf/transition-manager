import Signal from 'signals';

/**
 * export application 
 * signals each one for different app states
 */
export const stateChanged 		 	= new Signal();
export const transitionStarted   	= new Signal();
export const transitionComplete     = new Signal();
export const allTransitionsStarted  = new Signal();
export const allTransitionCompleted = new Signal();

