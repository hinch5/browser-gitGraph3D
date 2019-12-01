class UpdateData {
	name;  // string
	dir;   // path array
	startDate;   // start time(from 0)
	duration;   // integer
	expireDate;
	updates;   // UpdateFile[]
	constructor(name, dir, startDate, duration, updates) {
		this.name = name;
		this.dir = dir;
		this.startDate = startDate;
		this.duration = duration;
		this.expireDate = startDate + duration;
		this.updates = updates;
	}

	get name() {
		return this.name;
	}

	get dir() {
		return this.dir;
	}

	get expireDate() {
		return this.expireDate;
	}

	get updates() {
		return this.updates;
	}
}

class UpdateFile {
	vertexSet;  // vertex set
	file;    // file array path
	isDir;   // isDir flag
	action;  // action (0 - create, 1 - update, 2 - delete)
	constructor(file, isDir, action) {
		this.file = file;
		this.isDir = isDir;
		this.action = action;
	}

	get file() {
		return this.file;
	}

	get isDir() {
		return this.isDir;
	}

	get action() {
		return this.action;
	}

	get vertexSet() {
		return this.vertexSet;
	}

	set vertexSet(vertexSet) {
		this.vertexSet = vertexSet;
	}
}

class Graph {
	height;
	heightMap;
	coords;
	indices;
	colors;
	normals;
	sphereNormal;
	edgeCoords;
	edgeColors;
	edgeNormals;
	root;
	edgeIndices;
	contributors;
	currentContributor;
	contributorColors;
	updates;
	now;
	updateIndex;
	orderedVertices;
	movingVertices;
	newVertices;
	skipMap;
	operating;

	constructor(updates) {
		this.root = new GitObject([], true, 0, null);
		this.root.boundRect = new Rect3D(-GRAPH_WIDTH / 2, -GRAPH_DEPTH / 2, GRAPH_WIDTH, GRAPH_DEPTH);
		this.height = 1;
		this.heightMap = new Map();
		this.heightMap.set(1, 1);
		this.contributorColors = new Map();
		this.coords = [];
		this.indices = [];
		this.colors = [];
		this.normals = [];
		this.edgeCoords = [];
		this.edgeColors = [];
		this.edgeNormals = [];
		this.edgeIndices = [];
		this.contributors = [];
		this.orderedVertices = [];
		this.movingVertices = [];
		this.updates = [new UpdateData('', [], 0, 1000, [])].concat(updates);  // init update
		this.now = 0;
		this.updateIndex = 0;
		this.operating = true;
		this.skipMap = new Map([[0, this.root]]);
		this.newVertices = 1;
		this.buildNormals();
		this.splitSpace(1000);
	};

	buildNormals = () => {
		this.sphereNormal = [];
		let x, y, z, xz;
		const sectorStep = 2 * Math.PI / SPHERE_SECTOR_COUNT, stackStep = Math.PI / SPHERE_STACK_COUNT;
		for (let i = 0; i <= SPHERE_STACK_COUNT; i++) {
			const stackAngle = Math.PI / 2 - i * stackStep;
			xz = Math.cos(stackAngle);
			y = Math.sin(stackAngle);
			for (let j = 0; j <= SPHERE_SECTOR_COUNT; j++) {
				const sectorAngle = j * sectorStep;

				z = xz * Math.sin(sectorAngle);
				x = xz * Math.cos(sectorAngle);

				this.sphereNormal.push(x, y, z);
			}
		}
		this.sphereNormal.push(0.0, 0.0, -1.0);
	};

