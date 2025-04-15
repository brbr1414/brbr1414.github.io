export class Pyramid {
    constructor(gl) {
        this.gl = gl;
        this.initBuffers();
    }

    initBuffers() {
        const vertices = new Float32Array([
            // Base (4 vertices)
            -0.5, 0.0, -0.5,  // 0
            0.5, 0.0, -0.5,  // 1
            0.5, 0.0, 0.5,  // 2
            -0.5, 0.0, 0.5,  // 3

            // Side 1 (red)
            -0.5, 0.0, -0.5,  // 4
            0.5, 0.0, -0.5,  // 5
            0.0, 1.0, 0.0,  // 6

            // Side 2 (green)
            0.5, 0.0, -0.5,  // 7
            0.5, 0.0, 0.5,  // 8
            0.0, 1.0, 0.0,  // 9

            // Side 3 (blue)
            0.5, 0.0, 0.5,  // 10
            -0.5, 0.0, 0.5,  // 11
            0.0, 1.0, 0.0,  // 12

            // Side 4 (yellow)
            -0.5, 0.0, 0.5,  // 13
            -0.5, 0.0, -0.5,  // 14
            0.0, 1.0, 0.0   // 15
        ]);

        const indices = new Uint16Array([
            // Base
            0, 1, 2,
            0, 2, 3,
            // Sides
            4, 5, 6, // red
            7, 8, 9, // green
            10, 11, 12, // blue
            13, 14, 15  // yellow
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

        this.indexCount = indices.length;

        const colors = new Float32Array([
            // Base (white)
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,

            // Side 1 - red
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,

            // Side 2 - green
            0, 1, 0, 1,
            0, 1, 0, 1,
            0, 1, 0, 1,

            // Side 3 - blue
            0, 0, 1, 1,
            0, 0, 1, 1,
            0, 0, 1, 1,

            // Side 4 - yellow
            1, 1, 0, 1,
            1, 1, 0, 1,
            1, 1, 0, 1
        ]);
        this.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);
    }

    draw(shader) {
        const gl = this.gl;

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const aPosition = gl.getAttribLocation(shader.program, 'a_position');
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        // Use color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        const aColor = gl.getAttribLocation(shader.program, 'a_color');
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);

        // Index
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
}