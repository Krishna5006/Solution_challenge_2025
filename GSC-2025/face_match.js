

// const vision = require('@google-cloud/vision');
// const fs = require('fs');
// const axios = require('axios');

// const API_KEY = "AIzaSyDLS-N9oRFi0q_SmveoFvXaZcVZMPyRSWQ"; // Replace with your actual API key

// // Function to detect faces using API key authentication
// async function detectFaces(imagePath) {
//     const imageBuffer = fs.readFileSync(imagePath).toString('base64');

//     const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

//     const requestBody = {
//         requests: [
//             {
//                 image: { content: imageBuffer },
//                 features: [{ type: "FACE_DETECTION" }],
//             },
//         ],
//     };

//     try {
//         const response = await axios.post(url, requestBody);
//         const faces = response.data.responses[0].faceAnnotations;
        
//         if (!faces || faces.length === 0) {
//             console.log(`No face detected in ${imagePath}`);
//             return null;
//         }

//         console.log(`Detected ${faces.length} face(s) in ${imagePath}`);
//         return faces[0];  // Return the full face annotation, not just landmarks
//     } catch (error) {
//         console.error("Error detecting faces:", error.response ? error.response.data : error.message);
//         return null;
//     }
// }

// // Function to normalize landmarks relative to face bounding box
// function normalizeLandmarks(face) {
//     if (!face || !face.landmarks) return null;
    
//     // Get face bounding box dimensions
//     const boundingPoly = face.boundingPoly || face.fdBoundingPoly;
//     if (!boundingPoly || !boundingPoly.vertices) return null;
    
//     // Calculate face bounding box dimensions
//     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
//     boundingPoly.vertices.forEach(vertex => {
//         minX = Math.min(minX, vertex.x || 0);
//         minY = Math.min(minY, vertex.y || 0);
//         maxX = Math.max(maxX, vertex.x || 0);
//         maxY = Math.max(maxY, vertex.y || 0);
//     });
    
//     const width = maxX - minX;
//     const height = maxY - minY;
    
//     // Normalize landmarks to 0-1 range relative to face bounding box
//     return face.landmarks.map(landmark => {
//         return {
//             type: landmark.type,
//             normalizedPosition: {
//                 x: (landmark.position.x - minX) / width,
//                 y: (landmark.position.y - minY) / height,
//                 z: landmark.position.z || 0  // Z can be kept as is
//             }
//         };
//     });
// }

// // Function to compute distance between two landmarks
// function landmarkDistance(landmark1, landmark2) {
//     const x1 = landmark1.normalizedPosition.x;
//     const y1 = landmark1.normalizedPosition.y;
//     const x2 = landmark2.normalizedPosition.x;
//     const y2 = landmark2.normalizedPosition.y;
    
//     return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
// }

// // Function to compare two faces
// async function compareFaces(img1, img2) {
//     console.log("Analyzing faces...");
//     const face1 = await detectFaces(img1);
//     const face2 = await detectFaces(img2);

//     if (!face1 || !face2) {
//         console.log("Could not compare faces, one or both images have no detected faces.");
//         return;
//     }
    
//     // Normalize landmarks relative to face dimensions
//     const normalizedLandmarks1 = normalizeLandmarks(face1);
//     const normalizedLandmarks2 = normalizeLandmarks(face2);
    
//     if (!normalizedLandmarks1 || !normalizedLandmarks2) {
//         console.log("Could not normalize landmarks, missing face bounding box information.");
//         return;
//     }

//     // Compare facial landmarks by checking relative positions
//     let totalDistance = 0;
//     let landmarkCount = 0;
//     let matchingPoints = 0;
    
//     normalizedLandmarks1.forEach((landmark1, index) => {
//         // Find matching landmark type in the second face
//         const landmark2 = normalizedLandmarks2.find(l => l.type === landmark1.type);
        
//         if (landmark2) {
//             const distance = landmarkDistance(landmark1, landmark2);
//             totalDistance += distance;
//             landmarkCount++;
            
//             // Count as matching if distance is below threshold
//             if (distance < 0.1) { // 10% of face width/height
//                 matchingPoints++;
//             }
//         }
//     });
    
//     const averageDistance = totalDistance / (landmarkCount || 1);
//     const similarityScore = 1 - Math.min(averageDistance, 1);
    
//     console.log(`Number of landmarks compared: ${landmarkCount}`);
//     console.log(`Matching landmarks (within threshold): ${matchingPoints}`);
//     console.log(`Average landmark distance: ${averageDistance.toFixed(4)}`);
//     console.log(`Face similarity score: ${(similarityScore * 100).toFixed(2)}%`);
    
//     // Determine if faces likely match
//     // Similarity score above 0.7 (70%) is a good starting point
//     console.log(similarityScore > 0.7 ? 
//         "Faces are likely the same person!" : 
//         "Faces do not appear to match.");
// }

