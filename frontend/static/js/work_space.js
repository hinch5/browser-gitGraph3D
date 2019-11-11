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

const MIN_PERCENT_SPLIT = 0.25;
const SPHERE_STACK_COUNT = 8;
const SPHERE_SECTOR_COUNT = 8;
const VERTEX_SIZE = (SPHERE_SECTOR_COUNT + 1) * (SPHERE_STACK_COUNT + 1);
const SPHERE_RADIUS = 0.06;
const SKIP_COORDS = 1;
const GRAPH_WIDTH = 1.4;
const GRAPH_HEIGHT = 1.4;
const GRAPH_DEPTH = 1.4;
const SPEED = 3600 * 24;

class WorkSpace {
	angles;
	translate;
	scale;
	canvas;
	loader;
	graph;
	aspectRatioBalance;
	now;
	begin;

	constructor() {
		this.angles = [0, 0, 0];
		this.translate = [0, 0, 0];
		this.scale = 0.0;
		this.begin = Date.now();
		window.addEventListener('keydown', this.transformation);

		this.loader = new Loader();
		this.graph = new Graph([
			new UpdateData('test', [], 1000, 1000, [new UpdateFile(['json', 'statham.json'], false, 0)]),
			new UpdateData('test', ['json'], 2000, 1000, [new UpdateFile(['json', 'stat.json'], false, 0)]),
			new UpdateData('test', ['json'], 3000, 1000, [new UpdateFile(['json', 'stat.json'], false, 1), new UpdateFile(['json', 'statham.json'], false, 1)]),
			new UpdateData('test2', [], 4000, 1000, [new UpdateFile(['csv', 'a.csv'], false, 0),
				new UpdateFile(['csv', 'b.csv'], false, 0)
			]),
			new UpdateData('test2', ['csv'], 5000, 1000, [new UpdateFile(['csv', 'a.csv'], false, 2)]),
			new UpdateData('test', [], 6000, 1000, [new UpdateFile(['csv'], true, 2), new UpdateFile(['csv', 'b.csv'], false, 2)],),
			new UpdateData('test2', ['json'], 7000, 2000, [
				new UpdateFile(['json', 'test.json'], false, 0),
				new UpdateFile(['json', 'statham.json'], false, 1),
				new UpdateFile(['json', 'config'], true, 0),
				new UpdateFile(['json', 'stat.json'], false, 2),
				new UpdateFile(['json', 'a.json'], false, 0)
			]),
			new UpdateData('test2', [], 9000, 2000, [
				new UpdateFile(['js'], true, 0),
				new UpdateFile(['js', 'index.js'], false, 0),
				new UpdateFile(['js', 'vertex.js'], false, 0),
				new UpdateFile(['json', 'config', 'config.json'], false, 0),
				new UpdateFile(['js', 'canvas.js'], false, 0),
				new UpdateFile(['js', 'graph.js'], false, 0)
			]),
			new UpdateData('test2', ['json', 'config'], 11000, 2000, [new UpdateFile(['json', 'config', 'config.json'], false, 2)])
		]);

		this.canvas = new Canvas(this.graph);
		this.aspectRatioBalance = this.canvas.height / this.canvas.width;
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
		let delta;
		if (!this.now) {
			this.now = Date.now();
			delta = 0;
		} else {
			const t = Date.now();
			delta = t - this.now;
			this.now = t;
		}
		this.begin += SPEED * delta;
		let model = glMatrix.mat4.create(), view = glMatrix.mat4.create(), normalModel = glMatrix.mat4.create();
		glMatrix.mat4.fromScaling(model, glMatrix.vec3.fromValues(this.aspectRatioBalance, 1, 1));
		glMatrix.mat4.rotateX(model, model, glMatrix.glMatrix.toRadian(this.angles[0]));
		glMatrix.mat4.rotateY(model, model, glMatrix.glMatrix.toRadian(this.angles[1]));
		glMatrix.mat4.rotateZ(model, model, glMatrix.glMatrix.toRadian(this.angles[2]));
		glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(1 + this.scale, 1 + this.scale, 1 + this.scale));
		glMatrix.mat4.fromTranslation(view, glMatrix.vec3.fromValues(this.translate[0], this.translate[1], this.translate[2]));
		glMatrix.mat4.invert(normalModel, model);
		glMatrix.mat4.transpose(normalModel, normalModel);
		this.canvas.writeDate(this.begin);
		this.canvas.draw(model, view, normalModel, delta);

		setTimeout(this.drawScene, 10);
	};
}