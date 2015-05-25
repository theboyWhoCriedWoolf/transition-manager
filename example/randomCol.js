
/**
 * expport a random colour
 * @return {string} colour hex
 */
export default () => {
	return "#"+((1<<24)*Math.random()|0).toString(16);
}