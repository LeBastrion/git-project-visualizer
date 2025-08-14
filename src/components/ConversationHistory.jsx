import React, { useState, useEffect } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/ConversationHistory.css';

const ConversationHistory = ({ currentTime, selectedCommit }) => {
  const { conversations, fetchConversations } = useGitData();
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [expandedConversations, setExpandedConversations] = useState(new Set());

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && currentTime) {
      const filtered = conversations.filter(conv => {
        const convTime = new Date(conv.timestamp).getTime();
        return convTime <= currentTime;
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [conversations, currentTime]);

  const toggleConversation = (id) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedConversations(newExpanded);
  };

  const getAgentColor = (agent) => {
    const colors = {
      'agent_1': '#4a9eff',
      'agent_2': '#ff9f40',
      'agent_3': '#40ff9f',
      'agent_4': '#ff40ff',
      'orchestrator': '#ffff40'
    };
    return colors[agent] || '#888';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    if (!message) return null;
    
    return (
      <div 
        className="message"
        style={{ borderLeftColor: getAgentColor(message.agent) }}
      >
        <div className="message-header">
          <span className="agent-name" style={{ color: getAgentColor(message.agent) }}>
            {message.agent}
          </span>
          <span className="message-time">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <div className="message-content">
          {message.content}
        </div>
        {message.relatedFiles && message.relatedFiles.length > 0 && (
          <div className="related-files">
            <span className="label">Files:</span>
            {message.relatedFiles.map((file, i) => (
              <span key={i} className="file-tag">{file}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="conversation-history">
      <div className="conversation-header">
        <h3>Agent Conversations</h3>
        <span className="conversation-count">{filteredConversations.length} threads</span>
      </div>
      
      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations found</p>
            <p className="hint">Conversations will appear here when agents interact</p>
          </div>
        ) : (
          filteredConversations.map((conv, index) => {
            const isExpanded = expandedConversations.has(conv.id || index);
            const isRelatedToCommit = selectedCommit && 
              Math.abs(new Date(conv.timestamp) - new Date(selectedCommit.date)) < 60000;
            
            return (
              <div 
                key={conv.id || index} 
                className={`conversation-thread ${isRelatedToCommit ? 'related-to-commit' : ''}`}
              >
                <div 
                  className="thread-header"
                  onClick={() => toggleConversation(conv.id || index)}
                >
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="thread-title">
                    {conv.title || `Thread ${index + 1}`}
                  </span>
                  <span className="thread-time">
                    {formatTimestamp(conv.timestamp)}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="thread-messages">
                    {conv.messages ? (
                      conv.messages.map((msg, i) => (
                        <div key={i}>{renderMessage(msg)}</div>
                      ))
                    ) : (
                      renderMessage(conv)
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;