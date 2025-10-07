import React, { useState, useRef, useEffect } from 'react';
import { inspectorService } from './inspserv';

const Chatbot = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your railway maintenance assistant. How can I help you with work orders, defects, or maintenance tasks today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await inspectorService.sendChatbotQuery(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '600px',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '20px 20px 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    messagesContainer: {
      flex: 1,
      padding: '1rem',
      overflowY: 'auto',
      background: '#f8fafc'
    },
    message: {
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column'
    },
    userMessage: {
      alignItems: 'flex-end'
    },
    botMessage: {
      alignItems: 'flex-start'
    },
    messageBubble: {
      maxWidth: '80%',
      padding: '0.75rem 1rem',
      borderRadius: '18px',
      fontSize: '0.9rem',
      lineHeight: '1.4'
    },
    userBubble: {
      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      color: 'white',
      borderBottomRightRadius: '4px'
    },
    botBubble: {
      background: 'white',
      color: '#1f2937',
      border: '1px solid #e5e7eb',
      borderBottomLeftRadius: '4px'
    },
    inputContainer: {
      padding: '1rem',
      borderTop: '1px solid #e5e7eb',
      background: 'white',
      borderRadius: '0 0 20px 20px'
    },
    inputForm: {
      display: 'flex',
      gap: '0.5rem'
    },
    input: {
      flex: 1,
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '0.9rem',
      outline: 'none'
    },
    sendButton: {
      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontSize: '0.9rem'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#6b7280',
      fontSize: '0.8rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem'
        }}>
          🤖
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '1rem' }}>Maintenance Assistant</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Online • Railway AI</div>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.message,
              ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
            }}
          >
            <div
              style={{
                ...styles.messageBubble,
                ...(message.sender === 'user' ? styles.userBubble : styles.botBubble)
              }}
            >
              {message.text.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              marginTop: '0.25rem',
              padding: '0 0.5rem'
            }}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={styles.message}>
            <div style={{ ...styles.messageBubble, ...styles.botBubble }}>
              <div style={styles.loading}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #0f766e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about work orders, defects, maintenance..."
            style={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={isLoading || !inputMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Chatbot;