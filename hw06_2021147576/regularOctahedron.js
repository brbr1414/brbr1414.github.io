export class Octahedron {
    constructor(gl) {
        this.gl = gl;
        this.vertices = new Float32Array([
            // x, z, y, 0,0,1 (normal), 1,1,1,1 (color), u, v
            // top 4 faces
            0, 1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 1.0,
            0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.5,
            0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.0,
            0, 1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 1.0,
            0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.0,
            -0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.0,
            0, 1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 1.0,
            -0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.0,
            -0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.5,
            0, 1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 1.0,
            -0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.5,
            0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.5,
            // bottom 4 faces
            0, -1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 0.0,
            0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.0,
            0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.5,
            0, -1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 0.0,
            -0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.0,
            0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.0,
            0, -1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 0.0,
            -0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.5,
            -0.5, 0, -0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.0,
            0, -1 / Math.sqrt(2), 0, 0, 0, 1, 1, 1, 1, 1, 0.5, 0.0,
            0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 1.0, 0.5,
            -0.5, 0, 0.5, 0, 0, 1, 1, 1, 1, 1, 0.0, 0.5,
        ]);

        //combine vao
        this.vao = this.gl.createVertexArray();
        this.vbo = this.gl.createBuffer();

        //bind datas with buffer
        this.gl.bindVertexArray(this.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);

        const aPosition = 0;
        const aNormal = 1;
        const aColor = 2;
        const aTexCoord = 3;
        const stride = 12 * 4; // 12 floats per vertex, 4 bytes each

        // set position attribute
        this.gl.enableVertexAttribArray(aPosition);
        this.gl.vertexAttribPointer(aPosition, 3, this.gl.FLOAT, false, stride, 0);

        // set normal attribute
        this.gl.enableVertexAttribArray(aNormal);
        this.gl.vertexAttribPointer(aNormal, 3, this.gl.FLOAT, false, stride, 3 * 4);

        // set color attribute
        this.gl.enableVertexAttribArray(aColor);
        this.gl.vertexAttribPointer(aColor, 4, this.gl.FLOAT, false, stride, 6 * 4);

        // set texture coordinate attribute
        this.gl.enableVertexAttribArray(aTexCoord);
        this.gl.vertexAttribPointer(aTexCoord, 2, this.gl.FLOAT, false, stride, 10 * 4);

        //unbind
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);
    }

    draw(shader) {
        shader.use();
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 12);
        this.gl.bindVertexArray(null);
    }
}
