import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, Asset, BoundingBoxResponse, CroppedAsset, DetectedAssetBox, HEX_COLORS, StashItem } from "../types";

// Helper to convert File to Base64
const fileToGenericBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const analyzeImageForAssets = async (file: File): Promise<AnalysisResponse> => {
  // Use a smart model for analysis (Gemini 3 Pro or Flash) to get accurate JSON
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenericBase64(file);

  const prompt = `
Task: Character Asset Identification for Extraction

Instructions:
1. Analyze the character in the image and identify all distinct, extractable equipment and clothing items.
2. Filter for items that are clearly visible: tops, bottoms, headwear, footwear, specialized armor (arm guards, leg guards), and accessories (scarves, belts, capes).
3. For each identified item, assign one of the following high-contrast background colors for future segmentation: Red, Yellow, Green, White, Blue, Black, Magenta, Cyan, Orange, Gray. Avoid repeating colors if possible.
4. Limit to a maximum of 9 most prominent assets.

Output Format (Strict JSON):
Return ONLY a JSON object with a list of assets.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item_name: { type: Type.STRING },
                background_color: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['item_name', 'background_color', 'description'],
            },
          },
        },
        required: ['assets']
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from analysis model");
  
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanText);
  if (!parsed.assets) parsed.assets = [];
  
  return parsed as AnalysisResponse;
};

export const generateTextureSheet = async (originalFile: File, assets: Asset[]): Promise<string> => {
  // Use Gemini 2.5 Flash Image ("Banana") for generation as requested
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenericBase64(originalFile);

  // Construct the mapping string dynamically
  const mappingString = assets.map(asset => {
    const colorName = asset.background_color;
    // Fallback to black if hex not found
    const hex = HEX_COLORS[colorName] || '#000000'; 
    return `- ${asset.item_name}: ${colorName} Background (${hex}). ${asset.description}`;
  }).join('\n');

  const prompt = `
Task: Character Asset Extraction & Grid Generation

Instructions:
Analyze the character in the provided image and extract the following ${assets.length} specific assets into a new, single image organized in a grid layout (e.g., 2x3, 3x3 depending on count).

Core Constraints:
1. Isolated Assets: Each item must be placed within its own distinct square tile. No overlapping.
2. Ghost Mannequin Style: Extract ONLY the items. Remove the character's body entirely. Clothing and armor must appear as empty, 3D shells as if worn by an invisible person. 
3. Solid Chroma Key Backgrounds: Each tile must use the specific solid background color assigned below. Ensure zero shadows, highlights, or gradients on the background to facilitate clean digital segmentation.
4. Output Format: Generate a square texture sheet. Ignore the original image aspect ratio for the final output canvas.

Item & Background Mapping:
${mappingString}

Output Requirement: High-resolution texture sheet, flat lay presentation, sharp edges, and uniform lighting across all assets.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: originalFile.type, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
        // imageSize not supported for gemini-2.5-flash-image
      }
    }
  });

  // Extract image
  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image generated.");
  }

  return imageUrl;
};

export const detectAssetBoundingBoxes = async (textureSheetBase64: string): Promise<BoundingBoxResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
Task: Spatial Asset Detection & Normalized Grid Mapping

Instructions:
1. Analyze the provided image consisting of character assets arranged in a grid.
2. Identify the bounding box for each distinct asset container (the colored square background tiles).
3. Return the coordinates for each box using a normalized scale of 0.0 to 1.0.
   - [ymin, xmin, ymax, xmax]
   - (0, 0) is the top-left corner; (1.0, 1.0) is the bottom-right corner.
4. Ensure the box coordinates strictly encompass the outer boundary of each colored tile.

Output Format (Strict JSON):
Return ONLY a JSON object. Provide the grid dimensions and a list of detected assets with their coordinates.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: textureSheetBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grid_dimensions: {
            type: Type.OBJECT,
            properties: {
              rows: { type: Type.INTEGER },
              cols: { type: Type.INTEGER }
            }
          },
          assets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item_name: { type: Type.STRING },
                coordinates: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: "[ymin, xmin, ymax, xmax]"
                },
                bg_color_detected: { type: Type.STRING }
              }
            }
          }
        },
        required: ['assets', 'grid_dimensions']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No bounding box response from model");
  
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON:", cleanText);
    throw new Error("Invalid JSON response from detection model");
  }
  
  // Ensure assets array exists
  if (!parsed.assets || !Array.isArray(parsed.assets)) {
    parsed.assets = [];
  }

  return parsed as BoundingBoxResponse;
};

export const cropAssetsFromSheet = async (sheetDataUrl: string, boxes: DetectedAssetBox[]): Promise<Omit<CroppedAsset, 'sourceIndex'>[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const cropped: Omit<CroppedAsset, 'sourceIndex'>[] = [];
        
        if (boxes && Array.isArray(boxes)) {
          boxes.forEach(box => {
            if (!box.coordinates || box.coordinates.length !== 4) return;
            
            const [ymin, xmin, ymax, xmax] = box.coordinates;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;

            // Convert normalized coords to pixels
            const srcX = xmin * img.width;
            const srcY = ymin * img.height;
            const srcW = (xmax - xmin) * img.width;
            const srcH = (ymax - ymin) * img.height;

            canvas.width = srcW;
            canvas.height = srcH;

            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
            
            cropped.push({
              item_name: box.item_name || "Unknown Asset",
              imageUrl: canvas.toDataURL('image/png')
            });
          });
        }

        resolve(cropped);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = sheetDataUrl;
  });
};

export const refineAssetImage = async (base64Data: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
Task: Asset Refinement

Instructions:
1. Process the provided asset image.
2. Remove the existing colored background and replace it with a pure white background (#FFFFFF).
3. Upscale the image and enhance details for high-quality game asset presentation.
4. Ensure the object is centered and fully visible.
5. Return only the image.
  `;

  // Remove header if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
        { text: prompt }
      ]
    }
  });

  // Extract image
  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No refined image generated.");
  }

  return imageUrl;
};

export const generateModifiedCharacter = async (
  characterFile: File,
  assets: StashItem[],
  model: string = 'gemini-3-pro-image-preview'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Base Character
  const charBase64 = await fileToGenericBase64(characterFile);
  
  const parts: any[] = [];
  
  parts.push({
    inlineData: { mimeType: characterFile.type, data: charBase64 }
  });
  parts.push({ text: "Base Character Reference" });

  // Assets
  for (const asset of assets) {
    // imageUrl is likely a data URL "data:image/png;base64,....."
    const matches = asset.imageUrl.match(/^data:(.+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const data = matches[2];
      parts.push({
        inlineData: { mimeType, data }
      });
      parts.push({ text: `Equipment to equip: ${asset.item_name}` });
    }
  }

  const prompt = `
    Task: Character Synthesis and Equipment Modification.
    
    1. Reference the 'Base Character' for pose, body type, facial features, and general art style.
    2. Reference the 'Equipment to equip' images.
    3. Generate a new image of the Base Character wearing the provided items.
    4. The items should replace existing clothing/armor in that slot (e.g. new helmet replaces old hat, armor replaces shirt).
    5. Seamlessly blend the items into the character's style. 
    6. Maintain the exact pose and angle of the Base Character.
    7. High quality, detailed, game art style.
  `;
  
  parts.push({ text: prompt });

  const imageConfig: any = {
    aspectRatio: '1:1',
  };

  if (model === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = '2K';
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      imageConfig: imageConfig
    }
  });

  // Extract image
  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image generated.");
  }

  return imageUrl;
};