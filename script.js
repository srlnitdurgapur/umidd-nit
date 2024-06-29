
  $(document).ready(function(){
    $(".filter-button").click(function(){
      var value = $(this).attr('data-filter');
      
      if(value == "all") {
        
        $('.filter-video').show('1000');
      } else {
        
        $('.filter-video').not('.' + value).hide('3000');
        
        $('.filter-video').filter('.' + value).show('3000');
      }
    });

    if ($(".filter-button").removeClass("active")) {
      $(this).removeClass("active");
    }
    $(this).addClass("active");
  });





  document.addEventListener('DOMContentLoaded', function() {
    const gifs = document.querySelectorAll('.gif');
    let indianVoice = null;

  
    function setIndianVoice() {
      const voices = window.speechSynthesis.getVoices();
      indianVoice = voices.find(voice => voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('india'));

    
      if (!indianVoice) {
        indianVoice = voices[0];
      }
    }


    window.speechSynthesis.onvoiceschanged = function() {
      setIndianVoice();
    };

    gifs.forEach(gif => {
      gif.addEventListener('mouseover', function() {
        const speechText = this.getAttribute('data-speech');
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.voice = indianVoice;
        utterance.rate = 0.6; // Set speech rate (1.0 is the default, values less than 1.0 will slow it down)
        window.speechSynthesis.speak(utterance);
      });
    });
  });





  document.addEventListener('DOMContentLoaded', function () {
    const elements = document.querySelectorAll('.video-element, .caption p');
    const synth = window.speechSynthesis;
    const voiceOptions = synth.getVoices().filter(voice => voice.lang.includes('en-IN'));

    let currentUtterance;

    function speakText(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        if (text && synth) {
            currentUtterance = new SpeechSynthesisUtterance(text);
            currentUtterance.voice = voiceOptions.length > 0 ? voiceOptions[0] : synth.getVoices()[0];
            currentUtterance.rate = 0.8; // Set speech rate
            synth.speak(currentUtterance);
        }
    }

    function stopSpeaking() {
        if (synth.speaking) {
            synth.cancel();
        }
    }

    elements.forEach(element => {
        element.addEventListener('mouseover', () => {
            const textToSpeak = element.getAttribute('data-voice') || element.textContent.trim();
            speakText(textToSpeak);
        });

        element.addEventListener('mouseout', () => {
            stopSpeaking();
        });
    });
});


