import { createContext, useContext, useState } from 'react';
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import './ModalContext.css';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning', // warning, danger, success, info
  });

  const showModal = (message, type = 'warning', title = '') => {
    let defaultTitle = 'Thông báo';
    if (type === 'warning') defaultTitle = 'Cảnh báo';
    if (type === 'danger') defaultTitle = 'Lỗi';
    if (type === 'success') defaultTitle = 'Thành công';

    setModal({
      isOpen: true,
      title: title || defaultTitle,
      message,
      type,
    });
  };

  const hideModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const getIcon = () => {
    switch (modal.type) {
      case 'warning':
        return <FiAlertTriangle className="global-modal-icon warning" size={48} />;
      case 'danger':
        return <FiXCircle className="global-modal-icon danger" size={48} />;
      case 'success':
        return <FiCheckCircle className="global-modal-icon success" size={48} />;
      case 'info':
      default:
        return <FiInfo className="global-modal-icon info" size={48} />;
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal.isOpen && (
        <div className="global-modal-overlay" onClick={hideModal}>
          <div className="global-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="global-modal-close" onClick={hideModal}>
              <FiX size={20} />
            </button>
            <div className="global-modal-body">
              <div className="global-modal-icon-wrapper">
                {getIcon()}
              </div>
              <h3 className={`global-modal-title ${modal.type}`}>{modal.title}</h3>
              <p className="global-modal-message">{modal.message}</p>
              <div className="global-modal-actions">
                <button className={`global-btn-confirm ${modal.type}`} onClick={hideModal}>
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
