
import {GoogleGenAI,GenerateContentResponse, Content, GenerateContentConfig, Schema, Part} from '@google/genai';
import { GenerateAudioScriptParams } from '../interfaces/interfaces';

const modelName = 'gemini-2.5-flash-lite'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const generateDescription = async (attractions: string): Promise<string | undefined> => {
  const generateDescriptionModelConfig:GenerateContentConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema:<Schema>{
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          osm_id: {
            type: "NUMBER"
          },
          description: {
            type: "STRING"
          },
        },
        required: [
          "osm_id",
          "description",
        ]
      }
    },
  };

  const prompt = "You are a travel guide tasked with creating concise, informative and engaging one-sentence annotation for the tourist attractions provided in the attached json list."
        +" For each attraction provide a single sentence that includes: a) A key feature or historical fact about the attraction. b) A reason why a tourist might want to visit it. "
        // +"A good examples of informative descriptions: "
        // +"For the Eiffel Tower in Paris: \"A 324-meter iron lattice tower built for the 1889 World's Fair, offering breathtaking views of Paris.\""
        // +"Great Barrier Reef in Australia: \"The world's largest coral reef system, home to a diverse array of marine life, including colorful fish, sharks, and sea turtles.\""
        // +"Colosseum in Rome: \"A massive amphitheater built in ancient Rome, used for gladiatorial contests and public spectacles, and now a UNESCO World Heritage Site.\""
        +"Don't include the name of attraction in a text. In the output include id from the source data and also generated description text. "
        +"Here is the list of the attractions:";
  const result = await sendGeminiRequest(attractions, prompt, generateDescriptionModelConfig);

  if(result && result.text){
    return result.text;
  } else {
    return undefined;
  }
};

export const suggestAttractions = async (attractions: string): Promise<{title: string, description: string, attraction_ids:[{osm_id: number, name: string}]}[] | null> => {
  const suggestAttractionsModelConfig:GenerateContentConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema:<Schema>{
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING"
          },
          description: {
            type: "STRING"
          },
          attraction_ids: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                osm_id: {type: "NUMBER"},
                name: {type: "STRING"}
              }
            }
          },
        },
        required: [
          "title",
          "description",
          "attraction_ids",
        ]
      }
    },
  };
  const prompt = "You are an expert travel guide with vast knowledge of global landmarks and points of interest. " 
              //+"Your task is to analyze a given list of attractions and identify the most significant or popular ones for each of the following category: 'Popular tourist attractions', 'Artworks', 'Museums', 'Monuments', 'Architecure', 'History', 'Famous people', 'Film making', 'Hidden gems'. "
              //+"You can adjust the name of categories to make them more attractive for tourists. If relevant you can mention the number of attractions in a group e.g: 'Top 10 attractions ...' or '10 significant artworks ...' etc. Also you can combine multiple categories into one in case if only few belong to a single category. Skip the categories for which there are less then 5 relevant attractions in the provided list. "
              +"Your task is to analyze a given list of attractions and identify the possible titles for the thematic tours. With each name provide the list of belonging attractions. Some topics to be used: 'Popular tourist attractions', 'Artworks', 'Museums', 'Monuments', 'Architecure', 'History', 'Famous people', 'Film making', 'Hidden gems'. "
              +"Since explicit popularity data is not provided, infer significance/popularity based on the attraction's name, categories, and your general knowledge. "
              +"Prioritize well-known landmarks, historically important sites, or highly recognized points of interest. "
              +"Provide between 5 and 10 attractions per each tour title (if there are any). "
              +"Skip the tours for which there are less then 5 relevant attractions in the provided list. "
              +"For each title in the description provide 1-3 sentences instructions for future narative of the audio guide, explain what tour is about and instruct which topics to observe. "
              +"In the output include osm_id and attraction name belonging to each suggested tour title and desciption of the tour. "
              +"Here is the list of the attractions:";
  const response = await sendGeminiRequest(attractions, prompt, suggestAttractionsModelConfig);
  if(response && response.text){
    const json_result:{title: string, description: string, attraction_ids:[{osm_id: number, name: string}]}[] = JSON.parse(response.text);
    return json_result;
  } else {
    return null;
  }
};

export const generateAudioScript = async (params: GenerateAudioScriptParams): Promise<string | undefined> => {

  const systemInstruction = "You are an expert travel writer and audio guide script developer. Your task is to generate engaging, informative, and cohesive scripts for an audio tour. "
  + "### 1. Persona and Format "
  + "* **Target Format:** Audio guide script (narrative, engaging, descriptive, and easy to follow). "
  + "* **Tone/Voice:** **Knowledgeable, appreciative of detailed craftsmanship, and formal.** "
  //+ "* **The emphasis should be on ** **historical significance, design, materials, and architectural styles.** "
  + "* **Length Constraint:** Each attraction script must be between **300 and 350 words**. "
  + "### 2. Tour Context "
  + "* **Tour Topic/Theme:** **"+params.topic+"** ("+params.topicDescription+"). "
  + "* **Itinerary:** The following attractions are part of this tour: **"+params.itineraryItemsList+"** "
  + "### 3. Instruction for Subsequent Requests "
  + "For each subsequent request, I will provide you with the name of a single attraction from the itinerary and a block of text containing relevant information, typically sourced from a Wikipedia page. "
  + "**Your response for each subsequent request must be:** "
  + "1.  A standalone, engaging audio guide script for the specified attraction. "
  + "2.  Tailored to emphasize information and details relevant to the **Tour Topic/Theme** provided above ("+params.topic+"). "
  + "3.  Strictly adhere to the **300-400 word** length. "
  + "4.  Begin with a captivating opening and end with a smooth transition or concluding thought. "
  + "5.  Do NOT include a title or introduction/conclusion that breaks the flow of the script. Start directly with the narrative. "
  + "6.  Output language: **"+params.language+"**. "

  const prompt = "**Generate the audio guide script for the attraction below.** "
  + "**Attraction Name:**"+params.attractionName+"** "
  + "**Wikipedia Data:**";

  //console.log("systemInstruction: ",systemInstruction);
  //console.log("prompt: ",prompt);
  // console.log("wikipedia_page: ",params.wikipediaData);

  const generateTextFromWikiModelConfig:GenerateContentConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    systemInstruction: systemInstruction,
  };

  const response = await sendGeminiRequest(params.wikipediaData, prompt, generateTextFromWikiModelConfig);

  if(response && response.text){
    //console.log("text result: ",response.text);
    return response.text;
  } else {
    return undefined;
  }
  
};

export const generateAttractionArticle = async (wikipediaData: string, language: string): Promise<string | undefined> => {

  const systemInstruction = "You are an expert travel writer and content curator. Your task is to process a full-length Wikipedia article about a tourist attraction and generate a concise, engaging summary. "
  //+ "**Goal:** Create a version of the article specifically tailored for a potential tourist, highlighting the most essential and interesting aspects of the attraction. "
  + "**Constraints & Requirements:** "
  + "1.  **Length Limit:** The output must be no more than **600 words**. "
  + "2.  **Focus:** Concentrate *only* on information relevant and useful to a tourist (e.g., historical significance, architectural highlights, unique features, key facts, and cultural importance). "
  //+ "3.  **Exclusions:** Omit overly technical details, exhaustive historical background irrelevant to the modern visitor, lengthy bureaucratic descriptions, or minor biographical details. "
  + "4.  **Tone:** Maintain an **engaging, informative, and inviting** tone suitable for a travel guide or a blog post. "
  //+ "5.  **Structure:** Organize the summary logically with clear headings to enhance readability (e.g., 'History in Brief', 'Architectural Highlights', 'What Makes it Unique,' 'Visitor Essentials'). "
  + "5.  **Structure:** Organize the summary logically with clear headings to enhance readability. "
  + "6.  Output language: **"+language+"**. "

  const prompt = "**Input:** ";

  //console.log("systemInstruction: ",systemInstruction);
  //console.log("prompt: ",prompt);
  // console.log("wikipedia_page: ",params.wikipediaData);

  const modelConfig:GenerateContentConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    systemInstruction: systemInstruction,
  };

  const response = await sendGeminiRequest(wikipediaData, prompt, modelConfig);

  if(response && response.text){
    //console.log("text result: ",response.text);
    return response.text;
  } else {
    return undefined;
  }
  
};

const sendGeminiRequest = async (payload: string, prompt: string, generationConfig: GenerateContentConfig): Promise<GenerateContentResponse | null> => {
  try {
    const genAI = new GoogleGenAI({apiKey: GEMINI_API_KEY});
    const parts:Part[] = [
      {
        text: prompt,
      },
      {
        text: payload,
      }
    ];

    const response = await genAI.models.generateContent({
      config: generationConfig,
      contents: parts,
      model: modelName
    });

    if(response && response.candidates && response.candidates[0].content){
      return response;
    } else{
      return null;
    }
    
  } catch (error) {
    console.error('Error generating content:', error);
    return null;
  }
  
};