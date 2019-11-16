/*let GL, canvas, workspace;

const start = () => {
	canvas = document.getElementById('graph');
	window.addEventListener('resize', resize, false);
	resize();
	document.addEventListener('keypress', function (e) {
		if (e.keyCode === 102) {
			toggleFullScreen();
		}
	});

	workspace = new WorkSpace(canvas);
};

const toggleFullScreen = () => {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}
};
*/

let space;

const start = () => {
	space = new WorkSpace();
};
