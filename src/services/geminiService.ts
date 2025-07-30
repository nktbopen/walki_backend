
import {GoogleGenerativeAI,GenerateContentResult, Content, GenerateContentRequest, GenerationConfig, ResponseSchema, Part} from '@google/generative-ai';

const generateDescriptionModelConfig:GenerationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema:<ResponseSchema>{
    type: "array",
    items: {
      type: "object",
      properties: {
        osm_id: {
          type: "number"
        },
        description: {
          type: "string"
        },
      },
      required: [
        "osm_id",
        "description",
      ]
    }
  },
};

const generateTextFromWikiModelConfig:GenerationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const suggestAttractionsModelConfig:GenerationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema:<ResponseSchema>{
    type: "array",
    items: {
      type: "object",
      properties: {
        category: {
          type: "string"
        },
        attraction_ids: {
          type: "array",
          items: {
            type: "object",
            properties: {
              osm_id: {type: "number"},
              name: {type: "string"}
            }
          }
        },
      },
      required: [
        "category",
        "attraction_ids",
      ]
    }
  },
};

const GEMINI_AP_KEY = 'AIzaSyDrZtVbxY5lMg96FWA4ow8XffzL9yqfSvo';
const genAI = new GoogleGenerativeAI(GEMINI_AP_KEY);
//const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite'});
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite'});

export const generateDescription = async (attractions: string): Promise<GenerateContentResult | null> => {
  const prompt = "You are a travel guide tasked with creating concise, informative and engaging one-sentence annotation for the tourist attractions provided in the attached json list."
        +" For each attraction provide a single sentence that includes: a) A key feature or historical fact about the attraction. b) A reason why a tourist might want to visit it. "
        // +"A good examples of informative descriptions: "
        // +"For the Eiffel Tower in Paris: \"A 324-meter iron lattice tower built for the 1889 World's Fair, offering breathtaking views of Paris.\""
        // +"Great Barrier Reef in Australia: \"The world's largest coral reef system, home to a diverse array of marine life, including colorful fish, sharks, and sea turtles.\""
        // +"Colosseum in Rome: \"A massive amphitheater built in ancient Rome, used for gladiatorial contests and public spectacles, and now a UNESCO World Heritage Site.\""
        +"Don't include the name of attraction in a text. In the output include id from the source data and also generated description text. "
        +"Here is the list of the attractions:";
  const result = await sendGeminiRequest(attractions, prompt, generateDescriptionModelConfig);

  return result;
};

export const suggestAttractions = async (attractions: string): Promise<{category: string, attraction_ids:[{osm_id: number, name: string}]}[] | null> => {
  const prompt = "You are an expert travel guide with vast knowledge of global landmarks and points of interest. " 
              +"Your task is to analyze a given list of attractions and identify the most significant or popular ones for each of the following category: 'The most popular attractions overall', 'Popular tourist attractions', 'Artwork', 'Museums', 'Monuments', 'History' (including 'Archaelogical sites' and 'Ruins'). "
              +"You can adjust the name of categories to make them more attractive for tourists. If relevant you can mention the number of attractions in a group e.g: 'Top 10 attractions ...' or '15 significant artworks ...' etc. Also you can combine multiple categories into one in case if only few belong to a single category. Skip the categories for which there are less then 5 relevant attractions in the provided list. "
              +"Since explicit popularity data is not provided, infer significance/popularity based on the attraction's name, categories, and your general knowledge. "
              +"Prioritize well-known landmarks, historically important sites, or highly recognized points of interest. "
              +"Please provide between 10 and 15 attractions per each category (if there are any). "
              +"Here is the list of the attractions:";
  const result = await sendGeminiRequest(attractions, prompt, suggestAttractionsModelConfig);
  if(result && result.response && result.response.candidates && result.response.candidates[0].content.parts[0].text){
    const json_result:{category: string, attraction_ids:[{osm_id: number, name: string}]}[] = JSON.parse(result.response.candidates[0].content.parts[0].text);
    return json_result;
  } else {
    return null;
  }
};

export const generateTextFromWiki = async (wikipedia_page: string, sequence: number, is_last: boolean): Promise<Content | null> => {

  const position = sequence === 1 ? 'first' : sequence === 2 ? 'second' : sequence === 3 ? 'third' : is_last === true ? 'last' : 'next';

  const prompt = "Your task is to act as an experienced tour guide."
    +"First, you will be provided with the HTML content of a Wikipedia article about a tourist attraction. Carefully read and understand the information presented in this article."
    +"Your goal is to then create a narrative for audio guide, approximately 300-400 words in length, that describes this tourist attraction as if you were giving a guided tour to a real person. The tone and style should reflect a natural, engaging, and informative conversation between a tour guide and a tourist."
    +"Make sure to incorporate key facts and details from the Wikipedia article into your narrative, but present them in a way that is accessible and interesting to a listener. Avoid simply reciting information; instead, weave it into a compelling story. You can include anecdotes, historical context, and descriptive language to bring the attraction to life."
    +"Consider the following instructions:"
    +"* Divide the narrative into parts and before the beginning of the next part indicate its title, for example: \"Interesting facts\", \"Useful tips for visiting\", \"Historical background\", etc. But skip the titles for Introduction and Conclusion. "
    +"* In the beginning skip the greeting and start directly with the name of the attraction and short introduction to it. "
    //+"* If required can mention that it's our ${position} point of the excursion. "
    +"* Guiding the \"listener\" through different aspects or areas of the attraction (even if the Wikipedia article doesn't explicitly divide it). "
    +"* Providing historical context and interesting facts in a digestible manner. "
    +"* Using descriptive language to help the \"listener\" visualize the attraction. "
    +"* Add interesting facts that are known about this landmark. "
    +"* If there are any movies or books related to the landmark, provide information about it. "
    +"* If there are any famous people (actors, writers, singers, painters etc) associated with landmark you can mention it. "
    +"* If you know any useful tips for visiting, you can mention it. "
    +"* Put SSML tag <break time=\"1000ms\"/> before and after the title of each section to indicate pauses. "
    +"* Use ˈ to indicate correct stress in a names of toponims, landmarks and people. "
    //+"* Maintaining a conversational and friendly tone."
    +"* Concluding with a summary or a lasting impression of the attraction. "
    +"Based on this information, please generate the tour guide narrative. "
    +"Here is the HTML content of the Wikipedia article:";

  const result = await sendGeminiRequest(wikipedia_page, prompt, generateTextFromWikiModelConfig);

  if(result && result.response && result.response.candidates && result.response.candidates[0].content){
    console.log("text result: ",result.response.candidates[0].content);
    return result.response.candidates[0].content;
  } else {
    return null;
  }
  
};

const sendGeminiRequest = async (payload: string, prompt: string, generationConfig: GenerationConfig): Promise<GenerateContentResult | null> => {
  try {
    const parts:Part[] = [
      {
        text: prompt,
      },
      {
        text: payload,
      }
    ];
    model.generationConfig = generationConfig;

    const result = await model.generateContent(parts);
    if(result && result.response && result.response.candidates && result.response.candidates[0].content){
      return result;
    } else{
      return null;
    }
    
  } catch (error) {
    console.error('Error generating content:', error);
    return null;
  }
  
};