// // Provide image paths and compare faces
// compareFaces('shreyas.jpeg', 'aditya.jpeg');




// const vision = require('@google-cloud/vision');
// const fs = require('fs');
// const axios = require('axios');

// const API_KEY = "AIzaSyDLS-N9oRFi0q_SmveoFvXaZcVZMPyRSWQ"; // Replace with your actual API key


// // Function to detect faces using API key authentication
// async function detectFaces(imagePath) {
//     const imageBuffer = fs.readFileSync(imagePath).toString('base64');

//     const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

//     const requestBody = {
//         requests: [
//             {
//                 image: { content: imageBuffer },
//                 features: [{ type: "FACE_DETECTION", maxResults: 10 }],
//             },
//         ],
//     };

//     try {
//         const response = await axios.post(url, requestBody);
//         const faces = response.data.responses[0].faceAnnotations;
        
//         if (!faces || faces.length === 0) {
//             console.log(`No face detected in ${imagePath}`);
//             return null;
//         }

//         console.log(`Detected ${faces.length} face(s) in ${imagePath}`);
//         return faces[0];
//     } catch (error) {
//         console.error("Error detecting faces:", error.response ? error.response.data : error.message);
//         return null;
//     }
// }

// // Function to normalize landmarks and extract additional features
// function extractFaceFeatures(face) {
//     if (!face || !face.landmarks) return null;
    
//     // Get face bounding box dimensions
//     const boundingPoly = face.boundingPoly || face.fdBoundingPoly;
//     if (!boundingPoly || !boundingPoly.vertices) return null;
    
//     // Calculate face bounding box dimensions
//     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
//     boundingPoly.vertices.forEach(vertex => {
//         minX = Math.min(minX, vertex.x || 0);
//         minY = Math.min(minY, vertex.y || 0);
//         maxX = Math.max(maxX, vertex.x || 0);
//         maxY = Math.max(maxY, vertex.y || 0);
//     });
    
//     const width = maxX - minX;
//     const height = maxY - minY;
    
//     // Normalize landmarks to 0-1 range relative to face bounding box
//     const normalizedLandmarks = face.landmarks.map(landmark => {
//         return {
//             type: landmark.type,
//             normalizedPosition: {
//                 x: (landmark.position.x - minX) / width,
//                 y: (landmark.position.y - minY) / height,
//                 z: landmark.position.z / Math.max(width, height)  // Normalize Z relative to face size
//             }
//         };
//     });

//     // Extract additional facial features
//     const features = {
//         normalizedLandmarks,
//         faceAngle: {
//             roll: face.rollAngle || 0,
//             pan: face.panAngle || 0,
//             tilt: face.tiltAngle || 0
//         },
//         emotionLikelihood: {
//             joy: getLikelihoodScore(face.joyLikelihood),
//             sorrow: getLikelihoodScore(face.sorrowLikelihood),
//             anger: getLikelihoodScore(face.angerLikelihood),
//             surprise: getLikelihoodScore(face.surpriseLikelihood)
//         },
//         // Extract facial proportions - these tend to be more unique per person
//         proportions: calculateFacialProportions(normalizedLandmarks)
//     };
    
//     return features;
// }

// // Convert likelihood string to numeric score
// function getLikelihoodScore(likelihood) {
//     const likelihoodMap = {
//         'UNKNOWN': 0,
//         'VERY_UNLIKELY': 0.1,
//         'UNLIKELY': 0.3,
//         'POSSIBLE': 0.5,
//         'LIKELY': 0.7,
//         'VERY_LIKELY': 0.9
//     };
//     return likelihoodMap[likelihood] || 0;
// }

// // Calculate important facial proportions that help identify unique faces
// function calculateFacialProportions(landmarks) {
//     // Find specific landmarks
//     const findLandmark = (type) => landmarks.find(l => l.type === type);
    
//     const leftEye = findLandmark('LEFT_EYE');
//     const rightEye = findLandmark('RIGHT_EYE');
//     const nose = findLandmark('NOSE_TIP');
//     const mouth = findLandmark('MOUTH_CENTER');
//     const leftEar = findLandmark('LEFT_EAR_TRAGION');
//     const rightEar = findLandmark('RIGHT_EAR_TRAGION');
//     const chin = findLandmark('CHIN_GNATHION');
//     const forehead = findLandmark('FOREHEAD_GLABELLA');
    
//     const proportions = {};
    
//     // Only calculate if we have the necessary landmarks
//     if (leftEye && rightEye) {
//         // Inter-eye distance (a key biometric measure)
//         proportions.eyeDistance = landmarkDistance(leftEye, rightEye);
        
