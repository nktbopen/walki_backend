// textToSpeechService.ts

const API_KEY = "AIzaSyABWvoHN7DhrFfyf6FooWMMp2Hl0L8yHMg";
const BASE_URL =  "https://texttospeech.googleapis.com/v1/text:synthesize";

export const synthesizeSpeech = async (input_text: string): Promise<string|null> => {
    try {
        console.log("Start synthesizeSpeech");
        const request_body = {
            'input':{
                'text': input_text
            },
            'voice':{
                'languageCode':'en-us',
                'name':'en-US-Standard-J',
                'ssmlGender':'MALE',
            },
            'audioConfig':{
                'audioEncoding':'MP3',
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
        if(responseJson && responseJson.audioContent){
            console.log("Done synthesizeSpeech");
            return responseJson.audioContent;
        } else {
            console.error('Error in synthesizeSpeech:');
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