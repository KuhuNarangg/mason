import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, X, Send, Minus, Loader, FileText, SendHorizontal } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Chatbot.css';

const Chatbot = () => {
  const { user, isAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Mason\'s AI Fashion Assistant. How can I help you style your outfit or find products today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Leave a Query Form state
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryPhone, setQueryPhone] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);

  const messagesEndRef = useRef(null);

  // Pre-fill user data when user changes or query form opens
  useEffect(() => {
    if (isAuth && user) {
      setQueryName(user.name || '');
      setQueryEmail(user.email || '');
      setQueryPhone(user.phone || '');
    }
  }, [isAuth, user, showQueryForm]);

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
    setShowQueryForm(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showQueryForm]);

  // Tooltip interval logic
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      return;
    }
    
    const interval = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 15000);
    
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
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request. You can leave a query with our team if needed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openQueryModal = (initialMessage = '') => {
    // Determine last user message if no initialMessage passed
    let lastMsg = initialMessage;
    if (!lastMsg) {
      const userMsgs = messages.filter(m => m.role === 'user');
      if (userMsgs.length > 0) {
        lastMsg = userMsgs[userMsgs.length - 1].content;
      }
    }
    setQueryMessage(lastMsg || '');
    setShowQueryForm(true);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryName.trim() || !queryEmail.trim() || !queryMessage.trim()) return;

    setIsSubmittingQuery(true);
    try {
      const payload = {
        name: queryName.trim(),
        email: queryEmail.trim(),
        phone: queryPhone.trim(),
        query: queryMessage.trim(),
        source: 'AI Chatbot'
      };

      await api.post('/queries', payload);

      setShowQueryForm(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Thank you! Your query has been submitted to our team. One of our representatives will get in touch with you shortly.'
        }
      ]);
    } catch (error) {
      console.error("Query Submit Error:", error);
      alert('Failed to submit query. Please try again.');
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  // Format markdown in response (bolding product names/prices)
  const formatMessage = (text) => {
    if (!text) return '';
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
    setTimeout(() => {
      document.querySelector('.mason-chat-input-area button')?.click();
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
          {showQueryForm ? (
            /* In-Chat Escalation Form */
            <div className="mason-chat-query-form-view">
              <div className="mason-query-form-header">
                <h4>Leave a Query 📝</h4>
                <button onClick={() => setShowQueryForm(false)} className="close-query-btn">
                  <X size={16} />
                </button>
              </div>
              <p className="mason-query-form-desc">
                {isAuth && user ? (
                  <>Logged in as <strong>{user.name}</strong> ({user.email}). Leave your query below!</>
                ) : (
                  <>Please leave your details below and a team representative will contact you.</>
                )}
              </p>

              <form onSubmit={handleQuerySubmit} className="mason-query-form">
                {!isAuth && (
                  <>
                    <div className="query-field">
                      <label>Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Your full name"
                        value={queryName}
                        onChange={(e) => setQueryName(e.target.value)}
                      />
                    </div>
                    <div className="query-field">
                      <label>Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={queryEmail}
                        onChange={(e) => setQueryEmail(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="query-field">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 Mobile number"
                    value={queryPhone}
                    onChange={(e) => setQueryPhone(e.target.value)}
                  />
                </div>

                <div className="query-field">
                  <label>Query / Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your question or customization request..."
                    value={queryMessage}
                    onChange={(e) => setQueryMessage(e.target.value)}
                  />
                </div>

                <div className="query-form-actions">
                  <button type="button" className="btn-cancel-query" onClick={() => setShowQueryForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit-query" disabled={isSubmittingQuery}>
                    {isSubmittingQuery ? 'Submitting...' : 'Submit Query'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Normal Chat View */
            <>
              <div className="mason-chat-messages">
                {messages.map((msg, index) => {
                  const isAssistant = msg.role === 'assistant';
                  const offersQuery = isAssistant && (
                    msg.content.toLowerCase().includes("couldn't confirm") ||
                    msg.content.toLowerCase().includes("leave a query") ||
                    msg.content.toLowerCase().includes("contact details")
                  );

                  return (
                    <div key={index} className={`mason-chat-message ${msg.role}`}>
                      <div className="mason-chat-bubble">
                        {formatMessage(msg.content)}

                        {offersQuery && (
                          <button className="inline-query-btn" onClick={() => openQueryModal()}>
                            📝 Leave a Query for Representative
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

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

              {/* Fixed Suggested Questions & Escalation Quick Button */}
              <div className="mason-chat-suggestions-fixed">
                <button
                  className="leave-query-action-btn"
                  onClick={() => openQueryModal()}
                >
                  📝 Leave a Query
                </button>
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
        </>
      )}
    </div>
  );
};

export default Chatbot;
