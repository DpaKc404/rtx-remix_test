#version 460

// --- Vertex Input ---
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inUV;
layout(location = 2) in vec3 inNormal;
layout(location = 3) in vec3 inTangent;
layout(location = 4) in vec3 inBitangent;

// --- Uniforms ---
layout(binding = 0) uniform CameraData {
    mat4 viewProj;
    vec3 cameraPos;
} camera;

layout(push_constant) uniform PushConstants {
    mat4 modelMatrix;
} pushConstants;

// --- Outputs to Fragment Shader ---
layout(location = 0) out vec3 outWorldPos;
layout(location = 1) out vec2 outUV;
layout(location = 2) out vec3 outNormal;
layout(location = 3) out vec3 outTangent;
layout(location = 4) out vec3 outBitangent;

void main() {
    // Calculate world space position
    vec4 worldPos = pushConstants.modelMatrix * vec4(inPosition, 1.0);
    outWorldPos = worldPos.xyz;

    // Pass UV coordinates
    outUV = inUV;

    // Transform normals and tangents to world space
    mat3 normalMatrix = transpose(inverse(mat3(pushConstants.modelMatrix)));
    outNormal = normalize(normalMatrix * inNormal);
    outTangent = normalize(normalMatrix * inTangent);
    outBitangent = normalize(normalMatrix * inBitangent);

    // Final position
    gl_Position = camera.viewProj * worldPos;
}
