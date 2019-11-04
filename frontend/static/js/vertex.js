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
	indices;
	colors;
	color;
	skip;
	level;
	constructor(level) {
		this.level = level;
	}
	buildSphere = (height, skip) => {
		this.coords = [];
		this.indices = [];
		this.colors = [];
		this.color = [0.0, 1.0, 0.0, 1.0];
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
				this.colors.push(this.color[0], this.color[1], this.color[2], this.color[3]);
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
		this.colors.push(this.color[0], this.color[1], this.color[2], this.color[3])
	};

	set boundRect(rect) {
		this.boundRect = rect;
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
}