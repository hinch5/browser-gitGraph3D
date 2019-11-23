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
// 32 space

const MIN_PERCENT_SPLIT = 0.25;
const SPHERE_STACK_COUNT = 6;
const SPHERE_SECTOR_COUNT = 6;
const VERTEX_SIZE = (SPHERE_SECTOR_COUNT + 1) * (SPHERE_STACK_COUNT + 1);
const INDEX_SIZE = 2 * SPHERE_SECTOR_COUNT * (SPHERE_STACK_COUNT - 1);
const SKIP_COORDS = 1;
const GRAPH_WIDTH = 1.4;
const GRAPH_HEIGHT = 1.4;
const GRAPH_DEPTH = 1.4;

class WorkSpace {
	angles;
	translate;
	scale;
	canvas;
	graph;
	aspectRatioBalance;
	now;
	begin;
	processing;
	skip;
	dayDuration;
	paused;
	ended;
	updates;

	constructor() {
		this.angles = [0, 0, 0];
		this.translate = [0, 0, 0];
		this.scale = 0.0;
		this.begin = Date.now();
		this.processing = false;
		this.paused = false;
		this.ended = false;
		window.addEventListener('keydown', this.transformation);
		window.addEventListener('resize', this.resize);

		this.canvas = new Canvas();
		this.resize();

		this.validateForm();
		this.validateGraphSubmit();
	}

	validateForm = () => {
		let res = this.checkParams(
			document.getElementById('path-input').value,
			document.getElementById('branch-input').value,
			document.getElementById('day-length-input').value,
			document.getElementById('max-commit-length-input').value,
			document.getElementById('skip-length-input').value
		);
		document.getElementById('repo-submit').disabled = !res;
		return res;
	};

	validateGraphSubmit = () => {
		const startDatePicker = document.getElementById('start-date-input'),
			expireDatePicker = document.getElementById('expire-date-input');
		if (!this.updates || !this.checkDate(startDatePicker.valueAsDate, expireDatePicker.valueAsDate)) {
			document.getElementById('graph-submit').disabled = true;
		} else {
			document.getElementById('graph-submit').disabled = false;
		}
	};

	checkDate = (startDate, expireDate) => {
		if (startDate && startDate < this.begin) {
			return false;
		}
		if (expireDate && expireDate < this.begin) {
			return false;
		}
		if (startDate && expireDate && startDate >= expireDate) {
			return false;
		}
		return true;
	};

	checkParams = (path, branch, dayDuration, maxCommitDuration, skipDuration) => {
		let res = true;
		if (path === '') {
			res = false;
		}
		if (branch === '') {
			res = false;
		}
		if (res && (dayDuration === '' || !dayDuration.match('^[0-9]+$'))) {
			res = false;
		}
		if (res && (maxCommitDuration === '' || !maxCommitDuration.match('^[0-9]+$'))) {
			res = false;
		}
		if (res && (skipDuration === '' || !skipDuration.match('^[0-9]+$'))) {
			res = false;
		}
		return res && !this.processing;
	};

