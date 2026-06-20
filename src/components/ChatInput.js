import React, { useState } from 'react';
import './ChatInput.css';

function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (disabled || !input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="chat-input-area">
      <input
        type="text"
        className="chat-input"
        placeholder="Ex: 'caiman mathématique', 'Merlin Maths', 'mathématiques terminale'"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
      />
      <button
        className="send-button"
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
      >
        Envoyer
      </button>
    </div>
  );
}

export default ChatInput;
