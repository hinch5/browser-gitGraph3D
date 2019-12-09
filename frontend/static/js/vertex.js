class Rect3D {
	x1;
	y1;
	width;
	height;
	centerX;
	centerY;

	constructor(x1, y1, width, height) {
		this.x1 = x1;
		this.y1 = y1;
		this.width = width;
		this.height = height;
		this.centerX = this.x1 + this.width / 2;
		this.centerY = this.y1 + this.height / 2;
	}

	split = (percent) => {
		if (percent >= 1) {
			console.log('what??');
		}
		if (this.width >= this.height) {
			const newWidth = this.width * percent;
			return [
				new Rect3D(this.x1, this.y1, newWidth, this.height),
				new Rect3D(this.x1 + newWidth, this.y1, this.width - newWidth, this.height)
			];
		} else {
			const newHeight = this.height * percent;
			return [
				new Rect3D(this.x1, this.y1, this.width, newHeight),
				new Rect3D(this.x1, this.y1 + newHeight, this.width, this.height - newHeight)
			];
		}
	};

	get centerX() {
		return this.centerX;
	}

	get centerY() {
		return this.centerY;
	}

	get width() {
		return this.width;
	}

	get height() {
		return this.height;
	}
}

class Vertex {
	parent;
	boundRect;
	centerX;
	centerY;
	centerZ;
	radius;
	// normals;
	color;
	skip;
	level;
	acceleration;
	transparencySpeed;
	removeSpeed;
	removing;
	time;
	now;
	distance;

	constructor(level) {
		this.level = level;
		this.acceleration = null;
		this.transparencySpeed = null;
		this.removeSpeed = null;
		this.skip = null;
		this.removing = false;
		this.color = [0.0, 1.0, 0.0, 1.0];
	}

	buildSphere = (height, radius, coords, colors) => {
		let x, y, z, xz;
		this.centerX = this.boundRect.centerX;
		this.centerY = GRAPH_HEIGHT / 2 - (this.level * (GRAPH_HEIGHT / height)) - (GRAPH_HEIGHT / (2 * height));
		this.centerZ = this.boundRect.centerY;
		const minRect = Math.min(this.boundRect.width / 2, this.boundRect.height / 2, GRAPH_HEIGHT / (4 * height));
		if (radius <= minRect) {
			this.radius = radius;
		} else {
			this.radius = minRect;
		}
		const sectorStep = 2 * Math.PI / SPHERE_SECTOR_COUNT, stackStep = Math.PI / SPHERE_STACK_COUNT;
		coords[(this.skip) * 4] = this.centerX;
		coords[(this.skip) * 4 + 1] = this.centerY + radius;
		coords[(this.skip) * 4 + 2] = this.centerZ;
		coords[(this.skip * 4) + 3] = 1.0;
		coords[(this.skip) * 4 + 4] = this.centerX;
		coords[(this.skip) * 4 + 5] = this.centerY - radius;
		coords[(this.skip) * 4 + 6] = this.centerZ;
		coords[(this.skip * 4) + 7] = 1.0;
		colors[(this.skip) * 4] = this.color[0];
		colors[(this.skip) * 4 + 1] = this.color[1];
		colors[(this.skip) * 4 + 2] = this.color[2];
		colors[(this.skip * 4) + 3] = 1.0;
		colors[(this.skip) * 4 + 4] = this.color[0];
		colors[(this.skip) * 4 + 5] = this.color[1];
		colors[(this.skip) * 4 + 6] = this.color[2];
		colors[(this.skip * 4) + 7] = 1.0;
		for (let i = 0; i < SPHERE_STACK_COUNT-1; i++) {
			const stackAngle = Math.PI / 2 - (i+1) * stackStep;
			xz = this.radius * Math.cos(stackAngle);
			y = this.centerY + this.radius * Math.sin(stackAngle);
			for (let j = 0; j < SPHERE_SECTOR_COUNT; j++) {
				const sectorAngle = j * sectorStep;

				z = this.centerZ + xz * Math.sin(sectorAngle);
				x = this.centerX + xz * Math.cos(sectorAngle);

				coords[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4] = x;
				coords[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 1] = y;
				coords[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 2] = z;
				coords[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 3] = 1.0;

				colors[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4] = this.color[0];
				colors[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 1] = this.color[1];
				colors[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 2] = this.color[2];
				colors[(this.skip + i * SPHERE_SECTOR_COUNT + 2 + j) * 4 + 3] = this.color[3];
			}
		}

		coords[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4] = this.centerX;
		coords[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 1] = this.centerY;
		coords[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 2] = this.centerZ;
		coords[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 3] = 1.0;

		colors[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4] = 1.0;
		colors[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 1] = 1.0;
		colors[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 2] = 1.0;
		colors[(this.skip + (SPHERE_STACK_COUNT - 1) * SPHERE_SECTOR_COUNT + 2) * 4 + 3] = 1.0;
	};

