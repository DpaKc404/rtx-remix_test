#version 460

// --- Inputs from Vertex Shader ---
layout(location = 0) in vec3 inWorldPos;
layout(location = 1) in vec2 inUV;
layout(location = 2) in vec3 inNormal;
layout(location = 3) in vec3 inTangent;
layout(location = 4) in vec3 inBitangent;

// --- Uniforms ---
layout(binding = 0) uniform CameraData {
    mat4 viewProj;
    vec3 cameraPos;
} camera;

// Replaced Material Textures
layout(binding = 1) uniform sampler2D texAlbedo;
layout(binding = 2) uniform sampler2D texNormal;
layout(binding = 3) uniform sampler2D texORM; // R: Occlusion, G: Roughness, B: Metallic

// Simple Light structure (to be populated from D3D9 state later)
struct Light {
    vec4 position; // xyz = position, w = radius or type
    vec4 color;    // rgb = color, a = intensity
};

layout(binding = 4) uniform LightBuffer {
    Light lights[4];
    int lightCount;
} uboLights;

// --- Outputs ---
layout(location = 0) out vec4 outColor;

const float PI = 3.14159265359;

// --- PBR Functions ---

// Normal Distribution Function (GGX)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

// Geometry Function (Schlick-GGX)
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// Fresnel Equation (Schlick approximation)
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    // 1. Sample Material Textures
    vec4 albedoSample = texture(texAlbedo, inUV);
    // De-gamma albedo (sRGB to Linear)
    vec3 albedo = pow(albedoSample.rgb, vec3(2.2));
    
    vec3 orm = texture(texORM, inUV).rgb;
    float ao = orm.r;
    float roughness = orm.g;
    float metallic = orm.b;

    // 2. Normal Mapping (Tangent Space to World Space)
    vec3 normalMap = texture(texNormal, inUV).rgb * 2.0 - 1.0;
    mat3 TBN = mat3(normalize(inTangent), normalize(inBitangent), normalize(inNormal));
    vec3 N = normalize(TBN * normalMap);

    // 3. Setup PBR view vectors
    vec3 V = normalize(camera.cameraPos - inWorldPos);
    
    // Base reflectivity (F0)
    // 0.04 is a good average for non-metals (dielectrics)
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, metallic);

    // 4. Calculate Lighting
    vec3 Lo = vec3(0.0);
    
    // Hardcoded simple light for testing if buffer is empty
    vec3 lightPos = vec3(0.0, 10.0, 0.0);
    vec3 lightColor = vec3(1.0, 0.9, 0.8) * 150.0;
    
    // Per-light radiance calculation
    vec3 L = normalize(lightPos - inWorldPos);
    vec3 H = normalize(V + L);
    float distance = length(lightPos - inWorldPos);
    float attenuation = 1.0 / (distance * distance); // Inverse square falloff
    vec3 radiance = lightColor * attenuation;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    // Energy conservation: diffuse + specular cannot exceed 1.0
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    // Metals have no diffuse light
    kD *= 1.0 - metallic;

    // Add outgoing radiance for this light
    float NdotL = max(dot(N, L), 0.0);
    Lo += (kD * albedo / PI + specular) * radiance * NdotL;

    // 5. Ambient Lighting (Fallback before we implement IBL)
    vec3 ambient = vec3(0.03) * albedo * ao;
    
    vec3 color = ambient + Lo;

    // 6. HDR Tonemapping (Reinhard) and Gamma Correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));

    outColor = vec4(color, albedoSample.a);
}
