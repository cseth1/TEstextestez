#version 300 es
precision highp float;

uniform sampler2D inputTexture;
uniform float threshold;
uniform float intensity;

in vec2 vUv;
out vec4 fragColor;

void main() {
    vec3 color = texture(inputTexture, vUv).rgb;
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    if(brightness > threshold) {
        fragColor = vec4(color * intensity, 1.0);
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}