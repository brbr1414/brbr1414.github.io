#version 300 es

layout (location = 0) in vec3 aPos;

uniform float xChange;
uniform float yChange;

void main() {
    gl_Position = vec4(aPos[0]+xChange, aPos[1]+yChange, aPos[2], 1.0);
} 