//         if (nose) {
//             // Eye to nose ratios
//             proportions.leftEyeToNose = landmarkDistance(leftEye, nose);
//             proportions.rightEyeToNose = landmarkDistance(rightEye, nose);
            
//             if (mouth) {
//                 // Nose to mouth ratio
//                 proportions.noseToMouth = landmarkDistance(nose, mouth);
                
//                 // Triangle proportions of eyes and mouth (face shape indicator)
//                 proportions.faceTriangle = (
//                     landmarkDistance(leftEye, rightEye) + 
//                     landmarkDistance(leftEye, mouth) + 
//                     landmarkDistance(rightEye, mouth)
//                 );
//             }
//         }
//     }
    
//     // Face width to height ratio
//     if (leftEar && rightEar && chin && forehead) {
//         proportions.faceWidth = landmarkDistance(leftEar, rightEar);
//         proportions.faceHeight = landmarkDistance(chin, forehead);
//         proportions.widthToHeightRatio = proportions.faceWidth / proportions.faceHeight;
//     }
    
//     return proportions;
// }

// // Function to compute distance between two landmarks
// function landmarkDistance(landmark1, landmark2) {
//     const x1 = landmark1.normalizedPosition.x;
//     const y1 = landmark1.normalizedPosition.y;
//     const z1 = landmark1.normalizedPosition.z;
//     const x2 = landmark2.normalizedPosition.x;
//     const y2 = landmark2.normalizedPosition.y;
//     const z2 = landmark2.normalizedPosition.z;
    
//     // Use 3D distance when Z is available, otherwise use 2D
//     return Math.sqrt(
//         Math.pow(x2 - x1, 2) + 
//         Math.pow(y2 - y1, 2) + 
//         Math.pow(z2 - z1, 2)
//     );
// }

// // Function to compare face features and calculate comprehensive similarity
// function calculateSimilarity(features1, features2) {
//     if (!features1 || !features2) return 0;
    
//     // Compare facial landmarks
//     let landmarkSimilarity = compareLandmarks(features1.normalizedLandmarks, features2.normalizedLandmarks);
    
//     // Compare facial proportions
//     let proportionSimilarity = compareProportions(features1.proportions, features2.proportions);
    
//     // Compare face angles (orientation should be somewhat similar for accurate comparison)
//     let angleSimilarity = compareAngles(features1.faceAngle, features2.faceAngle);
    
//     // Weighted similarity score
//     // Landmark positions and proportions are more important than angles
//     return landmarkSimilarity * 0.5 + proportionSimilarity * 0.4 + angleSimilarity * 0.1;
// }

// // Compare landmarks between two faces
// function compareLandmarks(landmarks1, landmarks2) {
//     let totalDistance = 0;
//     let landmarkCount = 0;
//     let matchingPoints = 0;
//     const threshold = 0.05; // Stricter threshold (5% of face dimensions)
    
//     landmarks1.forEach(landmark1 => {
//         // Find matching landmark type in the second face
//         const landmark2 = landmarks2.find(l => l.type === landmark1.type);
        
//         if (landmark2) {
//             const distance = landmarkDistance(landmark1, landmark2);
//             totalDistance += distance;
//             landmarkCount++;
            
//             // Count as matching if distance is below threshold
//             if (distance < threshold) {
//                 matchingPoints++;
//             }
//         }
//     });
    
//     if (landmarkCount === 0) return 0;
    
//     const averageDistance = totalDistance / landmarkCount;
//     // Convert to similarity score (0-1)
//     const rawSimilarity = 1 - Math.min(averageDistance * 2, 1); // Amplify differences
    
//     // Also consider the percentage of matching points
//     const matchPercentage = matchingPoints / landmarkCount;
    
//     // Combine both metrics
//     return (rawSimilarity * 0.7) + (matchPercentage * 0.3);
// }

// // Compare facial proportions
// function compareProportions(proportions1, proportions2) {
//     if (!proportions1 || !proportions2) return 0;
    
//     const keys = Object.keys(proportions1).filter(key => 
//         proportions1[key] !== undefined && proportions2[key] !== undefined
//     );
    
//     if (keys.length === 0) return 0;
    
//     let totalDifference = 0;
    
//     keys.forEach(key => {
//         const value1 = proportions1[key];
//         const value2 = proportions2[key];
//         const difference = Math.abs(value1 - value2) / Math.max(value1, value2, 0.0001);
//         totalDifference += Math.min(difference, 1); // Cap at 100% difference
//     });
    
//     const averageDifference = totalDifference / keys.length;
//     return 1 - averageDifference;
// }

// // Compare face angles
// function compareAngles(angles1, angles2) {
//     if (!angles1 || !angles2) return 0;
    
//     // Calculate differences in angles, normalized to 0-1 range
//     const rollDiff = Math.abs(angles1.roll - angles2.roll) / 180;
//     const panDiff = Math.abs(angles1.pan - angles2.pan) / 180;
//     const tiltDiff = Math.abs(angles1.tilt - angles2.tilt) / 180;
    
