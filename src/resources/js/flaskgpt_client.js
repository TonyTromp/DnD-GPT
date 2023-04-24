
class FlaskGPT {
    #speechRecognition = false;

    constructor() {
      this.URL = '/gpt';
      var speech_api = window.SpeechRecognition || webkitSpeechRecognition;
      if (speech_api) {
        this.speechRecognition = new speech_api();
      }
      
    }

    addUserInput(message, callback) {
      let url = this.URL + `?user_input=${encodeURIComponent(message)}`;          
      fetch(url)
          .then((response) => response.json())
          .then((data) => {
            let content = data.content;
            callback({"result": content});
          }).catch((error) => {
            console.error("Error fetching GPT response:", error);
          });          
    }

    addSystemInput(message, callback) {
      let url = this.URL + `?system_input=${encodeURIComponent(message)}`;          
      fetch(url)
          .then((response) => response.json())
          .then((data) => {
            let content = data.content;
            callback({"result": content});
          }).catch((error) => {
            console.error("Error fetching GPT response:", error);
          });          
    }

    textToSpeech(message) {
      if (window.speechSynthesis) {
        var lines=message.split('.');
        const speechVoice = window.speechSynthesis.getVoices().filter(  (voice) => voice.name=="Google US English" )[0];

        for (var i=0; i<(lines.length); i++) {
          if (lines[i].length>1) {
            let utterance = new SpeechSynthesisUtterance(lines[i]+'.');
            utterance.voice = speechVoice;
            window.speechSynthesis.speak(utterance);     
          }
        }

      } else {
        throw new Error('window.speechSynthesis is not supported by this browser');
      }
    }

    speechToText(callback) {
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = "US-EN";

      this.speechRecognition.onresult = function(event) {
        var currentIndex=event.resultIndex;
        if (event.results[currentIndex].isFinal) {
          var result=event.results[currentIndex][0].transcript;
          event.currentTarget.stop();
          console.log('speechToText::'+ result);
          callback(result);
        }
      }

      this.speechRecognition.start();
    }


  }