import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiSend, FiCopy, FiExternalLink } from 'react-icons/fi';
import { chatbotAPI } from '../../api';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/formatPrice';
import './ChatBot.css';

const SUGGESTIONS = [
  { label: '🛍️ Tìm sản phẩm mới', query: 'Tìm kiếm sản phẩm mới nhất' },
  { label: '🎟️ Nhận mã giảm giá', query: 'Mã giảm giá đang hoạt động' },
  { label: '🚚 Chính sách đổi trả & ship', query: 'Chính sách vận chuyển và đổi trả sản phẩm' },
  { label: '📞 Thông tin liên hệ', query: 'Địa chỉ cửa hàng và số điện thoại liên hệ' },
];

const ChatBot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('velvet_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Lỗi load chat history:', e);
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Xin chào! Mình là Trợ lý ảo VelvetStore. Mình có thể giúp bạn tìm kiếm mẫu quần áo, xem mã giảm giá cực hot hoặc giải đáp các chính sách mua hàng nhanh chóng. Bạn cần mình tư vấn gì hôm nay?',
        timestamp: new Date().toISOString(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Lưu lịch sử chat
  useEffect(() => {
    localStorage.setItem('velvet_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Tự động cuộn xuống dưới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim()) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Thêm tin nhắn của user vào hội thoại
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatbotAPI.query({ message: queryText });
      
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || 'Cảm ơn bạn! Mình đã tiếp nhận thông tin.',
        type: res.type || 'text',
        products: res.products || [],
        vouchers: res.vouchers || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Lỗi khi chat:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'Rất tiếc, mình đang gặp một chút sự cố kỹ thuật. Bạn vui lòng thử lại sau giây lát nhé!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã giảm giá: ${code}`);
  };

  const handleProductClick = (slug) => {
    navigate(`/san-pham/${slug}`);
    setIsOpen(false); // Đóng chat khi chuyển hướng xem sản phẩm
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử trò chuyện?')) {
      const defaultWelcome = [
        {
          id: 'welcome',
          sender: 'bot',
          text: 'Xin chào! Mình là Trợ lý ảo VelvetStore. Mình có thể giúp bạn tìm kiếm mẫu quần áo, xem mã giảm giá cực hot hoặc giải đáp các chính sách mua hàng nhanh chóng. Bạn cần mình tư vấn gì hôm nay?',
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(defaultWelcome);
      localStorage.setItem('velvet_chat_history', JSON.stringify(defaultWelcome));
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* 1. NÚT NỔI BONG BÓNG (FLOATING BUTTON) */}
      <button 
        className={`chatbot-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý tư vấn ảo"
      >
        <div className="avatar-wrapper">
          <img src="/chatbot_avatar.png" alt="Trợ lý ảo" className="chatbot-avatar-img" />
          <span className="online-indicator"></span>
        </div>
        <div className="chatbot-label">Tư vấn</div>
      </button>

      {/* 2. CỬA SỔ CHAT (SLIDE-OUT GLASSMORPHIC PANEL) */}
      <div className={`chatbot-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-info">
            <img src="/chatbot_avatar.png" alt="Trợ lý ảo" className="header-avatar" />
            <div>
              <h3>Trợ lý ảo Velvet</h3>
              <span className="status-text">
                <span className="status-dot"></span> Đang trực tuyến
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-clear-chat" onClick={handleClearHistory} title="Xóa lịch sử chat">
              Xóa lịch sử
            </button>
            <button className="btn-close-chat" onClick={() => setIsOpen(false)} title="Đóng chat">
              <FiX />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="chatbot-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender === 'user' ? 'msg-user' : 'msg-bot'}`}>
              <div className="message-content">
                <p className="message-text">{msg.text}</p>
                
                {/* HIỂN THỊ THẺ SẢN PHẨM TƯƠNG TÁC */}
                {msg.sender === 'bot' && msg.type === 'products' && msg.products?.length > 0 && (
                  <div className="chat-products-list">
                    {msg.products.map((p) => (
                      <div key={p.id} className="chat-product-card" onClick={() => handleProductClick(p.slug)}>
                        <div className="card-thumb">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} />
                          ) : (
                            <div className="empty-thumb">🛍️</div>
                          )}
                        </div>
                        <div className="card-info">
                          <h4 className="product-title">{p.name}</h4>
                          <div className="product-prices">
                            {p.salePrice ? (
                              <>
                                <span className="price-sale">{formatPrice(p.salePrice)}</span>
                                <span className="price-original">{formatPrice(p.price)}</span>
                              </>
                            ) : (
                              <span className="price-regular">{formatPrice(p.price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="card-link">
                          <FiExternalLink />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* HIỂN THỊ THẺ VOUCHER TƯƠNG TÁC */}
                {msg.sender === 'bot' && msg.type === 'vouchers' && msg.vouchers?.length > 0 && (
                  <div className="chat-vouchers-list">
                    {msg.vouchers.map((v) => (
                      <div 
                        key={v.id} 
                        className="chat-voucher-card" 
                        onClick={() => handleCopyVoucher(v.code)}
                        title="Click để sao chép mã"
                      >
                        <div className="voucher-details">
                          <span className="voucher-badge">
                            {v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${formatPrice(v.discountValue)}`}
                          </span>
                          <p className="voucher-desc">Đơn tối thiểu: {formatPrice(v.minOrderValue || 0)}</p>
                        </div>
                        <div className="voucher-code-copy">
                          <code>{v.code}</code>
                          <FiCopy className="copy-icon" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Typing Indicator khi đang chờ phản hồi */}
          {loading && (
            <div className="chat-message msg-bot">
              <div className="message-content typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="chatbot-suggestions">
          <div className="suggestions-scroll">
            {SUGGESTIONS.map((s, idx) => (
              <button 
                key={idx} 
                className="suggestion-chip" 
                onClick={() => handleSendMessage(s.query)}
                disabled={loading}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Footer */}
        <div className="chatbot-footer">
          <input
            type="text"
            placeholder="Hỏi trợ lý Velvet về sản phẩm, mã giảm giá..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button 
            className="btn-send-message" 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || loading}
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
