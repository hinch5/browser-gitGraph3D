class Canvas {
	graph;
	canvas;
	textCanvas;
	GL;
	vertexBuffer;
	indexBuffer;
	colorBuffer;
	normalBuffer;
	indexBufferEdges;
	modelUniform;
	viewUniform;
	normalModelUniform;
	shaderProgram;
	vertexAttrib;
	colorAttrib;
	normalAttrib;

	constructor(graph) {
		this.graph = graph;
		this.canvas = document.getElementById('graph');
		this.textCanvas = document.getElementById('text-canvas');
		this.canvas.parentNode.addEventListener('resize', this.resize, false);
		this.resize();
		this.GL = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
		if (!this.GL) {
			alert('init gl fail');
		}
		if (this.GL) {
			this.GL.clearColor(0.09, 0.09, 0.09, 1.0);
			this.GL.enable(this.GL.DEPTH_TEST);
			this.GL.depthFunc(this.GL.LEQUAL);
			this.GL.enable(this.GL.BLEND);
			this.GL.blendFunc(this.GL.SRC_ALPHA, this.GL.ONE_MINUS_SRC_ALPHA);
			this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
		}
		this.initShaders('vertex-shader', 'fragment-shader');
		this.initBuffers();
	}

	draw = (model, view, normalModel, delta) => {
		this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
		this.modelUniform = this.GL.getUniformLocation(this.shaderProgram, 'model');
		this.viewUniform = this.GL.getUniformLocation(this.shaderProgram, 'view');
		this.normalModelUniform = this.GL.getUniformLocation(this.shaderProgram, 'normalModel');
		this.GL.uniformMatrix4fv(this.modelUniform, false, model);
		this.GL.uniformMatrix4fv(this.viewUniform, false, view);
		this.GL.uniformMatrix4fv(this.normalModelUniform, false, normalModel);
		
		this.graph.iterate(delta);
		this.initBuffers();
		
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.vertexBuffer);
		this.GL.vertexAttribPointer(this.vertexAttrib, 4, this.GL.FLOAT, true, 0, 0);
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.colorBuffer);
		this.GL.vertexAttribPointer(this.colorAttrib, 4, this.GL.FLOAT, true, 0, 0);
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.normalBuffer);
		this.GL.vertexAttribPointer(this.normalAttrib, 3, this.GL.FLOAT, true, 0, 0);
		this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		this.GL.drawElements(this.GL.TRIANGLES, this.graph.indices.length, this.GL.UNSIGNED_SHORT, 0);

		this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.indexBufferEdges);
		this.GL.drawElements(this.GL.LINES, this.graph.edgeIndices.length, this.GL.UNSIGNED_SHORT, 0);
		
		this.GL.drawArrays(this.GL.LINES, this.graph.coords.length/4, this.graph.edgeCoords.length/4);
	};

	initShaders = (vertex, fragment) => {
		let fragmentShader = this.getShader(this.GL, fragment);
		let vertexShader = this.getShader(this.GL, vertex);

		this.shaderProgram = this.GL.createProgram();
		this.GL.attachShader(this.shaderProgram, vertexShader);
		this.GL.attachShader(this.shaderProgram, fragmentShader);
		this.GL.linkProgram(this.shaderProgram);

		if (!this.GL.getProgramParameter(this.shaderProgram, this.GL.LINK_STATUS)) {
			alert("Unable to initialize the shader program.");
		}

		this.GL.useProgram(this.shaderProgram);

		this.vertexAttrib = this.GL.getAttribLocation(this.shaderProgram, "position");
		this.GL.enableVertexAttribArray(this.vertexAttrib);
		this.colorAttrib = this.GL.getAttribLocation(this.shaderProgram, "color");
		this.GL.enableVertexAttribArray(this.colorAttrib);
		this.normalAttrib = this.GL.getAttribLocation(this.shaderProgram, "normal");
		this.GL.enableVertexAttribArray(this.normalAttrib);
	};
	getShader = (gl, id) => {
		let shaderScript, theSource, currentChild, shader;

		shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return null;
		}
		theSource = '';
		currentChild = shaderScript.firstChild;

		while (currentChild) {
			if (currentChild.nodeType === currentChild.TEXT_NODE) {
				theSource += currentChild.textContent;
			}
			currentChild = currentChild.nextSibling;
		}
		if (shaderScript.type === 'x-shader/x-fragment') {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type === 'x-shader/x-vertex') {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}
		gl.shaderSource(shader, theSource);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	};
	initBuffers = () => {
		this.vertexBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.vertexBuffer);
		this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.graph.coords.concat(this.graph.edgeCoords)), this.GL.DYNAMIC_DRAW);

		this.indexBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.graph.indices), this.GL.DYNAMIC_DRAW);
		
		this.indexBufferEdges = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.indexBufferEdges);
		this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.graph.edgeIndices), this.GL.DYNAMIC_DRAW);

		this.colorBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.colorBuffer);
		this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.graph.colors.concat(this.graph.edgeColors)), this.GL.DYNAMIC_DRAW);
		
		this.normalBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.normalBuffer);
		this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.graph.normals.concat(this.graph.edgeNormals)), this.GL.DYNAMIC_DRAW);
	};
	resize = () => {
		this.canvas.width = this.canvas.parentNode.getBoundingClientRect().width;
		this.canvas.height = this.canvas.parentNode.getBoundingClientRect().height;
		this.textCanvas.width = this.canvas.parentNode.getBoundingClientRect().width;
		this.textCanvas.height = this.canvas.parentNode.getBoundingClientRect().height;
		if (this.GL) {
			this.GL.viewport(0, 0, this.canvas.width, this.canvas.height);
		}
	};
	writeDate = (date) => {
		const w = this.textCanvas.width;
		const d = new Date(date);
		const dateString = d.toISOString();
		const ctx = this.textCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
		ctx.fillStyle = '#FF0000';
		ctx.font = '16px serif';
		const textWidth = ctx.measureText(dateString).width;
		const pos = (w / 2) - (textWidth / 2);
		ctx.fillText(dateString, pos, 16);
	};
	get width(){
		return this.canvas.width;
	}
	get height() {
		return this.canvas.height;
	}
}
