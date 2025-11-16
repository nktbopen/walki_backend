
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
        title: {
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
        "title",
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

export const suggestAttractions = async (attractions: string): Promise<{title: string, attraction_ids:[{osm_id: number, name: string}]}[] | null> => {
  const prompt = "You are an expert travel guide with vast knowledge of global landmarks and points of interest. " 
              //+"Your task is to analyze a given list of attractions and identify the most significant or popular ones for each of the following category: 'Popular tourist attractions', 'Artworks', 'Museums', 'Monuments', 'Architecure', 'History', 'Famous people', 'Film making', 'Hidden gems'. "
              //+"You can adjust the name of categories to make them more attractive for tourists. If relevant you can mention the number of attractions in a group e.g: 'Top 10 attractions ...' or '10 significant artworks ...' etc. Also you can combine multiple categories into one in case if only few belong to a single category. Skip the categories for which there are less then 5 relevant attractions in the provided list. "
              +"Your task is to analyze a given list of attractions and identify the possible titles for the thematic tours. With each name provide the list of belonging attractions. Some topics to be used: 'Popular tourist attractions', 'Artworks', 'Museums', 'Monuments', 'Architecure', 'History', 'Famous people', 'Film making', 'Hidden gems'. "
              +"Since explicit popularity data is not provided, infer significance/popularity based on the attraction's name, categories, and your general knowledge. "
              +"Prioritize well-known landmarks, historically important sites, or highly recognized points of interest. "
              +"Please provide between 5 and 10 attractions per each tour title (if there are any). "
              +"Skip the tours for which there are less then 5 relevant attractions in the provided list. "
              +"In the output include osm_id and attraction name belonging to each suggested tour title. "
              +"Here is the list of the attractions:";
  const result = await sendGeminiRequest(attractions, prompt, suggestAttractionsModelConfig);
  if(result && result.response && result.response.candidates && result.response.candidates[0].content.parts[0].text){
    const json_result:{title: string, attraction_ids:[{osm_id: number, name: string}]}[] = JSON.parse(result.response.candidates[0].content.parts[0].text);
    return json_result;
  } else {
    return null;
  }
};

export const generateTextFromWiki = async (wikipedia_page: string, sequence: number, is_last: boolean): Promise<Content | null> => {
  console.log("wikipedia_page: ", wikipedia_page);

  const position = sequence === 1 ? 'first' : sequence === 2 ? 'second' : sequence === 3 ? 'third' : is_last === true ? 'last' : 'next';

  // const prompt = "Your task is to act as an experienced tour guide."
  //   +"First, you will be provided with the HTML content of a Wikipedia article about a tourist attraction. Carefully read and understand the information presented in this article. "
  //   +"Your goal is to then create a narrative for audio guide, approximately 300-400 words in length, that describes this tourist attraction as if you were giving a guided tour to a real person. " 
  //   +"Consider the following instructions:"
  //   //+"The tone and style should reflect a natural, engaging, and informative conversation between a tour guide and a tourist."
  //   +"Make sure to incorporate key facts and details from the Wikipedia article into your narrative, but present them in a way that is accessible and interesting to a listener. Avoid simply reciting information; instead, weave it into a compelling story. You can include anecdotes, historical context, and descriptive language to bring the attraction to life."
  //   +"* Divide the narrative into parts and before the beginning of the next part indicate its title, for example: \"Interesting facts\", \"Useful tips for visiting\", \"Historical background\", etc. But skip the titles for Introduction and Conclusion. "
  //   +"* In the beginning skip the greeting and start directly with the name of the attraction and short introduction to it. "
  //   //+"* If required can mention that it's our ${position} point of the excursion. "
  //   +"* Guiding the \"listener\" through different aspects or areas of the attraction (even if the Wikipedia article doesn't explicitly divide it). "
  //   +"* Providing historical context and interesting facts in a digestible manner. "
  //   +"* Using descriptive language to help the \"listener\" visualize the attraction. "
  //   +"* Add interesting facts that are known about this landmark. "
  //   +"* If there are any movies or books related to the landmark, provide information about it. "
  //   +"* If there are any famous people (actors, writers, singers, painters etc) associated with landmark you can mention it. "
  //   +"* If you know any useful tips for visiting, you can mention it. "
  //   //+"* Put SSML tag <break time=\"1000ms\"/> before and after the title of each section to indicate pauses. "
  //   //+"* Use SSML IPA markup language to place Stress markers. "
  //   //+"* Use ˈ to indicate correct stress in a names of toponims, landmarks and people. "
  //   +"* Maintaining a conversational and friendly tone."
  //   +"* Concluding with a summary or a lasting impression of the attraction. "
  //   +"* Generated text language must be: en-US. "
  //   +"* Generated text size must not exceed 5000 bytes. "
  //   +"Based on this information, please generate the tour guide speach. "
  //   +"Here is the HTML content of the Wikipedia article:";

  const topic = "Architectural Marvels";
  const topicDescription = "focusing on design, style evolution, materials, and the architects' intent";
  const itineraryNames = "Palacio de la Aduana, Palacio de Villacazar, Palacio de los Condes de Buenavista";
  const attractionName = "";

  const introPrompt = "You are an expert travel writer and audio guide script developer. Your task is to generate engaging, informative, and cohesive scripts for an audio tour. "
  + "### 1. Persona and Format "
  + "* **Target Format:** Audio guide script (narrative, engaging, descriptive, and easy to follow). "
  + "* **Tone/Voice:** **Knowledgeable, appreciative of detailed craftsmanship, and formal.** The emphasis should be on historical significance, design, materials, and architectural styles. "
  + "* **Length Constraint:** Each attraction script must be between **300 and 350 words**. "
  + "### 2. Tour Context "
  + "* **Tour Topic/Theme:** **"+topic+"** ("+topicDescription+"). "
  + "* **Itinerary:** The following attractions are part of this tour: **"+itineraryNames+"** "
  + "### 3. Instruction for Subsequent Requests "
  + "For each subsequent request, I will provide you with the name of a single attraction from the itinerary and a block of text containing relevant information, typically sourced from a Wikipedia page. "
  + "**Your response for each subsequent request must be:** "
  + "1.  A standalone, engaging audio guide script for the specified attraction. "
  + "2.  Tailored to emphasize information and details relevant to the **Tour Topic/Theme** provided above ("+topic+"). "
  + "3.  Strictly adhere to the **300-400 word** length. "
  + "4.  Begin with a captivating opening and end with a smooth transition or concluding thought. "
  + "5.  Do NOT include a title or introduction/conclusion that breaks the flow of the script. Start directly with the narrative. "

  const prompt = "**Generate the audio guide script for the attraction below.** "
  + "**Attraction Name:**"+attractionName+"** "
  + "**Wikipedia Data:** **"+wikipedia_page+"** ";

  const result = await sendGeminiRequest(wikipedia_page, prompt, generateTextFromWikiModelConfig);

  if(result && result.response && result.response.candidates && result.response.candidates[0].content){
    //console.log("text result: ",result.response.candidates[0].content);
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

    model.startChat({})

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