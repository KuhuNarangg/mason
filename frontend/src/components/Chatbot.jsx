import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, X, Send, Minus, Loader } from 'lucide-react';
import api from '../utils/api';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Mason\'s AI Fashion Assistant. How can I help you style your outfit or find products today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
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

  // Tooltip interval logic
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      return;
    }
    
    // Show tooltip randomly every 15-20 seconds
    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000); // Hide after 5s
    }, 15000);
    
    // Show it once shortly after load
    const initialTimer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
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
    if (!text) return '';
    // Basic bold formatting for **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Use setTimeout to allow state update before submitting
    setTimeout(() => {
      document.querySelector('.mason-chat-input-area button').click();
    }, 10);
  };

  if (!isOpen) {
    return (
      <div className="mason-chat-launcher-container">
        <div className={`mason-chat-tooltip ${showTooltip ? 'visible' : ''}`}>
          Need help? 👋
        </div>
        <button className="mason-chat-fab animated-bot" onClick={toggleChat} aria-label="Open AI Fashion Assistant">
          <Bot size={28} className="bot-icon-wobble" />
        </button>
      </div>
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

          {/* Fixed Suggested Questions */}
          <div className="mason-chat-suggestions-fixed">
            <button onClick={() => handleSuggestionClick("Show me your latest ethnic wear")}>Show me your latest ethnic wear</button>
            <button onClick={() => handleSuggestionClick("Can you customize couple t-shirts?")}>Can you customize couple t-shirts?</button>
            <button onClick={() => handleSuggestionClick("What is your return policy?")}>What is your return policy?</button>
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
