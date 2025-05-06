#version 300 es
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

/* Lighting data */
struct Material { vec3 diffuse; vec3 specular; float shininess; };
struct Light    { vec3 position; vec3 ambient; vec3 diffuse; vec3 specular; };

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;

/* 0 = Phong (fragment), 1 = Gouraud (vertex) */
uniform int u_shadingMode;

out vec3 vFragPos;
out vec3 vNormal;
out vec3 vGouraudColor;   /* used only when u_shadingMode==1 */

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    vFragPos = worldPos.xyz;
    vNormal  = mat3(transpose(inverse(u_model))) * a_normal;

    if (u_shadingMode == 1) {  // Gouraud lighting in vertex stage
        vec3 N = normalize(vNormal);
        vec3 L = normalize(light.position - vFragPos);
        float diff = max(dot(N, L), 0.0);

        vec3 V = normalize(u_viewPos - vFragPos);
        vec3 H = normalize(L + V);

        vec3 ambient  = light.ambient * material.diffuse;
        vec3 diffuse  = light.diffuse * diff * material.diffuse;

        float spec = 0.0;
        if (diff > 0.0)
            spec = pow(max(dot(N, H), 0.0), material.shininess);
        vec3 specular = light.specular * spec * material.specular;

        vGouraudColor = ambient + diffuse + specular;
    }

    gl_Position = u_projection * u_view * worldPos;
}