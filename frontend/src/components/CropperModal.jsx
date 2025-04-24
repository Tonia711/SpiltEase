import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./cropImage";
import styles from "../styles/CropperModal.module.css";

export default function CropperModal({ imageSrc, onClose, onCropDone }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        const size = Math.min(croppedPixels.width, croppedPixels.height);
        const squareCrop = {
            x: croppedPixels.x + (croppedPixels.width - size) / 2,
            y: croppedPixels.y + (croppedPixels.height - size) / 2,
            width: size,
            height: size,
        };
        setCroppedAreaPixels(squareCrop);
    }, []);


    const handleCropDone = async () => {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onCropDone(croppedImage);
    };

    return (
        <div className={styles.cropModal}>
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
            />
            <div className={styles.controls}>
                <button onClick={onClose} className={styles.cancel}>Cancel</button>
                <button onClick={handleCropDone}  className={styles.save}>Save</button>
            </div>
        </div>
    );
}