	calcMoves = (delta) => {
		if (delta < this.time / 2) {
			const tSquare = delta * delta;
			return [this.acceleration[0] * tSquare / 2, this.acceleration[1] * tSquare / 2, this.acceleration[2] * tSquare / 2];
		} else {
			const t = (delta - this.time / 2);
			const t2 = t * t;
			return [this.acceleration[0] * this.time * this.time / 8 + this.acceleration[0] * (this.time / 2) * t - this.acceleration[0] * t2 / 2,
				this.acceleration[1] * this.time * this.time / 8 + this.acceleration[1] * (this.time / 2) * t - this.acceleration[1] * t2 / 2,
				this.acceleration[2] * this.time * this.time / 8 + this.acceleration[2] * (this.time / 2) * t - this.acceleration[2] * t2 / 2];
		}
	};
	calcMoves1 = (delta) => {
		const mv1 = this.calcMoves(this.now), mv2 = this.calcMoves(delta);
		this.now = delta;
		return [mv2[0] - mv1[0], mv2[1] - mv1[1], mv2[2] - mv1[2]];
	};
	move = (coords, colors, delta) => {
		if (this.acceleration) {
			const moves = this.calcMoves1(delta);
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < VERTEX_SIZE + SKIP_COORDS; j++) {
					coords[4 * (j + this.skip) + i] += moves[i];
				}
			}
		}
		if (this.transparencySpeed) {
			for (let i = 0; i < VERTEX_SIZE; i++) {
				colors[(i + this.skip) * 4 + 1] = delta * this.transparencySpeed;
			}
		}
		if (this.removeSpeed) {
			for (let i = 0; i < VERTEX_SIZE; i++) {
				colors[(i + this.skip) * 4 + 1] = 1.0 - delta * this.removeSpeed;
			}
		}
	};
	isMoving = () => {
		return (this.acceleration && (this.acceleration[0] !== 0 || this.acceleration[1] !== 0 || this.acceleration[2] !== 0)
			|| (this.transparencySpeed && this.transparencySpeed !== 0) || (this.removeSpeed && this.removeSpeed !== 0));
	};

	calcAcceleration = (height, rect, t) => {
		const centerX = rect.centerX;
		const centerY = GRAPH_HEIGHT / 2 - (this.level * (GRAPH_HEIGHT / height)) - (GRAPH_HEIGHT / (2 * height));
		const centerZ = rect.centerY;
		const tSquare = t * t;
		this.distance = [centerX - this.centerX, centerY - this.centerY, centerZ - this.centerZ];
		this.acceleration = [4 * this.distance[0] / tSquare, 4 * this.distance[1] / tSquare, 4 * this.distance[2] / tSquare];
		this.time = t;
		this.now = 0;
		this.boundRect = rect;
	};

	resetAcceleration = (coords, colors) => {
		if (this.acceleration) {
			this.move(coords, colors, this.time);
			this.centerX += this.distance[0];
			this.centerY += this.distance[1];
			this.centerZ += this.distance[2];
		}
		this.acceleration = null;
	};

	calcTransparencySpeed = (height, t) => {
		this.transparencySpeed = 1.0 / t;
		this.time = t;
		this.now = 0;
	};

	resetTransparencySpeed = (colors) => {
		if (this.transparencySpeed) {
			for (let i = 0; i < VERTEX_SIZE; i++) {
				colors[(this.skip + i) * 4 + 1] = 1.0;
			}
		}
		this.transparencySpeed = null;
	};

	calcRemoveSpeed = (height, t) => {
		this.removeSpeed = 1.0 / t;
		this.time = t;
		this.now = 0;
	};

	resetRemoveSpeed = (colors) => {
		if (this.removeSpeed) {
			for (let i = 0; i < VERTEX_SIZE; i++) {
				colors[(this.skip + i) * 4 + 1] = 0.0;
			}
		}
		this.removeSpeed = null;
	};

	set boundRect(rect) {
		this.boundRect = rect;
	}

	set level(level) {
		this.level = level;
	}

	set removing(removing) {
		this.removing = removing;
	}

	set parent(parent) {
		this.parent = parent;
	}

	set skip(skip) {
		this.skip = skip;
	}

	get boundRect() {
		return this.boundRect;
	}

	get parent() {
		return this.parent;
	}

	get level() {
		return this.level;
	}

	get skip() {
		return this.skip;
	}

	get removing() {
		return this.removing;
	}

	get radius() {
		return this.radius;
	}
}

