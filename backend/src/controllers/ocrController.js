import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Azure Form Recognizer credentials
const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

/**
 * Process a receipt image using Azure Form Recognizer to extract the total amount
 * Uses the prebuilt receipt model that is specialized for receipt analysis
 */
export const processReceipt = async (req, res) => {
  try {
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    console.log(`Processing receipt image: ${req.file.path}`);
    
    // Check if Azure credentials are configured
    if (!endpoint || !apiKey) {
      return res.status(500).json({ 
        error: "Azure Form Recognizer credentials are not configured. Please set AZURE_FORM_RECOGNIZER_ENDPOINT and AZURE_FORM_RECOGNIZER_KEY environment variables."
      });
    }

    // Create the Azure Form Recognizer client
    const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

    // Read the image file
    const imageBuffer = await fs.readFile(req.file.path);
    
    // Analyze the receipt using the prebuilt receipt model
    console.log("Analyzing receipt with Azure Form Recognizer...");
    const poller = await client.beginAnalyzeDocument("prebuilt-receipt", imageBuffer);
    const result = await poller.pollUntilDone();

    console.log("Receipt analysis complete");

    if (!result || !result.documents || result.documents.length === 0) {
      return res.json({
        success: false,
        error: "Could not recognize receipt structure",
        imagePath: req.file.path
      });
    }

    // Extract receipt data from the results
    const receiptData = result.documents[0];
    console.log("Receipt fields detected:", JSON.stringify(receiptData.fields, null, 2));

    // Extract the total amount - Fixed extraction logic
    let amount = null;
    
    // Check for Total field
    if (receiptData.fields.Total) {
      if (receiptData.fields.Total.kind === 'number') {
        amount = receiptData.fields.Total.value;
      } else if (receiptData.fields.Total.kind === 'currency' && receiptData.fields.Total.value) {
        amount = receiptData.fields.Total.value.amount;
      } else if (receiptData.fields.Total.content) {
        // Try to parse from content
        const contentStr = receiptData.fields.Total.content;
        const numericValue = contentStr.replace(/[^0-9.]/g, '');
        if (numericValue) {
          amount = parseFloat(numericValue);
        }
      }
    }
    
    // If no Total found, check for TotalPrice field in items
    if (!amount && receiptData.fields.Items && receiptData.fields.Items.values) {
      for (const item of receiptData.fields.Items.values) {
        if (item.properties && item.properties.TotalPrice) {
          if (item.properties.TotalPrice.kind === 'number') {
            amount = item.properties.TotalPrice.value;
            break;
          } else if (item.properties.TotalPrice.content) {
            const contentStr = item.properties.TotalPrice.content;
            const numericValue = contentStr.replace(/[^0-9.]/g, '');
            if (numericValue) {
              amount = parseFloat(numericValue);
              break;
            }
          }
        }
      }
    }
    
    // Check SubTotal as backup
    if (!amount && receiptData.fields.SubTotal) {
      if (receiptData.fields.SubTotal.kind === 'number') {
        amount = receiptData.fields.SubTotal.value;
      } else if (receiptData.fields.SubTotal.kind === 'currency' && receiptData.fields.SubTotal.value) {
        amount = receiptData.fields.SubTotal.value.amount;
      }
    }

    // Extract text content for debugging
    const pages = result.pages || [];
    const recognizedText = pages.length > 0 
      ? pages[0].lines?.map(line => line.content).join(' ').substring(0, 200) + '...'
      : '';

    // Send response
    if (amount) {
      console.log("Extracted amount:", amount);
      
      res.json({
        success: true,
        amount: amount.toString(),
        imagePath: req.file.path,
        recognizedText,
        merchantName: receiptData.fields.MerchantName?.value || 'Unknown',
        transactionDate: receiptData.fields.TransactionDate?.content || null,
        receiptType: receiptData.docType || 'receipt'
      });
    } else {
      console.log("Failed to extract amount from receipt");
      res.json({
        success: false,
        error: "Could not recognize amount from receipt",
        imagePath: req.file.path,
        recognizedText
      });
    }
  } catch (error) {
    console.error("Error processing receipt:", error.message);
    res.status(500).json({ error: "Failed to process receipt image" });
  }
};