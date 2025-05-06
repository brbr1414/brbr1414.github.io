#version 300 es
precision highp float;
precision highp int;

in vec3 vFragPos;
in vec3 vNormal;
in vec3 vGouraudColor;

out vec4 FragColor;

struct Material { vec3 diffuse; vec3 specular; float shininess; };
struct Light    { vec3 position; vec3 ambient; vec3 diffuse; vec3 specular; };

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int  u_shadingMode;   /* 0 = Phong, 1 = Gouraud */

void main() {
    if (u_shadingMode == 1) {        // Gouraud path
        FragColor = vec4(vGouraudColor, 1.0);
        return;
    }

    /* -------- Phong shading per fragment -------- */
    vec3 N = normalize(vNormal);
    vec3 L = normalize(light.position - vFragPos);
    float diff = max(dot(N, L), 0.0);

    vec3 V = normalize(u_viewPos - vFragPos);
    vec3 H = normalize(L + V);

    float spec = 0.0;
    if (diff > 0.0)
        spec = pow(max(dot(N, H), 0.0), material.shininess);
    vec3 specular = light.specular * spec * material.specular;

    vec3 ambient  = light.ambient * material.diffuse;
    vec3 diffuse  = light.diffuse * diff * material.diffuse;

    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}