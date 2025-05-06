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
 * Process a receipt image using OCR with minimal processing
 * to check Tesseract's raw recognition ability
 */
export const processReceipt = async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    console.log(`Processing receipt image: ${req.file.path}`);
    
    // Convert the image to JPG if it's not already (for better OCR compatibility)
    // But avoid any other preprocessing to test raw Tesseract performance
    const outputPath = req.file.path + '.simple.jpg';
    
    try {
      // Just convert to JPG without additional processing
      await sharp(req.file.path)
        .jpeg({ quality: 90 })
        .toFile(outputPath);
        
      console.log(`Converted to JPG at: ${outputPath}`);
    } catch (err) {
      console.error('Error converting image:', err);
      // If conversion fails, use original image
      outputPath = req.file.path;
    }
    
    // Use default Tesseract settings
    const result = await Tesseract.recognize(
      outputPath,
      'eng',  // English language
      {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
          }
        },
        // No additional configuration to test default behavior
      }
    );
    
    console.log('OCR processing complete');
    
    // Extract the raw recognized text
    const text = result.data.text;
    console.log('Raw recognized text:', text);
    
    // Look for numbers with decimal points (potential prices)
    const amountRegex = /\$?\s*(\d+\.\d{2})/g;
    const amounts = [];
    let match;
    
    while ((match = amountRegex.exec(text)) !== null) {
      amounts.push({
        amount: parseFloat(match[1]),
        position: match.index
      });
    }
    
    // Sort by amount (descending)
    amounts.sort((a, b) => b.amount - a.amount);
    
    // Find largest amount (likely to be the total)
    let amount = amounts.length > 0 ? amounts[0].amount.toString() : null;
    
    // Log all found amounts for debugging
    console.log('Found amounts:', amounts);
    
    // Send response with raw text and detected amounts
    res.json({
      success: !!amount,
      amount: amount,
      imagePath: req.file.path,
      convertedImagePath: outputPath !== req.file.path ? outputPath : null,
      recognizedText: text,
      allDetectedAmounts: amounts.map(a => a.amount)
    });
    
    // Keep the processed images for debugging
    
  } catch (error) {
    console.error("Error processing receipt:", error);
    res.status(500).json({ error: "Failed to process receipt image" });
  }
};