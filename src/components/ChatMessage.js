import React from 'react';
import './ChatMessage.css';

function ChatMessage({ message }) {
  const { text, isUser, isDoc, documents, isTyping, provider } = message;

  if (isTyping) {
    return (
      <div className="message bot">
        <div className="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    );
  }

  if (isDoc && documents) {
    return (
      <div className="message bot">
        <div className="message-content">
          <strong>{text}</strong>
          {documents.map((doc, i) => (
            <div key={i} className="doc-result">
              <div className="doc-title">{doc.titre}</div>
              {doc.chemin && <div className="doc-path">{doc.chemin}</div>}
              {doc.description && <div className="doc-desc">{doc.description}</div>}
              {doc.lien && (
                <a href={doc.lien} target="_blank" rel="noopener noreferrer" className="doc-link">
                  Ouvrir le document
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {text.split('\n').map((line, i) => (
          <span key={i}>{line}<br /></span>
        ))}
      </div>
      {!isUser && provider && (
        <div className="message-info">via {provider}</div>
      )}
    </div>
  );
}

export default ChatMessage;
