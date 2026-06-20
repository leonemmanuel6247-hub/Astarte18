import React, { useState, useEffect, useRef, useCallback } from 'react';
import { callLLM as callLLMProxy } from './services/googleSheets';
import { rechercherDocuments } from './services/bibliotheque';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Header from './components/Header';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      text: "✦ Bienvenue dans l'espace SuccessPolaris ✦\n\nJe suis Astarté, l'intelligence artificielle créée par TSEK, le Lion d'Astarté.\n\n📚 Je connais tous les documents de la bibliothèque.\n\n💬 Cherchez un document ou posez une question !",
      isUser: false,
      isDoc: false
    }
  ]);
  const [bibliotheque, setBibliotheque] = useState([]);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (text) => {
    if (isProcessing || !text.trim()) return;

    const userMsg = { text: text.trim(), isUser: true, isDoc: false };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const docResults = rechercherDocuments(text.trim(), bibliotheque);

    if (docResults.length > 0) {
      const docMsg = {
        text: "📚 Documents trouvés :",
        isUser: false,
        isDoc: true,
        documents: docResults
      };
      setMessages(prev => [...prev, docMsg]);
      setIsProcessing(false);
      return;
    }

    setMessages(prev => [...prev, { text: "...", isUser: false, isDoc: false, isTyping: true }]);

    try {
      const result = await callLLMProxy(text.trim());
      setCurrentProvider(result.provider);
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, {
          text: result.reply,
          isUser: false,
          isDoc: false,
          provider: result.provider
        }];
      });
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, {
          text: "Désolé, une erreur est survenue. Réessayez.",
          isUser: false,
          isDoc: false
        }];
      });
    }

    setIsProcessing(false);
  }, [isProcessing, bibliotheque]);

  return (
    <div className="chat-container">
      <Header providerName={currentProvider} />
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={isProcessing} />
      <div className="footer-note">
        SuccessPolaris · Intelligence Artificielle Astarté · Bibliothèque de documents
      </div>
    </div>
  );
}

export default App;
