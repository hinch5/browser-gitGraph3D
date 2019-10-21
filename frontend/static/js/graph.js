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
}

class GitObject {
	isDir;
	children;
	size;
	level;
	parent;
	boundRect;
	path;
	coords;
	indices;
	colors;

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
		for (let p = this; p.parent !== null; p = p.parent) {
			p.addSize(child.size);
		}
	};
	addSize = (a) => {
		this.size += a;
	};
	buildSphere = (height, skip) => {
		this.coords = [];
		this.indices = [];
		this.colors = [];
		let x, y, z, xy;
		const sectorStep = 2 * Math.PI / SPHERE_SECTOR_COUNT, stackStep = 2 * Math.PI / SPHERE_STACK_COUNT;
		for (let i = 0; i < SPHERE_STACK_COUNT; i++) {
			const stackAngle = Math.PI / 2 - i * stackStep;
			xy = SPHERE_RADIUS * Math.cos(stackAngle);
			z = this.boundRect.centerY + SPHERE_RADIUS * Math.sin(stackAngle);
			for (let j = 0; j < SPHERE_SECTOR_COUNT; j++) {
				const sectorAngle = j * sectorStep;

				x = this.boundRect.centerX + xy * Math.cos(sectorAngle);
				y = 1/(height*2) + xy * Math.sin(sectorAngle);

				this.coords.push(x, y, z, 1.0);
				this.colors.push(0.0, 1.0, 0.0, 1.0);
			}
		}
		for (let i = 0; i < SPHERE_STACK_COUNT; i++) {
			let k1 = i * (SPHERE_SECTOR_COUNT + 1);
			let k2 = k1 + SPHERE_SECTOR_COUNT + 1;
			for (let j = 0; j < SPHERE_SECTOR_COUNT; j++) {
				if (i !== 0) {
					this.indices.push(skip + k1, skip + k2, skip + k1 + 1);
				}
				if (i !== (SPHERE_STACK_COUNT - 1)) {
					this.indices.push(skip + k1 + 1, skip + k2, skip + k2 + 1);
				}
			}
		}
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
}

class GitUpdate {

}

class Graph {
	height;
	coords;
	indices;
	colors;
	root;

	constructor() {
		this.root = new GitObject([], true, 0, null);
		this.root.boundRect = new Rect3D(-0.5, -0.5, 1.0, 1.0);
		this.height = 1;
		this.coords = [];
		this.indices = [];
		this.addElement(new GitObject(['sosat', 'huy', 'sosi.json'], false));
		this.addElement(new GitObject(['zhizn'], true));
		this.addElement(new GitObject(['zhizn', 'voram.json'], false));
		this.addElement(new GitObject(['zhizn', 'huy musoram.yml'], false));
		this.splitSpace();
	};

	addElement = (element) => {
		this.tryAddElement(this.root, this.root.children, element, 0);
	};
	tryAddElement = (parent, element, pathInd) => {
		for (const v in parent.children) {
			if (v.path[0] === element[pathInd]) {
				if (!v.isDir) {
					console.log('smert not folder');
				}
				if (pathInd + 1 !== element.path.length - 1) {
					this.tryAddElement(v, element, pathInd + 1);
				} else {
					console.log('smert');
				}
				return;
			}
		}
		let p = parent;
		for (let i = pathInd; i < element.path.length+1; i++) {
			const child = new GitObject(element.path.slice(0, i+1), true, p.level+1, p);
			p.addChild(child);
			p = child;
		}
		p.addChild(new GitObject(element.path, element.isDir, p.level+1, p));
	};
	splitSpace = () => {
		const stack = [[[this.root], this.root.boundRect]];
		while (stack.length !== 0) {
			const vertexSet = stack.pop();
			if (vertexSet[0].length === 1) {
				vertexSet[0][0].boundRect = vertexSet[1];
				stack.push([vertexSet[0][0].children, vertexSet[1]]);
			} else {
				let fullSize = 0, firstSet = 0, firstInd = 0;
				for (const v in vertexSet[0]) {
					fullSize += v.size;
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
		let skip = 0;
		const stack = [[this.root]];
		while (stack.length !== 0) {
			const vertexSet = stack.pop();
			for (const v in vertexSet) {
				v.buildSphere();
				this.coords.concat(v.coords);
				this.indices.concat(v.indices);
				this.colors.concat(v.colors);
				skip += SPHERE_STACK_COUNT*SPHERE_SECTOR_COUNT;
				if (v.children.length !== 0) {
					stack.push(v.children);
				}
			}
		}
	};
	get coords() {
		return this.coords;
	}
	get indices() {
		return this.indices;
	}
	get colors() {
		return this.colors;
	}
}