import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Preprocess image to improve OCR accuracy
 * @param {string} imagePath - Path to original image
 * @returns {Promise<string>} - Path to processed image
 */
const preprocessImage = async (imagePath) => {
  try {
    const outputPath = imagePath + '.processed.jpg';
    
    // Apply image preprocessing techniques to improve OCR
    await sharp(imagePath)
      // Convert to grayscale
      .grayscale()
      // Increase contrast
      .normalize()
      // Sharpen image
      .sharpen({ sigma: 1.5 })
      // Resize if needed (keeping aspect ratio but ensuring reasonable size)
      .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
      // Save processed image
      .toFile(outputPath);
    
    console.log(`Image preprocessed: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    // Return original image path if preprocessing fails
    return imagePath;
  }
};

/**
 * Extract total amount from OCR-processed text using a specific regex pattern
 * @param {string} text - The OCR processed text
 * @returns {string|null} - The extracted amount or null if not found
 */
const extractTotalAmount = (text) => {
  // Clean up text: remove multiple spaces, join split lines
  const cleanedText = text
    .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
    .replace(/\n/g, ' ')          // Replace newlines with spaces
    .replace(/TOTAL\s*-—\s*(\d+[\.,]\d{2})/i, 'TOTAL $1'); // Fix common misrecognition pattern

  // Check for specific pattern: "TOTAL" followed by amount, possibly spread across lines
  const totalPattern = /(?:TOTAL|Total|total)(?:[^\d$€£¥]*?(?:(?:including|incl\.?|inc\.?)?(?:\s+GST|\s+tax|:|\s+of|\s+\([^)]*\))?)?)\s+(?:NZD\s*)?[$€£¥]?\s*(\d+\.\d{2})/i;
  
  // Try the pattern on the cleaned text
  const match = cleanedText.match(totalPattern);
  if (match && match[1]) {
    console.log("Matched amount:", match[1]);
    return match[1];
  }

  console.log("No amount found in text with the specified pattern");
  return null;
};

/**
 * Process a receipt image using OCR to extract the total amount
 * Uses Tesseract.js for OCR text recognition with optimized settings
 */
export const processReceipt = async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    console.log(`Processing receipt image: ${req.file.path}`);
    
    // Preprocess the image to improve OCR accuracy
    const processedImagePath = await preprocessImage(req.file.path);
    
    // Optimize Tesseract configuration for receipts
    const tessConfig = {
      // Use page segmentation mode 3 (fully automatic page segmentation, but no OSD)
      tessedit_pageseg_mode: '3',
      // Improve number recognition
      tessedit_ocr_engine_mode: '1'  // Use LSTM neural network mode
    };
    
    // Recognize text from the image using Tesseract.js
    const result = await Tesseract.recognize(
      processedImagePath,
      'eng', // English language
      { 
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
          }
        },
        ...tessConfig
      }
    );
    
    console.log('OCR processing complete');
    
    // Extract the recognized text
    const text = result.data.text;
    console.log('Extracted text:', text);
    
    // Extract the total amount from the recognized text
    let amount = extractTotalAmount(text);
    
    // Send appropriate response based on whether an amount was found
    if (amount) {
      res.json({
        success: true,
        amount: amount,
        imagePath: req.file.path,
        recognizedText: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
    } else {
      res.json({
        success: false,
        error: "Could not recognize amount from receipt",
        imagePath: req.file.path,
        recognizedText: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
    }
    
    // Clean up processed image if it was created
    if (processedImagePath !== req.file.path) {
      fs.unlink(processedImagePath).catch(err => {
        console.error('Error removing processed image:', err);
      });
    }
  } catch (error) {
    console.error("Error processing receipt:", error);
    res.status(500).json({ error: "Failed to process receipt image" });
  }
};