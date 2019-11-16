class Program {
	GL;
	vertexAttrib;
	colorAttrib;
	normalAttrib;
	shaderProgram;
	constructor(GL, vertex, fragment) {
		this.GL = GL;
		const vertexShader = this.getShader(vertex);
		const fragmentShader = this.getShader(fragment);
		this.shaderProgram = this.GL.createProgram();
		this.GL.attachShader(this.shaderProgram, vertexShader);
		this.GL.attachShader(this.shaderProgram, fragmentShader);
		this.GL.linkProgram(this.shaderProgram);

		if (!this.GL.getProgramParameter(this.shaderProgram, this.GL.LINK_STATUS)) {
			console.log('link shader program err ', this.GL.getProgramInfoLog(this.shaderProgram));
		}
	}
	
	getShader = (id) => {
		const element = document.getElementById(id);
		if (!element) {
			console.log('shader element missing: ', id);
			return null;
		}
		let source = '', shader;
		let currentChild = element.firstChild;
		while (currentChild) {
			if (currentChild.nodeType === currentChild.TEXT_NODE) {
				source += currentChild.textContent;
			}
			currentChild = currentChild.nextSibling;
		}
		if (element.type === 'x-shader/x-vertex') {
			shader = this.GL.createShader(this.GL.VERTEX_SHADER);
		} else if (element.type === 'x-shader/x-fragment') {
			shader = this.GL.createShader(this.GL.FRAGMENT_SHADER);
		} else {
			console.log('unknown shader type: ', element.type, id);
			return null;
		}
		this.GL.shaderSource(shader, source);
		this.GL.compileShader(shader);

		if (!this.GL.getShaderParameter(shader, this.GL.COMPILE_STATUS)) {
			console.log('compile shader err: ', id, this.GL.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	};
	use = (haveNormal) => {
		this.GL.useProgram(this.shaderProgram);
		this.vertexAttrib = this.GL.getAttribLocation(this.shaderProgram, "position");
		this.GL.enableVertexAttribArray(this.vertexAttrib);
		this.colorAttrib = this.GL.getAttribLocation(this.shaderProgram, "color");
		this.GL.enableVertexAttribArray(this.colorAttrib);
		if (haveNormal) {
			this.normalAttrib = this.GL.getAttribLocation(this.shaderProgram, "normal");
			this.GL.enableVertexAttribArray(this.normalAttrib);
		}
	};
	getUniformLocation = (name) => {
		return this.GL.getUniformLocation(this.shaderProgram, name);
	};
	get vertexAttrib() {
		return this.vertexAttrib;
	}
	get colorAttrib() {
		return this.colorAttrib;
	}
	get normalAttrib() {
		return this.normalAttrib;
	}

}