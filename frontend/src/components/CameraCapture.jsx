import React, { useRef, useState, useEffect } from 'react';
import styles from '../styles/CameraCapture.module.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);

  // Start camera when component mounts or when retaking photo
  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied or camera not available.');
    }
  };

  useEffect(() => {
    // Initialize camera when component mounts
    startCamera();

    // Clean up when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Take a picture from the video feed
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
      setIsCapturing(false);
      
      // Stop the camera stream after capturing
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Retake the image
  const retakeImage = () => {
    setCapturedImage(null);
    setIsCapturing(true);
    // Restart the camera
    startCamera();
  };

  // Confirm the captured image
  const confirmImage = () => {
    if (capturedImage && onCapture) {
      // Convert data URL to Blob
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          onCapture(blob, capturedImage);
        });
    }
  };

  // Handle close and ensure camera is stopped
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className={styles.cameraContainer}>
      <div className={styles.cameraHeader}>
        <button className={styles.closeButton} onClick={handleClose}>✕</button>
        <h3>Scan Receipt</h3>
        <div></div> {/* Empty div for flex spacing */}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {isCapturing ? (
        <>
          <div className={styles.videoContainer}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className={styles.videoFeed} 
            />
            <div className={styles.scanOverlay}>
              <div className={styles.scanArea}>
                <div className={styles.scannerCorner} style={{ top: 0, left: 0 }}></div>
                <div className={styles.scannerCorner} style={{ top: 0, right: 0 }}></div>
                <div className={styles.scannerCorner} style={{ bottom: 0, left: 0 }}></div>
                <div className={styles.scannerCorner} style={{ bottom: 0, right: 0 }}></div>
              </div>
            </div>
          </div>
          <button 
            onClick={captureImage} 
            className={styles.captureButton}
          >
            <div className={styles.captureCircle}></div>
          </button>
        </>
      ) : (
        <>
          <div className={styles.previewContainer}>
            <img 
              src={capturedImage} 
              alt="Captured receipt" 
              className={styles.previewImage} 
            />
          </div>
          <div className={styles.actionButtons}>
            <button 
              onClick={retakeImage} 
              className={styles.actionButton}
            >
              ↺
            </button>
            <button 
              onClick={confirmImage}
              className={styles.confirmButton}
            >
              ✓
            </button>
          </div>
        </>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCapture;