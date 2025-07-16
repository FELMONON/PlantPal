export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Check if API key is available
    const apiKey = process.env.EXPO_PUBLIC_PLANT_API_KEY;
    if (!apiKey) {
      console.error('Missing EXPO_PUBLIC_PLANT_API_KEY environment variable');
      return Response.json({
        success: false,
        error: 'API_KEY_MISSING',
        message: 'Plant analysis service is not configured. Please check your environment settings.'
      }, { 
        status: 500,
        headers: corsHeaders
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return Response.json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Invalid request format'
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    const { imageUri, imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return Response.json({
        success: false,
        error: 'MISSING_IMAGE_DATA',
        message: 'No image data provided. Please take a photo first.'
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const finalMimeType = validMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';

    // Call Gemini AI API
    console.log('Making Gemini API request...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this image carefully and identify what it contains.

INSTRUCTIONS:
1. First, determine if the image contains a plant, flower, tree, or any botanical specimen that can be cared for.
2. If it's NOT a plant/botanical specimen, identify what it actually is and explain why it can't be used with a plant care app.
3. If it IS a plant/botanical specimen, provide the detailed plant analysis.

For NON-PLANT objects, respond in this EXACT JSON format:
{
  "isPlant": false,
  "objectType": "What the object actually is (e.g., 'person', 'car', 'food item', 'building', etc.)",
  "objectName": "Specific name or description of the object",
  "explanation": "Detailed explanation of what this object is and what it does/is used for",
  "whyNotPlant": "Clear explanation of why this object cannot be used with a plant care app and what the app is designed for instead"
}

For PLANT/botanical specimens, respond in this EXACT JSON format:
{
  "isPlant": true,
  "plantName": "Scientific name (Genus species)",
  "commonName": "Common name",
  "confidence": 85,
  "healthStatus": "healthy/warning/poor",
  "healthScore": 85,
  "diagnosis": "Detailed health assessment with specific observations about leaf condition, color, growth patterns, and any visible issues",
  "careAdvice": [
    "Specific actionable care tip 1",
    "Specific actionable care tip 2", 
    "Specific actionable care tip 3",
    "Specific actionable care tip 4"
  ],
  "quickFacts": {
    "origin": "Geographic origin",
    "difficulty": "Beginner/Intermediate/Advanced",
    "growthRate": "Slow/Medium/Fast",
    "toxicity": "Safe/Toxic to pets",
    "lightRequirement": "Specific light needs",
    "waterFrequency": "Specific watering schedule",
    "humidity": "Humidity percentage range",
    "temperature": "Temperature range in °F"
  },
  "healthInsights": {
    "overallCondition": "Detailed assessment of plant's current condition",
    "strengths": ["What the plant is doing well", "Positive aspects observed"],
    "concerns": ["Any issues or potential problems", "Areas needing attention"],
    "recommendations": ["Immediate actions to take", "Long-term care suggestions"]
  }
}

HEALTH SCORING GUIDELINES:
- 90-100: Excellent health, vibrant growth, perfect conditions
- 80-89: Good health, minor issues or room for improvement
- 70-79: Fair health, some visible problems but manageable
- 60-69: Poor health, significant issues requiring attention
- Below 60: Critical condition, immediate intervention needed

Be specific and accurate in your assessment. If you're not confident about the exact species, provide the closest match and adjust confidence accordingly.`
              },
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
      let errorDetails;
      try {
        errorDetails = await geminiResponse.json();
        console.error('Gemini API Error:', geminiResponse.status, errorDetails);
      } catch (parseError) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', geminiResponse.status, errorText);
        errorDetails = { error: { message: errorText } };
      }
      
      return Response.json({
        success: false,
        error: 'GEMINI_API_ERROR',
        message: `Gemini API error: ${geminiResponse.status} - ${errorDetails?.error?.message || 'Unknown error'}`
      }, { 
        status: 500,
        headers: corsHeaders
      });
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No AI response received');
      return Response.json({
        success: false,
        error: 'NO_AI_RESPONSE',
        message: 'No response from AI service'
      }, { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Check if it's not a plant
    let plantData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plantData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('AI Response:', aiResponse);
      
      return Response.json({
        success: false,
        error: 'ANALYSIS_FAILED',
        message: 'Unable to analyze this image. Please try again with a clearer photo.'
      }, { status: 500 });
    }

    // Check if it's not a plant
    if (plantData.isPlant === false) {
      return Response.json({
        success: false,
        error: 'NOT_A_PLANT',
        message: `This appears to be ${plantData.objectName || 'not a plant'}. PlantPal is designed for plant care.`,
        objectInfo: {
          objectType: plantData.objectType || 'unknown object',
          objectName: plantData.objectName || 'unidentified object',
          explanation: plantData.explanation || 'This object cannot be identified.',
          whyNotPlant: plantData.whyNotPlant || 'PlantPal is designed to help you care for plants, flowers, and trees. Please take a photo of a botanical specimen instead.'
        }
      }, { headers: corsHeaders });
    }


    // Ensure all required fields are present
    const results = {
      plantName: plantData.plantName || 'Unknown Plant',
      commonName: plantData.commonName || 'Unidentified Species',
      confidence: Math.max(1, Math.min(100, plantData.confidence || 50)),
      diagnosis: plantData.diagnosis || 'Health status could not be determined from this image',
      healthStatus: plantData.healthStatus || 'unknown',
      healthScore: Math.max(1, Math.min(100, plantData.healthScore || 50)),
      careAdvice: Array.isArray(plantData.careAdvice) && plantData.careAdvice.length > 0 
        ? plantData.careAdvice 
        : [
            'Provide appropriate lighting for the species',
            'Water when the top inch of soil feels dry',
            'Ensure good drainage to prevent root rot',
            'Monitor for pests and diseases regularly'
          ],
      quickFacts: {
        origin: plantData.quickFacts?.origin || 'Unknown',
        difficulty: plantData.quickFacts?.difficulty || 'Unknown',
        growthRate: plantData.quickFacts?.growthRate || 'Unknown',
        toxicity: plantData.quickFacts?.toxicity || 'Unknown - keep away from pets',
        lightRequirement: plantData.quickFacts?.lightRequirement || 'Bright, indirect light',
        waterFrequency: plantData.quickFacts?.waterFrequency || 'When soil is dry',
        humidity: plantData.quickFacts?.humidity || '40-60%',
        temperature: plantData.quickFacts?.temperature || '65-75°F'
      },
      healthInsights: {
        overallCondition: plantData.healthInsights?.overallCondition || 'Unable to assess condition from this image',
        strengths: Array.isArray(plantData.healthInsights?.strengths) 
          ? plantData.healthInsights.strengths 
          : ['Plant appears to be surviving'],
        concerns: Array.isArray(plantData.healthInsights?.concerns) 
          ? plantData.healthInsights.concerns 
          : ['Monitor for any changes'],
        recommendations: Array.isArray(plantData.healthInsights?.recommendations) 
          ? plantData.healthInsights.recommendations 
          : ['Continue regular care routine']
      },
      identificationId: `plant_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    return Response.json({
      success: true,
      data: results
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return Response.json({
      success: false,
      error: 'ANALYSIS_FAILED',
      message: 'Failed to analyze the image. Please try again with a clearer photo of a plant.'
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: Request) {
  return Response.json({
    message: 'PlantPal AI Analysis API',
    status: 'Active',
    powered_by: 'Google Gemini AI',
    endpoints: {
      analyze: 'POST /analyze - Analyze plant images with AI',
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}