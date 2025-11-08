/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI} from '@google/genai';

const getAi = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('API Key is missing. Please provide a valid API key.');
  }
  return new GoogleGenAI({apiKey});
};

const artModelName = 'gemini-2.5-flash';
const textModelName = 'gemini-2.5-flash';

/**
 * Art-direction toggle for ASCII art generation.
 * `true`: Slower, higher-quality results (allows the model to "think").
 * `false`: Faster, potentially lower-quality results (skips thinking).
 */
const ENABLE_THINKING_FOR_ASCII_ART = false;

/**
 * Art-direction toggle for blocky ASCII text generation.
 * `true`: Generates both creative art and blocky text for the topic name.
 * `false`: Generates only the creative ASCII art.
 */
const ENABLE_ASCII_TEXT_GENERATION = false;

export interface AsciiArtData {
  art: string;
  text?: string; // Text is now optional
}

/**
 * Streams a definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @param language The language for the definition.
 * @param apiKey The user's Gemini API key.
 * @returns An async generator that yields text chunks of the definition.
 */
export async function* streamDefinition(
  topic: string,
  language: string,
  apiKey: string,
): AsyncGenerator<string, void, undefined> {
  if (!apiKey) {
    yield 'Error: API_KEY is not configured. Please set your API key to continue.';
    return;
  }

  const ai = getAi(apiKey);
  const prompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${topic}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself. The language of the definition must be ${language}.`;

  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for the lowest possible latency, as requested.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    yield `Error: Could not generate content for "${topic}". ${errorMessage}. Please check if your API key is correct.`;
    // Re-throwing allows the caller to handle the error state definitively.
    throw new Error(errorMessage);
  }
}

/**
 * Generates a single random word or concept using the Gemini API.
 * @param language The language for the random word.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to a single random word.
 */
export async function getRandomWord(language: string, apiKey: string): Promise<string> {
  const ai = getAi(apiKey);
  const prompt = `Generate a single, random, interesting word or a two-word concept in the ${language} language. It can be a noun, verb, adjective, or a proper noun. Respond with only the word or concept itself, with no extra text, punctuation, or formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: {
        // Disable thinking for low latency.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error getting random word from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not get random word: ${errorMessage}`);
  }
}

/**
 * Generates ASCII art and optionally text for a given topic.
 * @param topic The topic to generate art for.
 * @param language The language for any text within the art.
 * @param apiKey The user's Gemini API key.
 * @param style The desired art style.
 * @returns A promise that resolves to an object with art and optional text.
 */
