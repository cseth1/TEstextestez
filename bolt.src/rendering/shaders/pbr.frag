#version 300 es
precision highp float;

// Material properties
uniform vec3 albedo;
uniform float metallic;
uniform float roughness;
uniform float ao;

// Textures
uniform sampler2D albedoMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D normalMap;
uniform sampler2D aoMap;
uniform sampler2D shadowMap;

// Environment
uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];
uniform vec3 cameraPos;

// Varyings
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUv;
in vec4 vLightSpacePos;
in mat3 vTBN;

out vec4 fragColor;

const float PI = 3.14159265359;

// PBR functions
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float ShadowCalculation(vec4 fragPosLightSpace) {
    // Perform perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    
    // Transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;
    
    // Get closest depth value from light's perspective
    float closestDepth = texture(shadowMap, projCoords.xy).r;
    
    // Get current depth
    float currentDepth = projCoords.z;
    
    // Check whether current frag pos is in shadow
    float bias = 0.005;
    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;

    return shadow;
}

void main() {
    // Sample textures
    vec3 albedoValue = texture(albedoMap, vUv).rgb * albedo;
    float metallicValue = texture(metallicMap, vUv).r * metallic;
    float roughnessValue = texture(roughnessMap, vUv).r * roughness;
    float aoValue = texture(aoMap, vUv).r * ao;
    
    // Normal mapping
    vec3 normal = normalize(texture(normalMap, vUv).rgb * 2.0 - 1.0);
    normal = normalize(vTBN * normal);
    
    vec3 N = normalize(normal);
    vec3 V = normalize(cameraPos - vPosition);
    
    // Calculate reflectance at normal incidence
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedoValue, metallicValue);
    
    // Reflectance equation
    vec3 Lo = vec3(0.0);
    
    for(int i = 0; i < 4; ++i) {
        vec3 L = normalize(lightPositions[i] - vPosition);
        vec3 H = normalize(V + L);
        float distance = length(lightPositions[i] - vPosition);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = lightColors[i] * attenuation;
        
        // Cook-Torrance BRDF
        float NDF = DistributionGGX(N, H, roughnessValue);   
        float G   = GeometrySmith(N, V, L, roughnessValue);      
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        vec3 numerator    = NDF * G * F; 
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallicValue;
        
        float NdotL = max(dot(N, L), 0.0);
        
        // Calculate shadows
        float shadow = ShadowCalculation(vLightSpacePos);
        
        // Add to outgoing radiance Lo
        Lo += (kD * albedoValue / PI + specular) * radiance * NdotL * (1.0 - shadow);
    }
    
    vec3 ambient = vec3(0.03) * albedoValue * aoValue;
    vec3 color = ambient + Lo;
    
    // HDR tonemapping
    color = color / (color + vec3(1.0));
    // Gamma correction
    color = pow(color, vec3(1.0/2.2)); 
    
    fragColor = vec4(color, 1.0);
}