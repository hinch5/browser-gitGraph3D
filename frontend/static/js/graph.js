class GitUpdate {
	vertex;
	action;
	constructor(vertex, action) {
		this.vertex = vertex;
		this.action = action;
	}
	get vertex() {
		return this.vertex;
	}
	get action() {
		return this.action;
	}
}

class GitContributor extends Vertex{
	name;
	updates;
	dir;
	edgeCoords;
	edgeColors;
	constructor(name, updates) {
		super(0);
		this.name = name;
		this.updates = updates;
		this.edgeCoords = [];
		this.edgeColors = [];
		this.color = [1.0, 0.0, 0.0, 1.0];
	}
	drop = () => {
		this.dir.contributor = null;
	};
	buildEdges = () => {
		for (let i = 0; i < this.updates.length; i++) {
			this.edgeCoords = this.edgeCoords.concat(this.coords.slice(this.coords.length-4));
			this.edgeCoords = this.edgeCoords.concat(this.updates[i].vertex.coords.slice(this.updates[i].vertex.coords.length-4));
			if (this.updates[i].action === 0) {
				this.edgeColors = this.edgeColors.concat([0.0, 1.0, 0.0, 1.0]);
			} else if (this.updates[i].action === 1) {
				this.edgeColors = this.edgeColors.concat([1.0, 0.0, 0.0, 1.0]);
			} else {
				this.edgeColors = this.edgeColors.concat([0.0, 0.0, 1.0, 1.0]);
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
	set dir(dir) {
		this.drop();
		this.dir = dir;
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
		this.contributors = [];
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
				if (vertexSet[0][0].haveContributor()) {
					const rectSplitted = vertexSet[1].split(0.5);
					vertexSet[0][0].boundRect = rectSplitted[0];
					vertexSet[0][0].contributor.boundRect = rectSplitted[1];
					if (vertexSet[0][0].children.length !== 0) {
						stack.push([vertexSet[0][0].children.slice(), vertexSet[1]]);
					}
				} else {
					vertexSet[0][0].boundRect = vertexSet[1];
					if (vertexSet[0][0].children.length !== 0) {
						stack.push([vertexSet[0][0].children.slice(), vertexSet[1]]);
					}
				}
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
						const rectSplitted = vertexSet[1].split(percent);
						stack.push([firstSet, rectSplitted[0]], [vertexSet[0], rectSplitted[1]]);
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