export async function generateAsciiArt(topic: string, language: string, apiKey: string, style: string): Promise<AsciiArtData> {
  const ai = getAi(apiKey);
  
  let styleInstruction: string;
  switch (style) {
    case 'Detailed':
      styleInstruction = `
  - Style: Detailed and intricate.
  - Use a wide palette of characters (│─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|) to create shading, texture, and depth.
  - Shape mirrors concept - make the visual form embody the word's essence with high fidelity.`;
      break;
    case 'Blocky':
      styleInstruction = `
  - Style: Bold and blocky, similar to pixel art.
  - Palette: Primarily use solid block characters (█, ▀, ▄, ▓, ▒, ░) and simple geometric shapes.
  - Shape mirrors concept - create a strong, graphic representation of the word's essence.`;
      break;
    case 'Abstract':
      styleInstruction = `
  - Style: Abstract and evocative. The concept "${topic}" is abstract.
  - Do not create a literal depiction. Instead, generate an abstract ASCII pattern that evokes the *feeling* or *essence* of the word.
  - Focus on texture, flow, rhythm, and symbolic representation using a creative mix of characters.`;
      break;
    case 'Pixelated':
      styleInstruction = `
  - Style: Low-resolution pixel art.
  - Palette: Primarily use solid block characters (█, ▀, ▄, ▓, ▒, ░).
  - Focus on creating a clear but blocky, aliased representation of the concept.`;
      break;
    case 'Line Art':
      styleInstruction = `
  - Style: Clean and simple line art.
  - Palette: Exclusively use line-drawing characters (│, ─, ┌, ┐, └, ┘, /, \\, _, -).
  - Focus on outlines and contours, not shading. Emphasize clarity and simplicity.`;
      break;
    case 'Grunge':
      styleInstruction = `
  - Style: Messy, chaotic, and textured.
  - Palette: Use a dense, chaotic mix of varied characters (#, @, %, &, *, $, !, ?) to create a distressed, dirty, and worn-out feel.
  - Overlapping and asymmetry are key.`;
      break;
    case 'Glitch':
      styleInstruction = `
  - Style: Digital glitch effect.
  - Create the image as if it's a corrupted file. Use repeating characters, broken lines, horizontal shifts, and random "noise" characters to disrupt the form.`;
      break;
    case 'Blueprint':
      styleInstruction = `
  - Style: Technical schematic or blueprint.
  - Palette: Use simple lines (─, │, +), circles (o), and angles to create a diagrammatic look. Add annotations or measurement-like details.`;
      break;
    case 'Calligraphy':
      styleInstruction = `
  - Style: Elegant and flowing, like calligraphy.
  - Palette: Use characters that create smooth curves and varied line weights (e.g., S, s, ~, O, o, C, c).
  - The final art should feel like it was drawn with a brush.`;
      break;
    case 'Doodle':
      styleInstruction = `
  - Style: Hand-drawn, sketchy, and informal.
  - Palette: Use simple, rounded characters (o, c, u, ~) and casual lines.
  - The art should look spontaneous and playful.`;
      break;
    case 'Hatching':
      styleInstruction = `
  - Style: Shading with parallel lines.
  - Palette: Primarily use slashes (/, \\), vertical bars (|), and hyphens (-) in patterns to create depth and texture.
  - Vary the density of lines for shading.`;
      break;
    case 'Stipple':
      styleInstruction = `
  - Style: Pointillism.
  - Create the image entirely from dots and small characters. Palette: Use periods (.), colons (:), asterisks (*), and other small marks.
  - Vary the density of points to create shading.`;
      break;
    case '8-Bit':
      styleInstruction = `
  - Style: Retro 8-bit video game sprite.
  - Palette: Use block characters (█, ▀, ▄) and a very limited, chunky resolution.
  - The result should look like a character or object from an old video game.`;
      break;
    case 'Halftone':
      styleInstruction = `
  - Style: Printed halftone pattern.
  - Create shading using characters of different visual densities. Palette: Use a gradient of characters from light to dark (e.g., . , : , o , O , 8 , @ , #).`;
      break;
    case 'Typographic':
      styleInstruction = `
  - Style: Typographic art.
  - The art is composed of letters, numbers, and symbols that spell out or relate to the topic itself.
  - The overall shape should represent the topic, while the characters forming it add another layer of meaning.`;
      break;
    case 'Circuit Board':
      styleInstruction = `
  - Style: An electronic circuit board (PCB).
  - Palette: Use characters like ─, │, ┐, └, ┘, ┌, o, +, and T to represent traces, components, and solder points.
  - Create a dense, technical pattern.`;
      break;
    case 'Origami':
      styleInstruction = `
  - Style: Folded paper origami.
  - Use straight lines and triangular/polygonal shapes to create the appearance of folded creases and flat planes.
  - Shading should suggest depth from folds.`;
      break;
    case 'Mosaic':
      styleInstruction = `
  - Style: A mosaic made of tiles.
  - Palette: Use a variety of different characters as "tiles" (e.g., #, O, +, *, $, &).
  - Arrange them in a grid-like or organic pattern to form the image.`;
      break;
    case 'Sketch':
      styleInstruction = `
  - Style: A rough, unfinished pencil sketch.
  - Use light characters and visible "construction lines".
  - The art should look like a work-in-progress, with overlapping lines and a lack of sharp definition.`;
      break;
    case 'Stencil':
      styleInstruction = `
  - Style: A spray-painted stencil.
  - The image should have sharp, defined edges but with characteristic breaks or "bridges" in the lines, as if cut from a physical stencil.`;
      break;
    case 'Psychedelic':
      styleInstruction = `
  - Style: Trippy and surreal.
  - Use swirling patterns, distorted shapes, and characters that create a sense of movement and vibration.
  - Focus on flowing, organic, and mind-bending forms.`;
      break;
    case 'Art Deco':
      styleInstruction = `
  - Style: 1920s Art Deco.
  - Emphasize bold geometric shapes, strong vertical lines, symmetry, and decorative, stylized forms.
  - Use characters that create sharp angles and clean curves.`;
      break;
    case 'Gothic':
      styleInstruction = `
  - Style: Gothic architecture and art.
  - Use pointed arches, sharp angles, and intricate, spiky details.
  - The mood should be dark and ornate. Palette: Use characters like V, A, Y, T, |, +, #.`;
      break;
    case 'Vaporwave':
      styleInstruction = `
  - Style: 80s/90s retro-futurism (Vaporwave).
  - Think neon grids, palm trees, and classical statues. Use characters that can create a glowing or wireframe effect.
  - A sense of digital nostalgia is key.`;
      break;
    case 'Minimalist':
    default:
      styleInstruction = `
  - Style: Minimalist and clean.
  - Palette: Use a limited set of simple characters (│─┌┐└┘_ /\\|) to create elegant lines and shapes. Emphasize negative space.
  - Shape mirrors concept - distill the word's essence into its simplest visual form.`;
      break;
  }

  const artPromptPart = `1. "art": a string containing a meta ASCII visualization of the word "${topic}":
  ${styleInstruction}
  - Examples: "explosion" -> radiating lines from center; "hierarchy" -> pyramid structure.
  - The "art" string must be a valid JSON string value. This means all backslashes (\\\\) must be escaped (as \\\\\\\\) and all double quotes (") must be escaped (as \\\\"). Use \\n for newlines.
  - Any text included in the art must be in ${language}.`;

  const prompt = `For "${topic}", create a JSON object with one key: "art".
${artPromptPart}

Return ONLY the raw JSON object. The entire response must be a single, valid JSON object starting with "{" and ending with "}".`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config: any = {
        responseMimeType: 'application/json',
      };
      if (!ENABLE_THINKING_FOR_ASCII_ART) {
        config.thinkingConfig = { thinkingBudget: 0 };
      }

      const response = await ai.models.generateContent({
        model: artModelName,
        contents: prompt,
        config: config,
      });

      let jsonStr = response.text.trim();
      
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
      }

      const parsedData = JSON.parse(jsonStr) as AsciiArtData;
      
      if (typeof parsedData.art !== 'string' || parsedData.art.trim().length === 0) {
        throw new Error('Invalid or empty ASCII art in response');
      }
      
      const result: AsciiArtData = {
        art: parsedData.art,
      };

      if (ENABLE_ASCII_TEXT_GENERATION && parsedData.text) {
        result.text = parsedData.text;
      }
      
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed for ASCII art generation');
        throw new Error(`Could not generate ASCII art after ${maxRetries} attempts: ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}