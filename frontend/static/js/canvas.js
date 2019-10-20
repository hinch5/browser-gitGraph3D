class Canvas {
	canvas;
	GL;
	vertexBuffer;
	colorBuffer;
	modelUniform;
	viewUniform;
	shaderProgram;

	constructor() {
		this.canvas = document.getElementById('graph');
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
			this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
		}
		const p = new Program(this.GL, 'vertex-shader', 'fragment-shader');
		// this.initShaders('vertex-shader', 'fragment-shader');
		this.initBuffers();
	}

	draw = (model, view) => {
		this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
		this.modelUniform = this.GL.getUniformLocation(this.shaderProgram, 'model');
		this.viewUniform = this.GL.getUniformLocation(this.shaderProgram, 'view');
		this.GL.uniformMatrix4fv(this.modelUniform, false, model);
		this.GL.uniformMatrix4fv(this.viewUniform, false, view);
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.vertexBuffer);
		this.GL.vertexAttribPointer(this.vertexAttrib, 4, this.GL.FLOAT, true, 0, 0);
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.colorBuffer);
		this.GL.vertexAttribPointer(this.colorAttrib, 4, this.GL.FLOAT, true, 0, 0);
		this.GL.drawArrays(this.GL.TRIANGLES, 0, 3);
	};
	
	initShaders = (vertex, fragment) => {
		let fragmentShader = this.getShader(this.GL, fragment);
		let vertexShader = this.getShader(this.GL, vertex);
		
		let shaderProgram = this.GL.createProgram();
		this.GL.attachShader(shaderProgram, vertexShader);
		this.GL.attachShader(shaderProgram, fragmentShader);
		this.GL.linkProgram(shaderProgram);
		
		if (!this.GL.getProgramParameter(shaderProgram, this.GL.LINK_STATUS)) {
			alert("Unable to initialize the shader program.");
		}

		this.GL.useProgram(shaderProgram);

		this.vertexAttrib = this.GL.getAttribLocation(shaderProgram, "position");
		this.GL.enableVertexAttribArray(this.vertexAttrib);
		this.colorAttrib = this.GL.getAttribLocation(shaderProgram, "color");
		this.GL.enableVertexAttribArray(this.colorAttrib);
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
		const vertices = [
			0.5, 0.5, 0.5, 1.0,
			-0.5, 0.5, 0.5, 1.0,
			0.5, 0, 0.5, 1.0
		];
		const colors = [
			1.0, 0, 0, 1.0,
			0, 1.0, 0, 1.0,
			0, 0, 1.0, 1.0
		];
		this.vertexBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.vertexBuffer);
		this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(vertices), this.GL.STATIC_DRAW);

		this.colorBuffer = this.GL.createBuffer();
		this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.colorBuffer);
		this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(colors), this.GL.STATIC_DRAW);
	};
	resize = () => {
		this.canvas.width = this.canvas.parentNode.getBoundingClientRect().width;
		this.canvas.height = this.canvas.parentNode.getBoundingClientRect().height;
		if (this.GL) {
			this.GL.viewport(0, 0, this.canvas.width, this.canvas.height);
		}
	};
}
