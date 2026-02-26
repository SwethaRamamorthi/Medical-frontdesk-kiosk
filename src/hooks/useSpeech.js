export function useSpeech() {
    const speak = (text, options = {}) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);

        // Auto-detect Tamil characters to assign correct language code
        const isTamil = /[\u0B80-\u0BFF]/.test(text);
        const targetLang = options.lang || (isTamil ? 'ta-IN' : 'en-IN');
        utter.lang = targetLang;

        // Try to explicitly set the voice for better native accents (if loaded)
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let voice = voices.find(v => v.lang.replace('_', '-') === targetLang);
            if (!voice) voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
            if (voice) utter.voice = voice;
        }

        utter.rate = options.rate || (isTamil ? 0.90 : 0.95); // Slightly slower for Tamil clarity
        utter.pitch = options.pitch || 1.1;
        utter.volume = options.volume || 1;
        window.speechSynthesis.speak(utter);
    };

    const stop = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    return { speak, stop };
}