//     const averageDiff = (rollDiff + panDiff + tiltDiff) / 3;
//     return 1 - Math.min(averageDiff, 1);
// }

// // Function to compare two faces with comprehensive analysis
// async function compareFaces(img1, img2) {
//     console.log("Analyzing faces...");
//     const face1 = await detectFaces(img1);
//     const face2 = await detectFaces(img2);

//     if (!face1 || !face2) {
//         console.log("Could not compare faces, one or both images have no detected faces.");
//         return;
//     }
    
//     // Extract comprehensive features
//     const features1 = extractFaceFeatures(face1);
//     const features2 = extractFaceFeatures(face2);
    
//     if (!features1 || !features2) {
//         console.log("Could not extract face features, missing required data.");
//         return;
//     }

//     // Calculate similarity with the improved algorithm
//     const similarityScore = calculateSimilarity(features1, features2);
    
//     console.log("================== FACE COMPARISON RESULTS ==================");
//     console.log(`Face similarity: ${(similarityScore * 100).toFixed(2)}%`);
    
//     // Additional analysis data
//     const landmarkSimilarity = compareLandmarks(features1.normalizedLandmarks, features2.normalizedLandmarks);
//     const proportionSimilarity = compareProportions(features1.proportions, features2.proportions);
//     console.log(`Landmark similarity: ${(landmarkSimilarity * 100).toFixed(2)}%`);
//     console.log(`Proportion similarity: ${(proportionSimilarity * 100).toFixed(2)}%`);
    
//     // Higher threshold for more accurate results
//     // 0.85 (85%) is a good threshold for "same person" classification
//     const threshold = 0.85;
    
//     if (similarityScore >= threshold) {
//         console.log("RESULT: Faces are likely the same person.");
//     } else if (similarityScore >= 0.75) {
//         console.log("RESULT: Faces may be the same person (borderline match).");
//     } else {
//         console.log("RESULT: Faces are likely different people.");
//     }
//     console.log("===========================================================");
// }

// // Provide image paths and compare faces
// compareFaces('siddhant.jpeg', 'aditya.jpeg');


const vision = require('@google-cloud/vision');
const fs = require('fs');
const axios = require('axios');

const API_KEY = "AIzaSyDLS-N9oRFi0q_SmveoFvXaZcVZMPyRSWQ"; // Replace with your actual API key

