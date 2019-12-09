const ARROW_LEFT_KEY = 'ArrowLeft';
const ARROW_UP_KEY = 'ArrowUp';
const ARROW_RIGHT_KEY = 'ArrowRight';
const ARROW_DOWN_KEY = 'ArrowDown';
const BRACKET_LEFT_KEY = 'BracketLeft';
const BRACKET_RIGHT_KEY = 'BracketRight';
const EQUAL_KEY = 'Equal';
const MINUS_KEY = 'Minus';
const Q_KEY = 'KeyQ';
const W_KEY = 'KeyW';
const E_KEY = 'KeyE';
const A_KEY = 'KeyA';
const S_KEY = 'KeyS';
const D_KEY = 'KeyD';
const SPACE_KEY = 'Space';

const DEGREE_PER_SECOND = 100;
const SCALE_PER_SECOND = 0.5;
const TRANSLATE_PER_SECOND = 0.5;
const DEGREE_PER_MILLISECOND = DEGREE_PER_SECOND/1000;
const SCALE_PER_MILLISECOND = SCALE_PER_SECOND/1000;
const TRANSLATE_PER_MILLISECOND = TRANSLATE_PER_SECOND/1000;

const MIN_PERCENT_SPLIT = 0.25;
const SPHERE_STACK_COUNT = 10;
const SPHERE_SECTOR_COUNT = 10;
const VERTEX_SIZE = SPHERE_SECTOR_COUNT * (SPHERE_STACK_COUNT - 1) + 2;
const INDEX_SIZE = 2*SPHERE_SECTOR_COUNT*(SPHERE_STACK_COUNT-2) + 2*SPHERE_SECTOR_COUNT;
const SKIP_COORDS = 1;
const GRAPH_WIDTH = 1.4;
const GRAPH_HEIGHT = 1.4;
const GRAPH_DEPTH = 1.4;

class WorkSpace {
	angles;
	anglesSpeed;
	translate;
	translateSpeed;
	scale;
	scaleSpeed;
	canvas;
	graph;
	aspectRatioBalance;
	now;
	fpsNow;
	begin;
	processing;
	skip;
	dayDuration;
	paused;
	ended;
	updates;

	constructor() {
		this.angles = [0, 0, 0];
		this.anglesSpeed = [false, false, false, false, false, false];
		this.translate = [0, 0, 0];
		this.translateSpeed = [false, false, false, false, false, false];
		this.scale = 0.0;
		this.scaleSpeed = [false, false];
		this.begin = Date.now();
		this.processing = false;
		this.paused = false;
		this.ended = false;
		window.addEventListener('keydown', this.startTransform(true));
		window.addEventListener('keyup', this.startTransform(false));
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

	startTransform = (action) => {
		return (ev) => {
			if (ev.code === BRACKET_LEFT_KEY) {
				this.anglesSpeed[4] = action;
			} else if (ev.code === BRACKET_RIGHT_KEY) {
				this.anglesSpeed[5] = action;
			} else if (ev.code === ARROW_LEFT_KEY) {
				this.anglesSpeed[3] = action;
			} else if (ev.code === ARROW_UP_KEY) {
				this.anglesSpeed[1] = action;
			} else if (ev.code === ARROW_RIGHT_KEY) {
				this.anglesSpeed[2] = action;
			} else if (ev.code === ARROW_DOWN_KEY) {
				this.anglesSpeed[0] = action;
			} else if (ev.code === EQUAL_KEY) {
				this.scaleSpeed[0] = action;
			} else if (ev.code === MINUS_KEY) {
				this.scaleSpeed[1] = action;
			} else if (ev.code === Q_KEY) {
				this.translateSpeed[4] = action;
			} else if (ev.code === W_KEY) {
				this.translateSpeed[2] = action;
			} else if (ev.code === E_KEY) {
				this.translateSpeed[5] = action;
			} else if (ev.code === A_KEY) {
				this.translateSpeed[1] = action;
			} else if (ev.code === S_KEY) {
				this.translateSpeed[3] = action;
			} else if (ev.code === D_KEY) {
				this.translateSpeed[0] = action;
			} else if (ev.code === SPACE_KEY && action) {
				this.paused = !this.paused;
			}
		}
	};

	boolToInt = (v) => {
		return v ? 1 : 0
	};
	formatAngle = (v) => {
		const x = v % 360;
		return x < 0 ? 360 + x : x;
	};
	iterateTransform = (delta) => {
		this.angles[0] += delta * this.boolToInt(this.anglesSpeed[0]) * DEGREE_PER_MILLISECOND;
		this.angles[0] -= delta * this.boolToInt(this.anglesSpeed[1]) * DEGREE_PER_MILLISECOND;
		this.angles[1] += delta * this.boolToInt(this.anglesSpeed[2]) * DEGREE_PER_MILLISECOND;
		this.angles[1] -= delta * this.boolToInt(this.anglesSpeed[3]) * DEGREE_PER_MILLISECOND;
		this.angles[2] += delta * this.boolToInt(this.anglesSpeed[4]) * DEGREE_PER_MILLISECOND;
		this.angles[2] -= delta * this.boolToInt(this.anglesSpeed[5]) * DEGREE_PER_MILLISECOND;
		this.angles[0] = this.formatAngle(this.angles[0]);
		this.angles[1] = this.formatAngle(this.angles[1]);
		this.angles[2] = this.formatAngle(this.angles[2]);
		this.translate[0] += delta * this.boolToInt(this.translateSpeed[0]) * TRANSLATE_PER_MILLISECOND;
		this.translate[0] -= delta * this.boolToInt(this.translateSpeed[1]) * TRANSLATE_PER_MILLISECOND;
		this.translate[1] += delta * this.boolToInt(this.translateSpeed[2]) * TRANSLATE_PER_MILLISECOND;
		this.translate[1] -= delta * this.boolToInt(this.translateSpeed[3]) * TRANSLATE_PER_MILLISECOND;
		this.translate[2] += delta * this.boolToInt(this.translateSpeed[4]) * TRANSLATE_PER_MILLISECOND;
		this.translate[2] -= delta * this.boolToInt(this.translateSpeed[5]) * TRANSLATE_PER_MILLISECOND;
		this.scale += delta * this.boolToInt(this.scaleSpeed[0]) * SCALE_PER_MILLISECOND;
		this.scale -= delta * this.boolToInt(this.scaleSpeed[1]) * SCALE_PER_MILLISECOND;
	};
	drawScene = () => {
		this.ended = this.canvas.isEnd();
		let delta = 0, deltaFps = 0;
		if (!this.fpsNow) {
			this.fpsNow = Date.now();
			deltaFps = 0;
		} else {
			const t = Date.now();
			deltaFps = t - this.fpsNow;
			this.fpsNow = t;
		}
		this.iterateTransform(deltaFps);
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
		this.canvas.draw(model, view, normalModel, delta, this.begin, deltaFps);

		setTimeout(this.drawScene, 15);
	};
	resize = () => {
		this.canvas.resize();
		this.aspectRatioBalance = this.canvas.height / this.canvas.width;
	};
}