class GitContributor extends Vertex {
	name;
	updates;
	dir;
	edgeCoords;
	edgeColors;
	edgeNormals;

	constructor(name, color) {
		super(0);
		this.name = name;
		this.edgeCoords = [];
		this.edgeColors = [];
		if (!color) {
			this.color = [1.0, 0.0, 0.0, 1.0];
		} else {
			this.color = [
				Number.parseInt(color.substring(0, 2), 16) / 256,
				Number.parseInt(color.substring(2, 4), 16) / 256,
				Number.parseInt(color.substring(4, 6), 16) / 256,
				1.0
			]
		}
	}

	buildEdges = (coords) => {
		this.edgeCoords = [];
		this.edgeColors = [];
		this.edgeNormals = [];
		for (let i = 0; i < this.updates.length; i++) {
			for (let j = 0; j < this.updates[i].vertexSet.length; j++) {
				this.edgeCoords = this.edgeCoords.concat(coords.slice((this.skip + VERTEX_SIZE) * 4, (this.skip + VERTEX_SIZE + SKIP_COORDS) * 4));
				this.edgeCoords = this.edgeCoords.concat(coords.slice(
					(this.updates[i].vertexSet[j].skip + VERTEX_SIZE) * 4,
					(this.updates[i].vertexSet[j].skip + VERTEX_SIZE + SKIP_COORDS) * 4)
				);
				if (this.updates[i].action === 0) {
					this.edgeColors = this.edgeColors.concat([0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0]);
				} else if (this.updates[i].action === 1) {
					this.edgeColors = this.edgeColors.concat([0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0]);
				} else {
					this.edgeColors = this.edgeColors.concat([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]);
				}
				this.edgeNormals = this.edgeNormals.concat(0.0, 0.0, -1.0, 0.0, 0.0, -1.0);
			}
		}
	};

	get name() {
		return this.name;
	}

	get edgeCoords() {
		return this.edgeCoords;
	}

	get edgeColors() {
		return this.edgeColors;
	}

	get edgeNormals() {
		return this.edgeNormals;
	}

	set dir(dir) {
		this.dir = dir;
	}

	set updates(updates) {
		this.updates = updates;
	}
}

class GitObject extends Vertex {
	isDir;
	children;
	size;
	path;
	contributor;

	constructor(path, isDir, level, parent) {
		super(level);
		this.path = path;
		this.isDir = isDir;
		this.children = [];
		this.parent = parent;
		this.size = 1;
	}

	addChild = (child) => {
		let l = 0, r = this.children.length, m = Math.floor(r / 2);
		const cmpInd = this.path.length;
		if (this.children.length === 0) {
			this.children.splice(0, 0, child);
		} else if (child.path[cmpInd] < this.children[0].path[cmpInd]) {
			this.children.splice(0, 0, child);
		} else {
			while (l < r - 1) {
				if (child.path[cmpInd] < this.children[m].path[cmpInd]) {
					r = m;
				} else {
					l = m;
				}
				m = Math.floor((r + l) / 2);
			}
			this.children.splice(r, 0, child);
		}
		let p = this;
		for (; p.parent !== null; p = p.parent) {
			p.addSize(child.size);
		}
		p.addSize(child.size);
	};
	removeChild = (child) => {
		let l = 0, r = this.children.length, m = Math.floor(r / 2);
		const cmpInd = child.path.length - 1;
		while (l < r - 1) {
			if (this.children[m].path[cmpInd] === child.path[cmpInd]) {
				break;
			} else if (child.path[cmpInd] < this.children[m].path[cmpInd]) {
				r = m;
			} else {
				l = m;
			}
			m = Math.floor((r + l) / 2);
		}
		this.children.splice(m, 1);
		let p = this;
		for (; p.parent !== null; p = p.parent) {
			p.addSize(-child.size);
		}
		p.addSize(-child.size);
		child.parent = null;
	};
	addSize = (a) => {
		this.size += a;
	};
	haveContributor = () => {
		return this.contributor !== null && this.contributor !== undefined;
	};

	get children() {
		return this.children;
	}

	get size() {
		return this.size;
	}

	get path() {
		return this.path;
	}

	get isDir() {
		return this.isDir;
	}

	get contributor() {
		return this.contributor;
	}

	set contributor(contributor) {
		this.contributor = contributor;
	}
}