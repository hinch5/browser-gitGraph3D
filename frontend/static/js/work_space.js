// 219 [
// 221 ]
// 37 left arrow
// 38 up arrow
// 39 right arrow
// 40 down arrow
// 173 -
// 61 =
// 81 q
// 87 w
// 69 e
// 65 a
// 83 s
// 68 d

class WorkSpace {
	angles;
	translate;
	scale;
	keys;
	canvas;
	loader;
	images;

	constructor() {
		this.angles = [0, 0, 0];
		this.translate = [0, 0, 0];
		this.scale = 1.0;
		window.addEventListener('keydown', this.transformation);
		
		this.loader = new Loader();

		this.canvas = new Canvas();
		this.drawScene();
	}
	
	transformation = (ev) => {
		if (ev.keyCode === 219) {
			this.angles[2] += this.angles[2] === 358 ? -358 : 2;
		} else if (ev.keyCode === 221) {
			this.angles[2] -= this.angles[2] === 0 ? -358 : 2;
		} else if (ev.keyCode === 37) {
			this.angles[1] -= this.angles[1] === 0 ? -358 : 2;
		} else if (ev.keyCode === 38) {
			this.angles[0] -= this.angles[0] === 0 ? -358 : 2;
		} else if (ev.keyCode === 39) {
			this.angles[1] += this.angles[1] === 358 ? -358 : 2;
		} else if (ev.keyCode === 40) {
			this.angles[0] += this.angles[0] === 358 ? -358 : 2;
		} else if (ev.keyCode === 61) {
			this.scale += 0.01;
		} else if (ev.keyCode === 173) {
			this.scale -= 0.01;
		} else if (ev.keyCode === 81) {
			this.translate[2] += 0.01;
		} else if (ev.keyCode === 87) {
			this.translate[1] += 0.01;
		} else if (ev.keyCode === 69) {
			this.translate[2] -= 0.01;
		} else if (ev.keyCode === 65) {
			this.translate[0] -= 0.01;
		} else if (ev.keyCode === 83) {
			this.translate[1] -= 0.01;
		} else if (ev.keyCode === 68) {
			this.translate[0] += 0.01;
		}
	};
	drawScene = () => {
		let model = glMatrix.mat4.create(), view = glMatrix.mat4.create();
		glMatrix.mat4.fromXRotation(model, glMatrix.glMatrix.toRadian(this.angles[0]));
		glMatrix.mat4.rotateY(model, model, glMatrix.glMatrix.toRadian(this.angles[1]));
		glMatrix.mat4.rotateZ(model, model, glMatrix.glMatrix.toRadian(this.angles[2]));
		glMatrix.mat4.fromScaling(view, glMatrix.vec3.fromValues(this.scale, this.scale, this.scale));
		glMatrix.mat4.translate(view, view, glMatrix.vec3.fromValues(this.translate[0], this.translate[1], this.translate[2]));
		this.canvas.draw(model, view);
		
		setTimeout(this.drawScene, 10);
	};
}