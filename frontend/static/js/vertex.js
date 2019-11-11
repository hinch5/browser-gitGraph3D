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
	beginCoords;
	normals;
	indices;
	colors;
	color;
	skip;
	level;
	acceleration;
	transparencySpeed;
	removeSpeed;
	removing;
	time;
	constructor(level) {
		this.level = level;
		this.acceleration = null;
		this.transparencySpeed = null;
		this.removeSpeed = null;
		this.removing = false;
		this.color = [0.0, 1.0, 0.0, 1.0];
	}
	buildSphere = (height, skip) => {
		this.coords = [];
		this.colors = [];
		let x, y, z, xz;
		this.centerX = this.boundRect.centerX;
		this.centerY = GRAPH_HEIGHT/2 - (this.level*(GRAPH_HEIGHT/height)) - (GRAPH_HEIGHT/(2*height));
		this.centerZ = this.boundRect.centerY;
		const minRect = Math.min(this.boundRect.width, this.boundRect.height, GRAPH_HEIGHT/(2*height));
		if (SPHERE_RADIUS <= minRect) {
			this.radius = SPHERE_RADIUS;
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
		this.beginCoords = this.coords.slice();
	};
	buildIndices = (skip) => {
		this.indices = [];
		this.skip = skip;
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

	move = (delta) => {
		if (this.acceleration) {
			const tSquare = delta * delta;
			if (delta <= this.time/2) {
				for (let i = 0; i < 3; i++) {
					for (let j = 0; j < this.coords.length/4; j++) {
						this.coords[4*j+i] = this.beginCoords[4*j+i] + this.acceleration[i]*tSquare/2;
					}
				}
			}  else {
				for (let i = 0; i < 3; i++) {
					for (let j = 0; j < this.coords.length/4; j++) {
						this.coords[4*j+i] = this.beginCoords[4*j+i] +
							this.acceleration[i]*this.time*this.time/8 +
							this.acceleration[i]*(this.time/2)*(delta - this.time/2) -
							this.acceleration[i]*(delta - this.time/2)*(delta - this.time/2)/2;
					}
				}
			}
		}
		if (this.transparencySpeed) {
			for (let i = 0; i < this.colors.length/4-1; i++) {
				this.colors[i*4 + 1] = delta*this.transparencySpeed;
			}
		}
		if (this.removeSpeed) {
			for (let i = 0; i < this.colors.length/4-1; i++) {
				this.colors[i*4 + 1] = 1.0 - delta*this.removeSpeed;
			}
		}
	};

	calcAcceleration = (height, skip, rect, t) => {
		this.buildIndices(skip);
		const centerX = rect.centerX;
		const centerY = GRAPH_HEIGHT/2 - (this.level*(GRAPH_HEIGHT/height)) - (GRAPH_HEIGHT/(2*height));
		const centerZ = rect.centerY;
		const tSquare = t * t;
		this.acceleration = [4*(centerX-this.centerX)/tSquare, 4*(centerY-this.centerY)/tSquare, 4*(centerZ-this.centerZ)/tSquare];
		this.centerX = centerX;
		this.centerY = centerY;
		this.centerZ = centerZ;
		this.time = t;
		this.boundRect = rect;
	};

	resetAcceleration = () => {
		this.acceleration = null;
		this.beginCoords = this.coords.slice();
	};

	calcTransparencySpeed = (height, skip, t) => {
		this.buildSphere(height, skip);
		this.transparencySpeed = 1.0/t;
		this.time = t;
	};

	resetTransparencySpeed = () => {
		this.transparencySpeed = null;
		this.beginCoords = this.coords.slice();
	};
	
	calcRemoveSpeed = (skip, t) => {
		this.buildIndices(skip);
		this.removeSpeed = 1.0/t;
		this.time = t;
	};
	
	resetRemoveSpeed = () => {
		this.removeSpeed = null;
		this.beginCoords = this.coords.slice();
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

	get boundRect() {
		return this.boundRect;
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
}

class GitContributor extends Vertex{
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
	buildEdges = () => {
		this.edgeCoords = [];
		this.edgeColors = [];
		this.edgeNormals = [];
		for (let i = 0; i < this.updates.length; i++) {
			for (let j = 0; j < this.updates[i].vertexSet.length; j++) {
				this.edgeCoords = this.edgeCoords.concat(this.coords.slice(this.coords.length-4));
				this.edgeCoords = this.edgeCoords.concat(this.updates[i].vertexSet[j].coords.slice(this.updates[i].vertexSet[j].coords.length-4));
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

class GitObject extends Vertex{
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

	childComparator = (a, b) => {
		if (a.size < b.size) {
			return -1;
		} else if (a.size === b.size) {
			return 0;
		} else {
			return 1;
		}
	};
	addChild = (child) => {
		let insertInd = 0;
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].size > child.size) {
				insertInd = i;
			}
		}
		this.children.splice(insertInd, 0, child);
		let p = this;
		for (; p.parent !== null; p = p.parent) {
			p.addSize(child.size);
			p.children.sort(this.childComparator);
		}
		p.addSize(child.size);
		p.children.sort(this.childComparator);
	};
	removeChild = (child) => {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].equals(child)) {
				this.children.splice(i, 1);
				let p = this;
				for (; p.parent !== null; p = p.parent) {
					p.addSize(-child.size);
					p.children.sort(this.childComparator);
				}
				p.addSize(-child.size);
				p.children.sort(this.childComparator);
				child.parent = null;
			}
		}
	};
	equals = (vertex) => {
		if (this.path.length !== vertex.path.length) {
			return false;
		}
		for (let i = 0; i < this.path.length; i++) {
			if (this.path[i] !== vertex.path[i]) {
				return false;
			}
		}
		return true;
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