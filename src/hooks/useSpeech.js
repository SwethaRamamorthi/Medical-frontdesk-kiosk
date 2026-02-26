export function useSpeech() {
    const speak = (text, options = {}) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = options.lang || 'en-IN';
        utter.rate = options.rate || 0.95;
        utter.pitch = options.pitch || 1.1;
        utter.volume = options.volume || 1;
        window.speechSynthesis.speak(utter);
    };

    const stop = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    return { speak, stop };
}