	randomColor = () => {
		return Math.floor(256*Math.random()).toString(16) +
			Math.floor(256*Math.random()).toString(16) +
			Math.floor(256*Math.random()).toString(16)
	};
	startUpdate = () => {
		this.newVertices = 0;
		this.operating = true;
		if (this.updates[this.updateIndex].name !== '') {
			const dir = this.findDir(this.root, this.updates[this.updateIndex].dir, 0);
			if (dir.haveContributor() && dir.contributor.name !== this.updates[this.updateIndex].name) {
				this.removeVertexFromBuffer(dir.contributor);
				for (let i = 0; i < this.contributors.length; i++) {
					if (dir.contributor.name === this.contributors[i].name) {
						this.contributors.splice(i, 1);
						break;
					}
				}
			}
			let contributorInd = null;
			for (let i = 0; i < this.contributors.length; i++) {
				if (this.contributors[i].name === this.updates[this.updateIndex].name) {
					contributorInd = i;
					break;
				}
			}
			if (contributorInd === null) {
				contributorInd = this.contributors.length;
				let color;
				if (this.contributorColors.has(this.updates[this.updateIndex].name)) {
					color = this.contributorColors.get(this.updates[this.updateIndex].name);
				} else {
					color = this.randomColor();
					this.contributorColors.set(this.updates[this.updateIndex].name, color)
				}
				this.contributors.push(new GitContributor(this.updates[this.updateIndex].name, color));
				this.newVertices++;
			}
			this.currentContributor = this.contributors[contributorInd];
			if (this.currentContributor.dir) {
				this.currentContributor.dir.contributor = null;
			}
			this.currentContributor.dir = dir;
			this.currentContributor.level = dir.level;
			dir.contributor = this.currentContributor;
			const updateFiles = this.updates[this.updateIndex].updates;
			let haveDelete = false;
			for (let i = 0; i < updateFiles.length; i++) {
				if (updateFiles[i].action === 0) {
					updateFiles[i].vertexSet = this.addElement(dir, updateFiles[i].file, updateFiles[i].isDir, dir.path.length);
					this.newVertices += updateFiles[i].vertexSet.length;
				} else if (updateFiles[i].action === 1) {
					const p = this.findDir(dir, updateFiles[i].file, dir.path.length);
					updateFiles[i].vertexSet = [p];
				} else if (updateFiles[i].action === 2) {
					if (!haveDelete) {
						this.updates[this.updateIndex].duration /= 2;
						this.updates[this.updateIndex].expireDate -= this.updates[this.updateIndex].duration;
						this.updates.splice(this.updateIndex + 1, 0,
							new UpdateData('', [],
								this.updates[this.updateIndex].expireDate,
								this.updates[this.updateIndex].duration,
								[]));
						haveDelete = true;
					}
					updateFiles[i].vertexSet = this.removeElement(dir, updateFiles[i].file, dir.path.length);
				}
			}
			this.currentContributor.updates = updateFiles;
		}
	};
	finishUpdate = () => {
		for (let i = 0; i < this.contributors.length; i++) {
			this.contributors[i].resetTransparencySpeed(this.colors);
			this.contributors[i].resetRemoveSpeed(this.colors);
			this.contributors[i].resetAcceleration(this.coords, this.colors);
		}
		for (let i = 0; i < this.movingVertices.length; i++) {
			this.movingVertices[i].resetTransparencySpeed(this.colors);
			this.movingVertices[i].resetRemoveSpeed(this.colors);
			this.movingVertices[i].resetAcceleration(this.coords, this.colors);
		}
		if (this.updates[this.updateIndex].name !== '') {
			const updateFiles = this.updates[this.updateIndex].updates;
			for (let i = 0; i < updateFiles.length; i++) {
				if (updateFiles[i].action === 2) {
					for (let j = 0; j < updateFiles[i].vertexSet.length; j++) {
						if (updateFiles[i].vertexSet[j].parent) {
							this.removeVertexFromBuffer(updateFiles[i].vertexSet[j]);
							updateFiles[i].vertexSet[j].parent.removeChild(updateFiles[i].vertexSet[j]);
							const newV = this.heightMap.get(updateFiles[i].vertexSet[j].level + 1) - 1;
							this.heightMap.set(updateFiles[i].vertexSet[j].level + 1, newV);
						}
					}
				}
			}
			this.calcHeight();
		}
		this.currentContributor = null;
		this.edgeCoords = [];
		this.edgeColors = [];
		this.operating = false;
	};
	iterate = (delta) => {
		if (this.updateIndex < this.updates.length) {
			if (this.now < this.updates[this.updateIndex].startDate && this.now + delta >= this.updates[this.updateIndex].startDate) {
				this.startUpdate();
				this.splitSpace(this.updates[this.updateIndex].duration);
				this.buildCoords(Math.min(this.now + delta - this.updates[this.updateIndex].startDate,
					this.updates[this.updateIndex].expireDate - this.updates[this.updateIndex].startDate));
			} else {
				this.buildCoords(Math.min(this.now + delta - this.updates[this.updateIndex].startDate,
					this.updates[this.updateIndex].expireDate - this.updates[this.updateIndex].startDate));  // from operation start
			}
			if (this.now + delta >= this.updates[this.updateIndex].expireDate) {
				this.finishUpdate();
				this.updateIndex++;
				this.iterate(delta);
				return;
			}
			this.now += delta;
		} else {
			this.currentContributor = null;
			this.edgeCoords = [];
			this.edgeColors = [];
		}
	};
	isEnd = () => {
		return this.updateIndex === this.updates.length
	};
	checkSkip = () => {
		if (this.updateIndex > 0 && this.updateIndex < this.updates.length) {
			if (this.now > this.updates[this.updateIndex - 1].expireDate) {
				return this.updates[this.updateIndex].startDate - this.now;
			}
		}
		return 0;
	};
	findDir = (parent, path, pathInd) => {
		if (parent.children.length === 0) {
			return parent;
		}
		let l = 0, r = parent.children.length;
		let m = Math.floor(r / 2);
		while (l < r - 1) {
			if (parent.children[m].path[pathInd] === path[pathInd]) {
				break;
			} else if (path[pathInd] < parent.children[m].path[pathInd]) {
				r = m;
			} else {
				l = m;
			}
			m = Math.floor((r + l) / 2);
		}
		if (parent.children[m].path[pathInd] === path[pathInd]) {
			return this.findDir(parent.children[m], path, pathInd + 1);
		} else {
			return parent;
		}
	};
	addElement = (parent, path, isDir, pathInd) => {
		const res = [];
		let p = this.findDir(parent, path, pathInd);
		for (let i = p.path.length; i < path.length - 1; i++) {
			const child = new GitObject(path.slice(0, i + 1), true, p.level + 1, p);
			if (this.heightMap.has(p.level + 2)) {
				const newV = this.heightMap.get(p.level + 2) + 1;
				this.heightMap.set(p.level + 2, newV);
			} else {
				this.heightMap.set(p.level + 2, 1);
			}
			p.addChild(child);
			res.push(child);
			p = child;
		}
		const lastChild = new GitObject(path, isDir, p.level + 1, p);
		p.addChild(lastChild);
		res.push(lastChild);
		if (this.heightMap.has(p.level + 2)) {
			const newV = this.heightMap.get(p.level + 2) + 1;
			this.heightMap.set(p.level + 2, newV);
		} else {
			this.heightMap.set(p.level + 2, 1);
		}
		this.calcHeight();
		return res;
	};
	removeElement = (parent, path, pathInd) => {
		const res = [];
		parent = this.findDir(parent, path, pathInd);
		if (parent.path.length !== path.length) {
			return res;
		}
		res.push(parent);
		parent.removing = true;
		const stack = [parent];
		while (stack.length !== 0) {
			const vertex = stack.pop();
			for (let i = 0; i < vertex.children.length; i++) {
				if (vertex.children[i].children.length !== 0) {
					stack.push(vertex.children[i]);
				}
				vertex.children[i].removing = true;
				res.push(vertex.children[i]);
			}
		}
		return res;
	};
	splitSpace = (duration) => {
		this.root.boundRect = new Rect3D(-GRAPH_WIDTH / 2, -GRAPH_DEPTH / 2, GRAPH_WIDTH, GRAPH_DEPTH);
		this.edgeIndices = [];
		this.orderedVertices = [];
		this.movingVertices = [];
		let skip = (this.root.size + this.contributors.length - this.newVertices) * (VERTEX_SIZE + SKIP_COORDS);
		const stack = [[[this.root], this.root.boundRect, null]];
		while (stack.length !== 0) {
			const vertexSet = stack.pop();
			if (vertexSet[0].length === 1) {
				if (vertexSet[0][0].haveContributor()) {
					const rectSplitted = vertexSet[1].split(0.5);
					if (vertexSet[0][0].contributor.skip === null) {
						this.addVertexToBuffer(vertexSet[0][0].contributor, vertexSet[0][0].level, rectSplitted[1], skip);
						skip += VERTEX_SIZE + SKIP_COORDS;
					} else {
						const newR = this.calcRadius(vertexSet[0][0].level + 1, rectSplitted[1]);
						if (newR !== vertexSet[0][0].contributor.radius) {
							vertexSet[0][0].contributor.buildSphere(this.height, newR, this.coords, this.colors);
						}
						vertexSet[0][0].contributor.calcAcceleration(this.height, rectSplitted[1], duration);
					}
					if (vertexSet[0][0].skip === null) {
						this.addVertexToBuffer(vertexSet[0][0], vertexSet[0][0].level, rectSplitted[0], skip);
						skip += VERTEX_SIZE + SKIP_COORDS;
						vertexSet[0][0].calcTransparencySpeed(this.height, duration);
					} else {
						const newR = this.calcRadius(vertexSet[0][0].level + 1, rectSplitted[0]);
						if (newR !== vertexSet[0][0].radius) {
							vertexSet[0][0].buildSphere(this.height, newR, this.coords, this.colors);
						}
						if (vertexSet[0][0].removing) {
							vertexSet[0][0].calcRemoveSpeed(this.height, duration);
						}
						vertexSet[0][0].calcAcceleration(this.height, rectSplitted[0], duration);
					}
					if (vertexSet[0][0].contributor.isMoving()) {
						this.movingVertices.push(vertexSet[0][0].contributor);
					}
					this.orderedVertices.push(vertexSet[0][0].contributor);
				} else {
					if (vertexSet[0][0].skip === null) {
						this.addVertexToBuffer(vertexSet[0][0], vertexSet[0][0].level, vertexSet[1], skip);
						skip += VERTEX_SIZE + SKIP_COORDS;
						vertexSet[0][0].calcTransparencySpeed(this.height, duration);
					} else {
						const newR = this.calcRadius(vertexSet[0][0].level + 1, vertexSet[1]);
						if (newR !== vertexSet[0][0].radius) {
							vertexSet[0][0].buildSphere(this.height, newR, this.coords, this.colors);
						}
						if (vertexSet[0][0].removing) {
							vertexSet[0][0].calcRemoveSpeed(this.height, duration);
						}
						vertexSet[0][0].calcAcceleration(this.height, vertexSet[1], duration);
					}
				}
				if (vertexSet[0][0].children.length !== 0) {
					stack.push([vertexSet[0][0].children.slice(), vertexSet[1], vertexSet[0][0]]);
				}
				if (vertexSet[2] !== null) {
					this.edgeIndices.push(vertexSet[0][0].skip + VERTEX_SIZE, vertexSet[2].skip + VERTEX_SIZE);
				}
				if (vertexSet[0][0].isMoving()) {
					this.movingVertices.push(vertexSet[0][0]);
				}
				this.orderedVertices.push(vertexSet[0][0]);
			} else {
				let firstSet = 0, firstInd = 0;
				const fullSize = vertexSet[0].reduce((res, current) => res + current.size, 0);
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
						stack.push([firstSet, rectSplitted[1], vertexSet[2]], [vertexSet[0], rectSplitted[0], vertexSet[2]]);
						break
					}
				}
			}
		}
	};
	buildIndices = (skip) => {
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
	addVertexToBuffer = (vertex, level, rect, skip) => {
		vertex.boundRect = rect;
		vertex.skip = skip;
		vertex.buildSphere(this.height, this.calcRadius(level + 1, rect), this.coords, this.colors);
		this.buildIndices(vertex.skip);
		this.normals = this.normals.concat(this.sphereNormal);
		this.skipMap.set(vertex.skip, vertex);
	};
	removeVertexFromBuffer = (vertex) => {
		const last = (this.root.size + this.contributors.length - 1) * (VERTEX_SIZE + SKIP_COORDS);
		if (last !== vertex.skip) {
			const lastVertex = this.skipMap.get(last);
			for (let i = 0; i < VERTEX_SIZE + SKIP_COORDS; i++) {
				this.coords[(vertex.skip + i) * 4] = this.coords[(last + i) * 4];
				this.coords[(vertex.skip + i) * 4 + 1] = this.coords[(last + i) * 4 + 1];
				this.coords[(vertex.skip + i) * 4 + 2] = this.coords[(last + i) * 4 + 2];
				this.colors[(vertex.skip + i) * 4] = this.colors[(last + i) * 4];
				this.colors[(vertex.skip + i) * 4 + 1] = this.colors[(last + i) * 4 + 1];
				this.colors[(vertex.skip + i) * 4 + 2] = this.colors[(last + i) * 4 + 2];
			}
			lastVertex.skip = vertex.skip;
			this.skipMap.set(lastVertex.skip, lastVertex);
		}
		this.coords.splice(last * 4, (VERTEX_SIZE + SKIP_COORDS) * 4);
		this.colors.splice(last * 4, (VERTEX_SIZE + SKIP_COORDS) * 4);
		this.normals.splice(last * 4, (VERTEX_SIZE + SKIP_COORDS) * 3);
		this.indices.splice((this.root.size + this.contributors.length - 1) * (INDEX_SIZE * 3), INDEX_SIZE * 3);
	};
	buildCoords = (delta) => {
		if (this.operating && delta > 0) {
			for (let i = 0; i < this.movingVertices.length; i++) {
				this.movingVertices[i].move(this.coords, this.colors, delta);
			}
			if (this.currentContributor) {
				this.currentContributor.buildEdges(this.coords);
				this.edgeCoords = this.currentContributor.edgeCoords;
				this.edgeColors = this.currentContributor.edgeColors;
				this.edgeNormals = this.currentContributor.edgeNormals;
			}
		}
	};
	calcHeight = () => {
		let maxHeight = 1;
		this.heightMap.forEach((v, k) => {
			if (v !== 0 && k > maxHeight) {
				maxHeight = k;
			}
		});
		this.height = maxHeight;
	};
	calcRadius = (level, rect) => {
		const minRect = Math.min(rect.width / 2, rect.height / 2, GRAPH_HEIGHT / (4 * this.height));
		const value = this.heightMap.get(level);
		if (value < 30) {
			return Math.min(0.06, minRect);
		} else if (value < 100) {
			return Math.min(0.05, minRect);
		} else if (value < 200) {
			return Math.min(0.04, minRect);
		} else if (value < 400) {
			return Math.min(0.03, minRect);
		} else if (value < 800) {
			return Math.min(0.025, minRect);
		} else {
			return Math.min(0.02, minRect);
		}
	};
	getName = (x, y, model, view) => {
		const resVertices = [];
		const modelView = glMatrix.mat4.create();
		glMatrix.mat4.multiply(modelView, view, model);
		for (let i = 0; i < this.orderedVertices.length; i++) {
			let centerCoords = this.coords.slice((this.orderedVertices[i].skip + 1) * 4 - 4, (this.orderedVertices[i].skip + 1) * 4);
			let center = glMatrix.vec4.fromValues(centerCoords[0], centerCoords[1], centerCoords[2], centerCoords[3]);
			glMatrix.vec4.transformMat4(center, center, modelView);
			const deltaX = center[0] - x;
			const deltaY = center[1] - y;
			const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			if (dist < this.orderedVertices[i].radius) {
				if (this.orderedVertices[i].path) {
					resVertices.push([center, '/' + this.orderedVertices[i].path.join('/')]);
				} else {
					resVertices.push([center, this.orderedVertices[i].name]);
				}
			}
		}
		resVertices.sort((a, b) => {
			return a[0][2] < b[0][2] ? -1 : a[0][2] === b[0][2] ? 0 : 1
		});
		if (resVertices.length > 0) {
			return resVertices[0][1];
		} else {
			return null;
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

	get normals() {
		return this.normals;
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
}