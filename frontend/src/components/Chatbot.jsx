import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minus, Loader } from 'lucide-react';
import api from '../utils/api';
import './Chatbot.css';
import { Link } from 'react-router-dom';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Mason\'s AI Fashion Assistant. How can I help you style your outfit or find products today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await api.post('/chat', { messages: newMessages });
      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to my brain right now. Please try again later.' }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request. Our styling servers might be busy.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format markdown in response (bolding product names/prices)
  const formatMessage = (text) => {
    // Basic bold formatting for **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) {
    return (
      <button className="mason-chat-fab" onClick={toggleChat} aria-label="Open AI Fashion Assistant">
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className={`mason-chat-container ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="mason-chat-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="mason-chat-header-info">
          <div className="mason-chat-avatar">
            <img src="/logofinalnobg.png" alt="Mason" />
          </div>
          <div className="mason-chat-title">
            <h3>Mason AI Stylist</h3>
            <span className="mason-chat-status">Online</span>
          </div>
        </div>
        <div className="mason-chat-actions">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} aria-label="Minimize Chat">
            <Minus size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeChat(); }} aria-label="Close Chat">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      {!isMinimized && (
        <>
          <div className="mason-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`mason-chat-message ${msg.role}`}>
                <div className="mason-chat-bubble">
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mason-chat-message assistant">
                <div className="mason-chat-bubble loading-bubble">
                  <Loader size={16} className="animate-spin" />
                  <span>Styling...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="mason-chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask about outfits, sizes, or customizations..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chatbot;
