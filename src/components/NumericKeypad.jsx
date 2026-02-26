export default function NumericKeypad({ value, onChange, maxLength = 12 }) {
    const append = (digit) => {
        if (value.length < maxLength) onChange(value + digit);
    };
    const backspace = () => onChange(value.slice(0, -1));
    const clear = () => onChange('');

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✕'];

    return (
        <div className="keypad-grid">
            {keys.map((k) => {
                let cls = 'keypad-btn';
                if (k === '⌫') cls += ' danger';
                if (k === '✕') cls += ' danger';
                return (
                    <button
                        key={k}
                        className={cls}
                        onClick={() => {
                            if (k === '⌫') backspace();
                            else if (k === '✕') clear();
                            else append(k);
                        }}
                    >
                        {k}
                    </button>
                );
            })}
        </div>
    );
}
