// File: src/components/MobileFrame.jsx
import React from "react";
import styles from "../styles/MobileFrame.module.css";

export default function MobileFrame({ children }) {
  return <div className={styles.frame}>{children}</div>;
}
