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

class GitContributor {
	name;
	centerX;
	centerY;
	centerZ;
	radius;
	coords;
	indices;
	colors;
	skip;

	constructor(name) {
		this.name = name;
	}
	updCenter = (x, y, z, radius) => {
		this.centerX = x;
		this.centerY = y;
		this.centerZ = z;
		this.radius = radius;
	};
	buildCoords = (skip) => {
		this.coords = [];
		this.indices = [];
		this.colors = [];
		let x, y, z, xz;
		// this.centerX = this.boundRect.centerX;
		// this.centerY = GRAPH_HEIGHT/2 - (this.level*(GRAPH_HEIGHT/height)) - (GRAPH_HEIGHT/(2*height));
		// this.centerZ = this.boundRect.centerY;
		this.skip = skip;
		// const minRect = Math.min(this.boundRect.width, this.boundRect.height, GRAPH_HEIGHT/(2*height));
		// if (SPHERE_RADIUS <= minRect) {
		// 	this.radius = SPHERE_RADIUS;
		// } else {
		// 	this.radius = minRect;
		// }
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
				this.colors.push(0.0, 0.0, 1.0, 1.0);
			}
		}
		for (let i = 0; i < SPHERE_STACK_COUNT; i++) {
			let k1 = i * (SPHERE_SECTOR_COUNT + 1);
			let k2 = k1 + SPHERE_SECTOR_COUNT + 1;
			for (let j = 0; j < SPHERE_SECTOR_COUNT; j++, k1++, k2++) {
				if (i !== 0) {
					this.indices.push(this.skip + k1, this.skip + k2, this.skip + k1 + 1);
				}
				if (i !== (SPHERE_STACK_COUNT - 1)) {
					this.indices.push(this.skip + k1 + 1, this.skip + k2, this.skip + k2 + 1);
				}
			}
		}
		this.coords.push(this.centerX, this.centerY, this.centerZ, 1.0);
		this.colors.push(1.0, 1.0, 0.0, 1.0)
	};
}

class GitObject {
	isDir;
	children;
	size;
	level;
	parent;
	boundRect;
	centerX;
	centerY;
	centerZ;
	radius;
	path;
	coords;
	indices;
	colors;
	skip;

	constructor(path, isDir, level, parent) {
		this.path = path;
		this.isDir = isDir;
		this.children = [];
		this.level = level;
		this.parent = parent;
		this.size = 1;
	}

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
			p.children.sort((a, b) => {
				if (a.size < b.size) {
					return -1;
				} else if (a.size === b.size) {
					return 0;
				} else {
					return 1;
				}
			});
		}
		p.addSize(child.size);
		p.children.sort((a, b) => {
			if (a.size < b.size) {
				return -1;
			} else if (a.size === b.size) {
				return 0;
			} else {
				return 1;
			}
		});
	};
	addSize = (a) => {
		this.size += a;
	};
	buildSphere = (height, skip) => {
		this.coords = [];
		this.indices = [];
		this.colors = [];
		let x, y, z, xz;
		this.centerX = this.boundRect.centerX;
		this.centerY = GRAPH_HEIGHT/2 - (this.level*(GRAPH_HEIGHT/height)) - (GRAPH_HEIGHT/(2*height));
		this.centerZ = this.boundRect.centerY;
		this.skip = skip;
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
				this.colors.push(0.0, 1.0, 0.0, 1.0);
			}
		}
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
		this.coords.push(this.centerX, this.centerY, this.centerZ, 1.0);
		this.colors.push(1.0, 0.0, 0.0, 1.0)
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

	set boundRect(rect) {
		this.boundRect = rect;
	}

	get boundRect() {
		return this.boundRect;
	}

	get children() {
		return this.children;
	}

	get level() {
		return this.level;
	}

	get size() {
		return this.size;
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

	get parent() {
		return this.parent;
	}

	get path() {
		return this.path;
	}

	get isDir() {
		return this.isDir;
	}
	
	get skip() {
		return this.skip;
	}
}

class Graph {
	height;
	coords;
	indices;
	colors;
	root;
	edgeIndices;
	contributors;

	constructor() {
		this.root = new GitObject([], true, 0, null);
		this.root.boundRect = new Rect3D(-GRAPH_WIDTH/2, -GRAPH_DEPTH/2, GRAPH_WIDTH, GRAPH_DEPTH);
		this.height = 1;
		this.coords = [];
		this.indices = [];
		this.colors = [];
		this.contributors = new Map();
		this.addElement(new GitObject(['sos', 'h', 'sos.json'], false));
		this.addElement(new GitObject(['zhizn'], true));
		this.addElement(new GitObject(['zhizn', 'v.json'], false));
		this.addElement(new GitObject(['zhizn', 'm.yml'], false));
		this.addElement(new GitObject(['gold', 'algebra.lee'], false));
		this.addElement(new GitObject(['zhizn', 'smert.cpp'], false));
		this.addElement(new GitObject(['file.txt']), false);
		this.addElement(new GitObject(['zhizn', 'smert', 'rip.py']), false);
		this.addElement(new GitObject(['zhizn', 'help.md'], false));
		this.addElement(new GitObject(['zhizn', 'smert', 'rip.js']), false);
		this.splitSpace();
		// console.log(this);
	};