// Function to detect faces using API key authentication
async function detectFaces(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath).toString('base64');

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

    const requestBody = {
        requests: [
            {
                image: { content: imageBuffer },
                features: [{ 
                    type: "FACE_DETECTION", 
                    maxResults: 10 
                }]
                // Removed the unsupported faceRecognitionParams
            },
        ],
    };

    try {
        const response = await axios.post(url, requestBody);
        const faces = response.data.responses[0].faceAnnotations;
        
        if (!faces || faces.length === 0) {
            console.log(`No face detected in ${imagePath}`);
            return null;
        }

        console.log(`Detected ${faces.length} face(s) in ${imagePath}`);
        return faces[0];
    } catch (error) {
        console.error("Error detecting faces:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Function to normalize landmarks and extract additional features
function extractFaceFeatures(face) {
    if (!face || !face.landmarks) return null;
    
    // Get face bounding box dimensions
    const boundingPoly = face.boundingPoly || face.fdBoundingPoly;
    if (!boundingPoly || !boundingPoly.vertices) return null;
    
    // Calculate face bounding box dimensions
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    boundingPoly.vertices.forEach(vertex => {
        minX = Math.min(minX, vertex.x || 0);
        minY = Math.min(minY, vertex.y || 0);
        maxX = Math.max(maxX, vertex.x || 0);
        maxY = Math.max(maxY, vertex.y || 0);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Normalize landmarks to 0-1 range relative to face bounding box
    const normalizedLandmarks = face.landmarks.map(landmark => {
        return {
            type: landmark.type,
            normalizedPosition: {
                x: (landmark.position.x - minX) / width,
                y: (landmark.position.y - minY) / height,
                z: landmark.position.z / Math.max(width, height)  // Normalize Z relative to face size
            }
        };
    });

    // Extract additional facial features with more detail
    const features = {
        normalizedLandmarks,
        faceAngle: {
            roll: face.rollAngle || 0,
            pan: face.panAngle || 0,
            tilt: face.tiltAngle || 0
        },
        emotionLikelihood: {
            joy: getLikelihoodScore(face.joyLikelihood),
            sorrow: getLikelihoodScore(face.sorrowLikelihood),
            anger: getLikelihoodScore(face.angerLikelihood),
            surprise: getLikelihoodScore(face.surpriseLikelihood)
        },
        // Extract detailed facial geometry
        facialGeometry: extractFacialGeometry(normalizedLandmarks),
        // Extract more precise facial proportions
        proportions: calculateFacialProportions(normalizedLandmarks),
        // Include detection confidence
        detectionConfidence: face.detectionConfidence || 0
    };
    
    return features;
}

// Extract detailed facial geometry from landmarks
function extractFacialGeometry(landmarks) {
    const findLandmark = (type) => landmarks.find(l => l.type === type);
    
    // Key facial points
    const leftEye = findLandmark('LEFT_EYE');
    const rightEye = findLandmark('RIGHT_EYE');
    const nose = findLandmark('NOSE_TIP');
    const mouth = findLandmark('MOUTH_CENTER');
    const leftEar = findLandmark('LEFT_EAR_TRAGION');
    const rightEar = findLandmark('RIGHT_EAR_TRAGION');
    const chin = findLandmark('CHIN_GNATHION');
    const forehead = findLandmark('FOREHEAD_GLABELLA');
    const leftCheek = findLandmark('LEFT_OF_LEFT_EYEBROW');
    const rightCheek = findLandmark('RIGHT_OF_RIGHT_EYEBROW');
    
    // Create facial geometry vectors
    const geometry = {};
    
    // Extract eye details
    if (leftEye && rightEye) {
        geometry.eyeLineVector = createVector(leftEye, rightEye);
        
        // Eye details
        const leftEyeLeft = findLandmark('LEFT_EYE_LEFT_CORNER');
        const leftEyeRight = findLandmark('LEFT_EYE_RIGHT_CORNER');
        const rightEyeLeft = findLandmark('RIGHT_EYE_LEFT_CORNER');
        const rightEyeRight = findLandmark('RIGHT_EYE_RIGHT_CORNER');
        
        if (leftEyeLeft && leftEyeRight) {
            geometry.leftEyeVector = createVector(leftEyeLeft, leftEyeRight);
            geometry.leftEyeSize = landmarkDistance(leftEyeLeft, leftEyeRight);
        }
        
        if (rightEyeLeft && rightEyeRight) {
            geometry.rightEyeVector = createVector(rightEyeLeft, rightEyeRight);
            geometry.rightEyeSize = landmarkDistance(rightEyeLeft, rightEyeRight);
        }
    }
    
    // Mouth shape details
    const mouthLeft = findLandmark('MOUTH_LEFT');
    const mouthRight = findLandmark('MOUTH_RIGHT');
    if (mouthLeft && mouthRight) {
        geometry.mouthVector = createVector(mouthLeft, mouthRight);
        geometry.mouthWidth = landmarkDistance(mouthLeft, mouthRight);
    }
    
    // Nose details
    const noseBottom = findLandmark('NOSE_BOTTOM_CENTER');
    if (nose && noseBottom) {
        geometry.noseVector = createVector(nose, noseBottom);
        geometry.noseLength = landmarkDistance(nose, noseBottom);
    }
    
    // Face shape
    if (leftEar && rightEar && chin && forehead) {
        geometry.faceShapeVectors = {
            width: createVector(leftEar, rightEar),
            height: createVector(chin, forehead)
        };
    }
    
    return geometry;
}

// Create a vector from two landmarks
function createVector(landmark1, landmark2) {
    return {
        x: landmark2.normalizedPosition.x - landmark1.normalizedPosition.x,
        y: landmark2.normalizedPosition.y - landmark1.normalizedPosition.y,
        z: landmark2.normalizedPosition.z - landmark1.normalizedPosition.z
    };
}

// Convert likelihood string to numeric score
function getLikelihoodScore(likelihood) {
    const likelihoodMap = {
        'UNKNOWN': 0,
        'VERY_UNLIKELY': 0.1,
        'UNLIKELY': 0.3,
        'POSSIBLE': 0.5,
        'LIKELY': 0.7,
        'VERY_LIKELY': 0.9
    };
    return likelihoodMap[likelihood] || 0;
}

// Calculate important facial proportions with more detailed metrics
function calculateFacialProportions(landmarks) {
    // Find specific landmarks
    const findLandmark = (type) => landmarks.find(l => l.type === type);
    
    const leftEye = findLandmark('LEFT_EYE');
    const rightEye = findLandmark('RIGHT_EYE');
    const nose = findLandmark('NOSE_TIP');
    const mouth = findLandmark('MOUTH_CENTER');
    const leftEar = findLandmark('LEFT_EAR_TRAGION');
    const rightEar = findLandmark('RIGHT_EAR_TRAGION');
    const chin = findLandmark('CHIN_GNATHION');
    const forehead = findLandmark('FOREHEAD_GLABELLA');
    
    const proportions = {};
    
    // Only calculate if we have the necessary landmarks
    if (leftEye && rightEye) {
        // Inter-eye distance (a key biometric measure)
        proportions.eyeDistance = landmarkDistance(leftEye, rightEye);
        
        if (nose) {
            // Eye to nose ratios
            proportions.leftEyeToNose = landmarkDistance(leftEye, nose);
            proportions.rightEyeToNose = landmarkDistance(rightEye, nose);
            
            // Eye-nose-eye angle (triangulation)
            proportions.eyeNoseEyeAngle = calculateAngle(leftEye, nose, rightEye);
            
            if (mouth) {
                // Nose to mouth ratio
                proportions.noseToMouth = landmarkDistance(nose, mouth);
                
                // Triangulation metrics
                proportions.leftEyeMouthAngle = calculateAngle(leftEye, mouth, nose);
                proportions.rightEyeMouthAngle = calculateAngle(rightEye, mouth, nose);
                
                // Face asymmetry measure
                proportions.faceAsymmetry = Math.abs(
                    proportions.leftEyeToNose - proportions.rightEyeToNose
                ) + Math.abs(
                    proportions.leftEyeMouthAngle - proportions.rightEyeMouthAngle
                );
            }
        }
    }
    
    // Face width to height ratio
    if (leftEar && rightEar && chin && forehead) {
        proportions.faceWidth = landmarkDistance(leftEar, rightEar);
        proportions.faceHeight = landmarkDistance(chin, forehead);
        proportions.widthToHeightRatio = proportions.faceWidth / proportions.faceHeight;
    }
    
    return proportions;
}

// Calculate angle between three points (in radians)
function calculateAngle(point1, point2, point3) {
    const a = {
        x: point1.normalizedPosition.x - point2.normalizedPosition.x,
        y: point1.normalizedPosition.y - point2.normalizedPosition.y,
        z: point1.normalizedPosition.z - point2.normalizedPosition.z
    };
    
    const b = {
        x: point3.normalizedPosition.x - point2.normalizedPosition.x,
        y: point3.normalizedPosition.y - point2.normalizedPosition.y,
        z: point3.normalizedPosition.z - point2.normalizedPosition.z
    };
    
    const dotProduct = a.x * b.x + a.y * b.y + a.z * b.z;
    const magA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    const magB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
    
    // Avoid division by zero
    if (magA === 0 || magB === 0) return 0;
    
    const cosTheta = dotProduct / (magA * magB);
    
    // Handle floating point errors
    if (cosTheta > 1) return 0;
    if (cosTheta < -1) return Math.PI;
    
    return Math.acos(cosTheta);
}

// Function to compute distance between two landmarks
function landmarkDistance(landmark1, landmark2) {
    const x1 = landmark1.normalizedPosition.x;
    const y1 = landmark1.normalizedPosition.y;
    const z1 = landmark1.normalizedPosition.z;
    const x2 = landmark2.normalizedPosition.x;
    const y2 = landmark2.normalizedPosition.y;
    const z2 = landmark2.normalizedPosition.z;
    
    // Use 3D distance when Z is available, otherwise use 2D
    return Math.sqrt(
        Math.pow(x2 - x1, 2) + 
        Math.pow(y2 - y1, 2) + 
        Math.pow(z2 - z1, 2)
    );
}

// Function to compare face features with improved algorithm
function calculateSimilarity(features1, features2) {
    if (!features1 || !features2) return 0;
    
    // Compare facial landmarks with more weight on unique features
    const landmarkSimilarity = compareLandmarks(features1.normalizedLandmarks, features2.normalizedLandmarks);
    
    // Compare facial proportions - highly discriminative
    const proportionSimilarity = compareProportions(features1.proportions, features2.proportions);
    
    // Compare facial geometry vectors - very important for uniqueness
    const geometrySimilarity = compareGeometry(features1.facialGeometry, features2.facialGeometry);
    
    // Compare face angles (orientation should be somewhat similar for accurate comparison)
    const angleSimilarity = compareAngles(features1.faceAngle, features2.faceAngle);
    
    // Calculate confidence modifier based on detection confidence
    const confidenceModifier = (features1.detectionConfidence + features2.detectionConfidence) / 2;
    
    // Weighted similarity score with more emphasis on geometry and proportions
    // These are more discriminative features for identifying unique faces
    const rawSimilarity = (
        landmarkSimilarity * 0.3 + 
        proportionSimilarity * 0.35 + 
        geometrySimilarity * 0.25 + 
        angleSimilarity * 0.1
    );
    
    // Apply confidence modifier
    return rawSimilarity * (0.8 + (confidenceModifier * 0.2)); // Less impact from confidence
}

// Compare geometry vectors between faces
function compareGeometry(geometry1, geometry2) {
    if (!geometry1 || !geometry2) return 0;
    
    let similarities = [];
    let weights = [];
    
    // Compare eye line vector
    if (geometry1.eyeLineVector && geometry2.eyeLineVector) {
        similarities.push(compareVectors(geometry1.eyeLineVector, geometry2.eyeLineVector));
        weights.push(0.2); // Important but common feature
    }
    
    // Compare individual eye shapes
    if (geometry1.leftEyeVector && geometry2.leftEyeVector) {
        similarities.push(compareVectors(geometry1.leftEyeVector, geometry2.leftEyeVector));
        weights.push(0.15);
    }
    
    if (geometry1.rightEyeVector && geometry2.rightEyeVector) {
        similarities.push(compareVectors(geometry1.rightEyeVector, geometry2.rightEyeVector));
        weights.push(0.15);
    }
    
    // Compare mouth shape
    if (geometry1.mouthVector && geometry2.mouthVector) {
        similarities.push(compareVectors(geometry1.mouthVector, geometry2.mouthVector));
        weights.push(0.15);
    }
    
    // Compare nose profile
    if (geometry1.noseVector && geometry2.noseVector) {
        similarities.push(compareVectors(geometry1.noseVector, geometry2.noseVector));
        weights.push(0.2);
    }
    
    // Compare overall face shape
    if (geometry1.faceShapeVectors && geometry2.faceShapeVectors) {
        similarities.push(compareVectors(
            geometry1.faceShapeVectors.width, 
            geometry2.faceShapeVectors.width
        ));
        weights.push(0.1);
        
        similarities.push(compareVectors(
            geometry1.faceShapeVectors.height, 
            geometry2.faceShapeVectors.height
        ));
        weights.push(0.05);
    }
    
    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < similarities.length; i++) {
        weightedSum += similarities[i] * weights[i];
        totalWeight += weights[i];
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Compare two vectors
function compareVectors(vec1, vec2) {
    // Normalize vectors
    const mag1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y + vec1.z * vec1.z);
    const mag2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y + vec2.z * vec2.z);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const normVec1 = {
        x: vec1.x / mag1,
        y: vec1.y / mag1,
        z: vec1.z / mag1
    };
    
    const normVec2 = {
        x: vec2.x / mag2,
        y: vec2.y / mag2,
        z: vec2.z / mag2
    };
    
    // Calculate dot product of normalized vectors
    const dotProduct = normVec1.x * normVec2.x + normVec1.y * normVec2.y + normVec1.z * normVec2.z;
    
    // Constrain to [-1, 1] to avoid floating point errors
    const constrainedDot = Math.max(-1, Math.min(1, dotProduct));
    
    // Convert to angle in radians
    const angle = Math.acos(constrainedDot);
    
    // Convert to similarity (0-1)
    // 0 radians = perfect match, PI radians = complete opposite
    return 1 - (angle / Math.PI);
}

// Compare landmarks between two faces with more emphasis on unique features
function compareLandmarks(landmarks1, landmarks2) {
    let totalDistance = 0;
    let landmarkCount = 0;
    let matchingPoints = 0;
    const threshold = 0.04; // Stricter threshold (4% of face dimensions)
    
    // Important landmarks that are more unique per person
    const keyLandmarks = [
        'LEFT_EYE_TOP_BOUNDARY', 'RIGHT_EYE_TOP_BOUNDARY',
        'LEFT_EYEBROW_UPPER_MIDPOINT', 'RIGHT_EYEBROW_UPPER_MIDPOINT',
        'NOSE_TIP', 'UPPER_LIP', 'LOWER_LIP', 'CHIN_GNATHION',
        'LEFT_EAR_TRAGION', 'RIGHT_EAR_TRAGION'
    ];
    
    landmarks1.forEach(landmark1 => {
        // Find matching landmark type in the second face
        const landmark2 = landmarks2.find(l => l.type === landmark1.type);
        
        if (landmark2) {
            const distance = landmarkDistance(landmark1, landmark2);
            
            // Apply higher weight to key landmarks
            const weight = keyLandmarks.includes(landmark1.type) ? 1.5 : 1.0;
            totalDistance += distance * weight;
            landmarkCount += weight;
            
            // Count as matching if distance is below threshold
            if (distance < threshold) {
                matchingPoints += weight;
            }
        }
    });
    
    if (landmarkCount === 0) return 0;
    
    const averageDistance = totalDistance / landmarkCount;
    // Convert to similarity score (0-1)
    const rawSimilarity = 1 - Math.min(averageDistance * 2.5, 1); // Amplify differences more
    
    // Also consider the percentage of matching points
    const matchPercentage = matchingPoints / landmarkCount;
    
    // Combine both metrics with more emphasis on matching percentage
    return (rawSimilarity * 0.6) + (matchPercentage * 0.4);
}

// Compare facial proportions with more weight on discriminative features
function compareProportions(proportions1, proportions2) {
    if (!proportions1 || !proportions2) return 0;
    
    const keys = Object.keys(proportions1).filter(key => 
        proportions1[key] !== undefined && proportions2[key] !== undefined
    );
    
    if (keys.length === 0) return 0;
    
    // Define weights for different proportion features
    const weights = {
        // These are highly discriminative
        faceAsymmetry: 2.0,
        eyeNoseEyeAngle: 2.0,
        leftEyeMouthAngle: 1.5,
        rightEyeMouthAngle: 1.5,
        // These are moderately discriminative
        eyeDistance: 1.2,
        leftEyeToNose: 1.2,
        rightEyeToNose: 1.2,
        noseToMouth: 1.2,
        // These are less discriminative
        faceWidth: 0.8,
        faceHeight: 0.8,
        widthToHeightRatio: 1.0
    };
    
    let totalDifference = 0;
    let totalWeight = 0;
    
    keys.forEach(key => {
        const value1 = proportions1[key];
        const value2 = proportions2[key];
        const difference = Math.abs(value1 - value2) / Math.max(value1, value2, 0.0001);
        
        // Apply weight for this feature
        const weight = weights[key] || 1.0;
        totalDifference += Math.min(difference, 1) * weight; // Cap at 100% difference
        totalWeight += weight;
    });
    
    const weightedDifference = totalDifference / totalWeight;
    return 1 - weightedDifference;
}

// Compare face angles with tolerance for minor variations
function compareAngles(angles1, angles2) {
    if (!angles1 || !angles2) return 0;
    
    // Calculate differences in angles, normalized to 0-1 range
    // Allow some tolerance for minor variations in head position
    const rollDiff = Math.min(Math.abs(angles1.roll - angles2.roll) / 90, 1);
    const panDiff = Math.min(Math.abs(angles1.pan - angles2.pan) / 90, 1); 
    const tiltDiff = Math.min(Math.abs(angles1.tilt - angles2.tilt) / 90, 1);
    
    // Weight pan (side-to-side) and tilt (up-down) more than roll
    const weightedDiff = (rollDiff * 0.2) + (panDiff * 0.4) + (tiltDiff * 0.4);
    return 1 - weightedDiff;
}

// Function to compare two faces with comprehensive analysis
async function compareFaces(img1, img2) {
    console.log("Analyzing faces...");
    const face1 = await detectFaces(img1);
    const face2 = await detectFaces(img2);

    if (!face1 || !face2) {
        console.log("Could not compare faces, one or both images have no detected faces.");
        return;
    }
    
    // Extract comprehensive features
    const features1 = extractFaceFeatures(face1);
    const features2 = extractFaceFeatures(face2);
    
    if (!features1 || !features2) {
        console.log("Could not extract face features, missing required data.");
        return;
    }

    // Calculate similarity with the improved algorithm
    const similarityScore = calculateSimilarity(features1, features2);
    
    console.log("================== FACE COMPARISON RESULTS ==================");
    console.log(`Face similarity: ${(similarityScore * 100).toFixed(2)}%`);
    
    // Additional analysis data
    const landmarkSimilarity = compareLandmarks(features1.normalizedLandmarks, features2.normalizedLandmarks);
    const proportionSimilarity = compareProportions(features1.proportions, features2.proportions);
    const geometrySimilarity = compareGeometry(features1.facialGeometry, features2.facialGeometry);
    
    console.log(`Landmark similarity: ${(landmarkSimilarity * 100).toFixed(2)}%`);
    console.log(`Proportion similarity: ${(proportionSimilarity * 100).toFixed(2)}%`);
    console.log(`Facial geometry similarity: ${(geometrySimilarity * 100).toFixed(2)}%`);
    
    // Higher threshold with more confidence levels for more accurate results
    if (similarityScore >= 0.92) {
        console.log("RESULT: Very high confidence these are the same person.");
    } else if (similarityScore >= 0.87) {
        console.log("RESULT: High confidence these are the same person.");
    } else if (similarityScore >= 0.80) {
        console.log("RESULT: Moderate confidence these may be the same person.");
    } else if (similarityScore >= 0.75) {
        console.log("RESULT: Low confidence match - may be the same person in different conditions.");
    } else {
        console.log("RESULT: These are likely different people.");
    }
    console.log("===========================================================");
    
    // Return the result for programmatic use
    return {
        similarityScore,
        details: {
            landmarkSimilarity,
            proportionSimilarity,
            geometrySimilarity
        },
        isSamePerson: similarityScore >= 0.87
    };
}

// Provide image paths and compare faces
// For immediate use:
compareFaces('siddhant.jpeg', 'aditya.jpeg');

// Export functions for module use
module.exports = {
    detectFaces,
    extractFaceFeatures,
    calculateSimilarity,
    compareFaces
};