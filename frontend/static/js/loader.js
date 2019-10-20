class Loader {
	constructor() {
		// check if localhost
	}
	loadImage = (src) => {
		return new Promise((resolve, reject) => {
			let res = new Image();
			res.onload = () => {
				resolve(res);
			};
			res.onerror = () => {
				reject();
			};
			res.src = src;
		});
	};
}