	addElement = (element) => {
		const res = this.tryAddElement(this.root, element, 0);
		this.splitSpace();
		return res;
	};
	tryAddElement = (parent, element, pathInd) => {
		for (let i = 0; i < parent.children.length; i++) {
			if (parent.children[i].path[pathInd] === element.path[pathInd]) {
				if (!parent.children[i].isDir) {
					console.log('smert not folder');
					return null;
				}
				if (pathInd + 1 !== element.path.length) {
					return this.tryAddElement(parent.children[i], element, pathInd + 1);
				} else {
					console.log('smert');
					return parent;
				}
			}
		}
		let p = parent;
		for (let i = pathInd; i < element.path.length - 1; i++) {
			const child = new GitObject(element.path.slice(0, i + 1), true, p.level + 1, p);
			p.addChild(child);
			p = child;
		}
		p.addChild(new GitObject(element.path, element.isDir, p.level + 1, p));
		if (p.level + 2 > this.height) {
			this.height = p.level + 2;
		}
		return p;
	};
	findElement = (parent, element, pathInd) => {
		for (let i = 0; i < parent.children.length; i++) {
			if (parent.children[i].path[pathInd] === element.path[pathInd]) {
				if (!parent.children[i].isDir) {
					console.log('smert not folder');
				}
				if (pathInd === element.path.length - 1) {
					return parent.parent;
				}
				return this.findElement(parent.children[i], element, pathInd + 1)
			}
		}
		return null;
	};
	updElements = (author, elements) => {
		let contributor = null;
		if (this.contributors.has(author)) {
			contributor = this.contributors.get(author);
		} else {
			contributor = new GitContributor(author);
		}
		const updates = new Map();
		for (let i = 0; i < elements.length; i++) {
			let p = this.findElement(this.root, elements[i], 0);
			if (p !== null) {
				p = this.addElement(elements[i]);
			}
			for (let j = 0; j < p.children.length; j++) {
				if (p.children[j].path[p.children[j].path.length - 1] === elements[i].path[elements[i].path.length-1]) {
					if (updates.has(p.path.join('/'))) {
						updates.get(p.path.join('/').push(p.children[j]));
					} else {
						updates.set(p.path.join('/'), p.children[j]);
					}
				}
			}
		}

		// draw updates
	};
	splitSpace = () => {
		const stack = [[[this.root], this.root.boundRect]];
		while (stack.length !== 0) {
			const vertexSet = stack.pop();
			if (vertexSet[0].length === 1) {
				vertexSet[0][0].boundRect = vertexSet[1];
				stack.push([vertexSet[0][0].children.slice(), vertexSet[1]]);
			} else {
				let fullSize = 0, firstSet = 0, firstInd = 0;
				for (let i = 0; i < vertexSet[0].length; i++) {
					fullSize += vertexSet[0][i].size;
				}
				for (let i = 0; i < vertexSet[0].length; i++) {
					firstSet += vertexSet[0][i].size;
					firstInd++;
					let percent = firstSet / fullSize;
					if (percent >= MIN_PERCENT_SPLIT) {   // const, чтобы не было оверузких кусков по одной из координат
						if (percent === 1) {   // если одна из вершин оверогромная, воспользоваться минимумом по разбиению
							percent = MIN_PERCENT_SPLIT;
							firstInd--;
						}
						const firstSet = vertexSet[0].splice(firstInd, vertexSet[0].length - firstInd);
						const rectSpitted = vertexSet[1].split(percent);
						stack.push([firstSet, rectSpitted[0]], [vertexSet[0], rectSpitted[1]]);
						break
					}
				}
			}
		}
		this.buildCoords();
	};
	buildCoords = () => {
		this.coords = [];
		this.colors = [];
		this.indices = [];
		this.edgeIndices = [];
		let skip = 0;
		const stack = [[[this.root], null]];
		while (stack.length !== 0) {
			const vertexSet = stack.pop();
			for (let i = 0; i < vertexSet[0].length; i++) {
				vertexSet[0][i].buildSphere(this.height, skip);
				this.coords = this.coords.concat(vertexSet[0][i].coords);
				this.indices = this.indices.concat(vertexSet[0][i].indices);
				this.colors = this.colors.concat(vertexSet[0][i].colors);
				if (vertexSet[0][i].children.length !== 0) {
					stack.push([vertexSet[0][i].children, vertexSet[0][i]]);
				}
				if (vertexSet[1] !== null) {
					this.edgeIndices.push(skip + VERTEX_SIZE , vertexSet[1].skip + VERTEX_SIZE);
				}
				skip += VERTEX_SIZE + SKIP_COORDS;
			}
		}
	};

	get coords() {
		return this.coords;
	}

	get indices() {
		return this.indices;
	}
	
	get edgeIndices() {
		return this.edgeIndices;
	}

	get colors() {
		return this.colors;
	}
}