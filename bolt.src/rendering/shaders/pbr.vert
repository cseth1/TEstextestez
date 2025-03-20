#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 tangent;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;
uniform mat4 lightSpaceMatrix;

// Varyings
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUv;
out vec4 vLightSpacePos;
out mat3 vTBN;

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    vNormal = normalize((normalMatrix * vec4(normal, 0.0)).xyz);
    vUv = uv;
    
    // Calculate TBN matrix for normal mapping
    vec3 N = normalize(vNormal);
    vec3 T = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);
    T = normalize(T - dot(T, N) * N); // Gram-Schmidt orthogonalization
    vec3 B = cross(N, T) * tangent.w;
    vTBN = mat3(T, B, N);
    
    // Calculate position in light space for shadow mapping
    vLightSpacePos = lightSpaceMatrix * worldPos;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}