// textToSpeechService.ts
import { voicesList, VoiceCodeKey} from "../constants/Voices";

const API_KEY = "AIzaSyABWvoHN7DhrFfyf6FooWMMp2Hl0L8yHMg";
const BASE_URL =  "https://texttospeech.googleapis.com/v1/text:synthesize";

export const synthesizeSpeech = async (input_text: string, language: string): Promise<string|null> => {
    try {
        //console.log("Start synthesizeSpeech");
        //console.log('text:',input_text);
        const languageCode = language as VoiceCodeKey;
        const voiceCode = voicesList[languageCode];
        const request_body = {
            'input':{
                //'text': input_text
                'ssml': '<speak>'+input_text+'</speak>'
            },
            'voice':{
                'languageCode': languageCode,//'en-us', //'ru-RU', 
                'name': voiceCode,//'en-US-Standard-I', //'ru-RU-Standard-D',
                'ssmlGender':'MALE',
            },
            'audioConfig':{
                'audioEncoding':'MP3',
                //'speakingRate': 0.9,
                "effectsProfileId": [
                    "headphone-class-device"
                ],
            }
        };
        const response = await fetch(
            `${BASE_URL}?key=${API_KEY}`, 
            {
                method: 'POST',
                body: JSON.stringify(request_body),
            }
        );
        const responseJson = await response.json();
        //console.log("responseJson:",responseJson);
        if(responseJson && responseJson.audioContent){
            console.log("Done synthesizeSpeech");
            return responseJson.audioContent;
        } else {
            console.error('Error in synthesizeSpeech:',responseJson);
            return null; // Return null in case of error
        }
        // const audioBlob = toBlob(responseJson.audioContent, 'audio/mpeg');
        // const audioUrl = URL.createObjectURL(audioBlob);
        // return audioUrl;
    } catch (error) {
        console.error('Error in synthesizeSpeech:', error);
        return null; // Return an empty array in case of error
    }
};