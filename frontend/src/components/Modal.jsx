// File: src/components/Modal.jsx
import React from "react";
import ReactDOM from "react-dom";
import styles from "../styles/Modal.module.css";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
