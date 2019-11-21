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
	coords;
	normals;
	indices;
	colors;
	color;
	skip;
	level;
	acceleration;
	transparencySpeed;
	removeSpeed;
	nextAcceleration;
	nextTransparencySpeed;
	nextRemoveSpeed;
	nextDistance;
	nextRadius;
	nextTime;
	nextSkip;
	nextBoundRect;
	nextLevel;
	removing;
	time;
	distance;

	constructor(level) {
		this.level = level;
		this.acceleration = null;
		this.transparencySpeed = null;
		this.removeSpeed = null;
		this.removing = false;
		this.color = [0.0, 1.0, 0.0, 1.0];
	}

	buildSphere = (height, skip, radius) => {
		this.coords = [];
		this.colors = [];
		let x, y, z, xz;
		this.centerX = this.nextBoundRect.centerX;
		this.centerY = GRAPH_HEIGHT / 2 - (this.nextLevel * (GRAPH_HEIGHT / height)) - (GRAPH_HEIGHT / (2 * height));
		this.centerZ = this.nextBoundRect.centerY;
		const minRect = Math.min(this.nextBoundRect.width/2, this.nextBoundRect.height/2, GRAPH_HEIGHT / (4 * height));
		if (radius <= minRect) {
			this.radius = radius;
		} else {
			this.radius = minRect;
		}
		const sectorStep = 2 * Math.PI / SPHERE_SECTOR_COUNT, stackStep = Math.PI / SPHERE_STACK_COUNT;
		for (let i = 0; i <= SPHERE_STACK_COUNT; i++) {
			const stackAngle = Math.PI / 2 - i * stackStep;
			xz = this.radius * Math.cos(stackAngle);
			y = this.centerY + this.radius * Math.sin(stackAngle);
			for (let j = 0; j <= SPHERE_SECTOR_COUNT; j++) {
				const sectorAngle = j * sectorStep;

				z = this.centerZ + xz * Math.sin(sectorAngle);
				x = this.centerX + xz * Math.cos(sectorAngle);

				this.coords.push(x, y, z, 1.0);
				this.colors.push(this.color[0], this.color[1], this.color[2], this.color[3]);
			}
		}
		this.buildIndices(skip);
		this.coords.push(this.centerX, this.centerY, this.centerZ, 1.0);
		this.colors.push(1.0, 1.0, 1.0, 1.0);
	};
	buildIndices = (skip) => {
		this.indices = [];
		this.nextSkip = skip;
		for (let i = 0; i < SPHERE_STACK_COUNT; i++) {
			let k1 = i * (SPHERE_SECTOR_COUNT + 1);
			let k2 = k1 + SPHERE_SECTOR_COUNT + 1;
			for (let j = 0; j < SPHERE_SECTOR_COUNT; j++, k1++, k2++) {
				if (i !== 0) {
					this.indices.push(skip + k1, skip + k2, skip + k1 + 1);
				}
				if (i !== (SPHERE_STACK_COUNT - 1)) {
					this.indices.push(skip + k1 + 1, skip + k2, skip + k2 + 1);
				}
			}
		}
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
	move = (coords, colors, delta) => {
		if (this.acceleration) {
			const moves = this.calcMoves(delta);
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < this.coords.length / 4; j++) {
					coords[4 * (j + this.skip) + i] = this.coords[4 * j + i] + moves[i];
				}
			}
		}
		if (this.transparencySpeed) {
			for (let i = 0; i < this.colors.length / 4 - 1; i++) {
				colors[(i + this.skip) * 4 + 1] = delta * this.transparencySpeed;
			}
		}
		if (this.removeSpeed) {
			for (let i = 0; i < this.colors.length / 4 - 1; i++) {
				colors[(i + this.skip) * 4 + 1] = 1.0 - delta * this.removeSpeed;
			}
		}
	};
	isMoving = () => {
		return (this.acceleration && (this.acceleration[0] !== 0 || this.acceleration[1] !== 0 || this.acceleration[2] !== 0)
			|| (this.transparencySpeed && this.transparencySpeed !== 0) || (this.removeSpeed && this.removeSpeed !== 0));
	};
	
	setNextSpeed = (height) => {
		if (this.acceleration) {
			this.resetAcceleration();
		}
		if (this.transparencySpeed) {
			this.resetTransparencySpeed();
		}
		if (this.removeSpeed) {
			this.resetRemoveSpeed();
		}
		if (this.nextRadius && this.radius !== this.nextRadius) {
			this.buildSphere(height, this.nextSkip, this.nextRadius);
		}
		if (this.skip !== this.nextSkip) {
			const delta = this.nextSkip - this.skip;
			for (let i = 0; i < this.indices.length; i++) {
				this.indices[i] += delta;
			}
		}
		this.acceleration = this.nextAcceleration;
		this.removeSpeed = this.nextRemoveSpeed;
		this.transparencySpeed = this.nextTransparencySpeed;
		this.distance = this.nextDistance;
		this.time = this.nextTime;
		this.skip = this.nextSkip;
		this.boundRect = this.nextBoundRect;
		this.level = this.nextLevel;
		this.nextAcceleration = null;
		this.nextRemoveSpeed = null;
		this.nextTransparencySpeed = null;
		this.nextDistance = null;
		this.nextTime = null;
		this.nextSkip = null;
		this.nextRadius = null;
		this.nextBoundRect = null;
		this.nextLevel = null;
	};

	calcAcceleration = (height, skip, radius, rect, t) => {
		this.buildIndices(skip);
		const centerX = rect.centerX;
		const centerY = GRAPH_HEIGHT / 2 - (this.nextLevel * (GRAPH_HEIGHT / height)) - (GRAPH_HEIGHT / (2 * height));
		const centerZ = rect.centerY;
		const tSquare = t * t;
		this.nextDistance = [centerX - (this.centerX+this.distance[0]), centerY - (this.centerY+this.distance[1]), centerZ - (this.centerZ+this.distance[2])];
		this.nextAcceleration = [4 * this.distance[0] / tSquare, 4 * this.distance[1] / tSquare, 4 * this.distance[2] / tSquare];
		this.nextTime = t;
		this.nextBoundRect = rect;
		this.nextRadius = radius;
	};

	resetAcceleration = () => {
		if (this.acceleration) {
			for (let i = 0; i < this.coords.length / 4; i++) {
				this.coords[4 * i] += this.distance[0];
				this.coords[4 * i + 1] += this.distance[1];
				this.coords[4 * i + 2] += this.distance[2];
			}
			this.centerX += this.distance[0];
			this.centerY += this.distance[1];
			this.centerZ += this.distance[2];
		}
		this.acceleration = null;
	};

	calcTransparencySpeed = (height, skip, radius, t) => {
		this.buildSphere(height, skip, radius);
		this.buildIndices(skip);
		this.nextTransparencySpeed = 1.0 / t;
		this.nextTime = t;
	};

	resetTransparencySpeed = () => {
		if (this.transparencySpeed) {
			for (let i = 0; i < this.colors.length / 4 - 1; i++) {
				this.colors[i * 4 + 1] = 1.0;
			}
		}
		this.transparencySpeed = null;
	};

	calcRemoveSpeed = (t) => {
		this.nextRemoveSpeed = 1.0 / t;
		this.nextTime = t;
	};

	resetRemoveSpeed = () => {
		if (this.removeSpeed) {
			for (let i = 0; i < this.colors.length / 4 - 1; i++) {
				this.colors[i * 4 + 1] = 0.0;
			}
		}
		this.removeSpeed = null;
	};

	set nextBoundRect(rect) {
		this.nextBoundRect = rect;
	}

	set level(level) {
		this.level = level;
	}
	
	set nextLevel(level) {
		this.nextLevel = level;
	}

	set removing(removing) {
		this.removing = removing;
	}

	set parent(parent) {
		this.parent = parent;
	}

	get boundRect() {
		return this.boundRect;
	}
	
	get nextBoundRect() {
		return this.nextBoundRect;
	}

	get parent() {
		return this.parent;
	}

	get level() {
		return this.level;
	}

	get coords() {
		return this.coords;
	}

	get indices() {
		return this.indices;
	}

	get colors() {
		return this.colors;
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

	constructor(name) {
		super(0);
		this.name = name;
		this.edgeCoords = [];
		this.edgeColors = [];
		this.color = [1.0, 0.0, 0.0, 1.0];
	}

	buildEdges = (coords) => {
		this.edgeCoords = [];
		this.edgeColors = [];
		this.edgeNormals = [];
		for (let i = 0; i < this.updates.length; i++) {
			for (let j = 0; j < this.updates[i].vertexSet.length; j++) {
				this.edgeCoords = this.edgeCoords.concat(coords.slice(this.skip * 4 + this.coords.length - 4, this.skip * 4 + this.coords.length));
				this.edgeCoords = this.edgeCoords.concat(coords.slice(
					this.updates[i].vertexSet[j].skip * 4 + this.updates[i].vertexSet[j].coords.length - 4,
					this.updates[i].vertexSet[j].skip * 4 + this.updates[i].vertexSet[j].coords.length)
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
		let l = 0, r = this.children.length, m = Math.floor(r/2);
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
				m = Math.floor((r+l)/2);
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
		let l = 0, r = this.children.length, m = Math.floor(r/2);
		const cmpInd = child.path.length-1;
		while (l < r - 1) {
			if (this.children[m].path[cmpInd] === child.path[cmpInd]) {
				break;
			} else if (child.path[cmpInd] < this.children[m].path[cmpInd]) {
				r = m;
			} else {
				l = m;
			}
			m = Math.floor((r+l)/2);
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