#version 300 es
precision highp float;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D texNoise;
uniform vec3 samples[64];
uniform mat4 projection;
uniform float radius;
uniform float bias;

in vec2 vUv;
out vec4 fragColor;

const int kernelSize = 64;
const vec2 noiseScale = vec2(800.0/4.0, 600.0/4.0);

void main() {
    vec3 fragPos = texture(gPosition, vUv).xyz;
    vec3 normal = normalize(texture(gNormal, vUv).rgb);
    vec3 randomVec = normalize(texture(texNoise, vUv * noiseScale).xyz);
    
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i) {
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;
        
        vec4 offset = projection * vec4(samplePos, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;
        
        float sampleDepth = texture(gPosition, offset.xy).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }
    
    occlusion = 1.0 - (occlusion / float(kernelSize));
    fragColor = vec4(vec3(occlusion), 1.0);
}