	loadGraph = () => {
		const repoType = document.getElementById('repo-type-select').value,
			path = document.getElementById('path-input').value,
			branch = document.getElementById('branch-input').value,
			dayDuration = document.getElementById('day-length-input').value,
			maxCommitDuration = document.getElementById('max-commit-length-input').value,
			skip = document.getElementById('skip-length-input').value;
		if (!this.checkParams(path, branch, dayDuration, maxCommitDuration, skip)) {
			return;
		}
		this.dayDuration = Number(dayDuration);
		this.skip = Number(skip);
		this.processing = true;
		this.validateForm();
		const req = new XMLHttpRequest();
		req.open('POST', '/api/repository');
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.send('repoType=' + repoType + '&path=' + path + '&branch=' + branch + '&dayDuration=' + dayDuration + '&maxCommitDuration=' + maxCommitDuration);
		req.onreadystatechange = () => {
			if (req.readyState === XMLHttpRequest.DONE) {
				if (req.status === 200) {
					const resp = JSON.parse(req.response);
					this.begin = resp.startDate;
					const respUpdates = resp.updates;
					const updates = [];
					for (let i = 0; i < respUpdates.length; i++) {
						const fileUpdates = [];
						for (let j = 0; j < respUpdates[i].updates.length; j++) {
							fileUpdates.push(new UpdateFile(respUpdates[i].updates[j].file, false, respUpdates[i].updates[j].action))
						}
						updates.push(new UpdateData(
							respUpdates[i].name,
							respUpdates[i].dir,
							respUpdates[i].startDate + 1000,
							respUpdates[i].duration,
							fileUpdates
						));
					}
					this.updates = updates;
					document.getElementById('graph-submit').value = new Date(this.begin);
					document.getElementById('graph-info-text').innerText =
						'Дата начала: ' + new Date(this.begin).toDateString() + '\n' +
						'Количество коммитов: ' + this.updates.length + '\n' +
						'Продолжительность визуализации: ' +
						(this.updates[this.updates.length - 1].startDate + this.updates[this.updates.length - 1].duration) + 'мс';
					this.validateGraphSubmit();
				} else {
					// handle error
				}
				this.processing = false;
				if (req.status !== 200) {
					this.validateForm();
				}
			}
		};
	};
	startGraph = () => {
		const startDate = document.getElementById('start-date-input').valueAsDate,
			expireDate = document.getElementById('expire-date-input').valueAsDate;
		if (!this.checkDate(startDate, expireDate)) {
			return;
		}
		if (expireDate) {
			const delta = (expireDate.getTime() - this.begin) / (1000 * 60 * 60 * 24) * this.dayDuration;
			let dropCount = 0;
			for (let i = this.updates.length - 1; i > 0; i--) {
				if (this.updates[i].startDate - 1000 <= delta) {
					break;
				}
				dropCount++;
			}
			this.updates.splice(this.updates.length - 1 - dropCount, dropCount);
		}
		this.graph = new Graph(this.updates);
		this.canvas.graph = this.graph;
		if (startDate) {
			const delta = (startDate.getTime() - this.begin) / (1000 * 60 * 60 * 24) * this.dayDuration;
			this.graph.iterate(delta);
			this.begin = startDate.getTime();
		}
		this.canvas.initBuffers();
		this.canvas.clear();
		document.getElementById('main').removeChild(document.getElementById('manager'));
		this.drawScene();
	};

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
		} else if (ev.keyCode === 32) {
			this.paused = !this.paused;
		}
	};
	drawScene = () => {
		this.ended = this.canvas.isEnd();
		let delta = 0;
		if (!this.paused && !this.ended) {
			if (!this.now) {
				this.now = Date.now();
				delta = 0;
			} else {
				const t = Date.now();
				delta = t - this.now;
				this.now = t;
			}
			if (this.skip !== 0) {
				const skip = this.graph.checkSkip();
				if (skip > this.skip) {
					delta = skip;
				}
			}
		}
		this.begin += delta * (24 * 3600 * 1000 / this.dayDuration);
		let model = glMatrix.mat4.create(), view = glMatrix.mat4.create(), normalModel = glMatrix.mat4.create();
		glMatrix.mat4.fromScaling(model, glMatrix.vec3.fromValues(this.aspectRatioBalance, 1, 1));
		glMatrix.mat4.rotateX(model, model, glMatrix.glMatrix.toRadian(this.angles[0]));
		glMatrix.mat4.rotateY(model, model, glMatrix.glMatrix.toRadian(this.angles[1]));
		glMatrix.mat4.rotateZ(model, model, glMatrix.glMatrix.toRadian(this.angles[2]));
		glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(1 + this.scale, 1 + this.scale, 1 + this.scale));
		glMatrix.mat4.fromTranslation(view, glMatrix.vec3.fromValues(this.translate[0], this.translate[1], this.translate[2]));
		glMatrix.mat4.invert(normalModel, model);
		glMatrix.mat4.transpose(normalModel, normalModel);
		this.canvas.draw(model, view, normalModel, delta, this.begin);

		setTimeout(this.drawScene, 20);
	};
	resize = () => {
		this.canvas.resize();
		this.aspectRatioBalance = this.canvas.height / this.canvas.width;
	};
}