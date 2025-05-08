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
 * Process a receipt image using Azure Form Recognizer to extract the total amount and merchant name
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

    // Extract data - initialize result values
    let extractedAmount = null;
    let extractedMerchantName = null;
    let extractedDate = null;
    let anyFieldExtracted = false;
    
    // Extract the total amount
    if (receiptData.fields.Total) {
      if (receiptData.fields.Total.kind === 'number') {
        extractedAmount = receiptData.fields.Total.value;
        anyFieldExtracted = true;
      } else if (receiptData.fields.Total.kind === 'currency' && receiptData.fields.Total.value) {
        extractedAmount = receiptData.fields.Total.value.amount;
        anyFieldExtracted = true;
      } else if (receiptData.fields.Total.content) {
        // Try to parse from content
        const contentStr = receiptData.fields.Total.content;
        const numericValue = contentStr.replace(/[^0-9.]/g, '');
        if (numericValue) {
          extractedAmount = parseFloat(numericValue);
          anyFieldExtracted = true;
        }
      }
    }
    
    // If no Total found, check for TotalPrice field in items
    if (!extractedAmount && receiptData.fields.Items && receiptData.fields.Items.values) {
      for (const item of receiptData.fields.Items.values) {
        if (item.properties && item.properties.TotalPrice) {
          if (item.properties.TotalPrice.kind === 'number') {
            extractedAmount = item.properties.TotalPrice.value;
            anyFieldExtracted = true;
            break;
          } else if (item.properties.TotalPrice.content) {
            const contentStr = item.properties.TotalPrice.content;
            const numericValue = contentStr.replace(/[^0-9.]/g, '');
            if (numericValue) {
              extractedAmount = parseFloat(numericValue);
              anyFieldExtracted = true;
              break;
            }
          }
        }
      }
    }
    
    // Check SubTotal as backup
    if (!extractedAmount && receiptData.fields.SubTotal) {
      if (receiptData.fields.SubTotal.kind === 'number') {
        extractedAmount = receiptData.fields.SubTotal.value;
        anyFieldExtracted = true;
      } else if (receiptData.fields.SubTotal.kind === 'currency' && receiptData.fields.SubTotal.value) {
        extractedAmount = receiptData.fields.SubTotal.value.amount;
        anyFieldExtracted = true;
      }
    }

    console.log("Extracted amount:", extractedAmount);

    // Extract the merchant name
    if (receiptData.fields.MerchantName) {
      if (receiptData.fields.MerchantName.kind === 'string') {
        extractedMerchantName = receiptData.fields.MerchantName.value;
        anyFieldExtracted = true;
      } else if (receiptData.fields.MerchantName.content) {
        extractedMerchantName = receiptData.fields.MerchantName.content;
        anyFieldExtracted = true;
      }
    }
    
    console.log("Extracted merchant name:", extractedMerchantName);

    // Extract date if available
    if (receiptData.fields.TransactionDate) {
      if (receiptData.fields.TransactionDate.kind === 'date' && receiptData.fields.TransactionDate.value) {
        // For date objects, convert to ISO string and then extract just the date part
        extractedDate = new Date(receiptData.fields.TransactionDate.value).toISOString().split('T')[0];
        anyFieldExtracted = true;
      } else if (receiptData.fields.TransactionDate.content) {
        // Try to parse and format the date from content
        try {
          const dateStr = receiptData.fields.TransactionDate.content;
          console.log("Trying to parse date from:", dateStr);
          
          // Handle date formats like "05 May 25"
          if (/\d{1,2}\s+[A-Za-z]+\s+\d{2,4}/.test(dateStr)) {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              extractedDate = parsedDate.toISOString().split('T')[0];
              anyFieldExtracted = true;
              console.log("Successfully parsed word-format date:", extractedDate);
            }
          } 
          // Handle formats like DD/MM/YYYY, MM/DD/YYYY, etc.
          else {
            const dateParts = dateStr.split(/[-\/\.]/);
            
            // Check if we have a recognizable date format with 3 parts (day/month/year)
            if (dateParts.length === 3) {
              let year, month, day;
              
              // Try to determine the date format
              // Check if first part is likely a day (1-31) and third part is a 4-digit year
              if (parseInt(dateParts[0]) <= 31 && dateParts[2].length === 4) {
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]);
                year = parseInt(dateParts[2]);
              } 
              // Check if first part is likely a month (1-12) and third part is a 4-digit year
              else if (parseInt(dateParts[0]) <= 12 && dateParts[2].length === 4) {
                month = parseInt(dateParts[0]);
                day = parseInt(dateParts[1]);
                year = parseInt(dateParts[2]);
              }
              // If year is at the beginning (YYYY-MM-DD format)
              else if (dateParts[0].length === 4) {
                year = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]);
                day = parseInt(dateParts[2]);
              }
              // Handle 2-digit year format (convert to 4 digits)
              else if (dateParts[2].length === 2) {
                // Assume 20XX for years less than 50, 19XX for years >= 50
                year = parseInt(dateParts[2]) < 50 ? 2000 + parseInt(dateParts[2]) : 1900 + parseInt(dateParts[2]);
                
                // Determine if day/month or month/day based on values
                if (parseInt(dateParts[0]) <= 12 && parseInt(dateParts[1]) > 12) {
                  month = parseInt(dateParts[0]);
                  day = parseInt(dateParts[1]);
                } else {
                  day = parseInt(dateParts[0]);
                  month = parseInt(dateParts[1]);
                }
              }
              
              // Create date if we have valid parts
              if (year && month && day) {
                const date = new Date(year, month - 1, day);
                extractedDate = date.toISOString().split('T')[0];
                anyFieldExtracted = true;
                console.log("Successfully parsed date parts:", extractedDate);
              }
            }
          }
        } catch (e) {
          console.log("Failed to parse transaction date:", e);
        }
      }
    }
    
    console.log("Extracted date:", extractedDate);

    // Extract text content for debugging
    const pages = result.pages || [];
    const recognizedText = pages.length > 0 
      ? pages[0].lines?.map(line => line.content).join(' ').substring(0, 200) + '...'
      : '';

    // Format response based on what was extracted
    if (anyFieldExtracted) {
      // Create a standard response object with explicit fields
      const responseData = {
        success: true,
        imagePath: req.file.path,
        recognizedText,
        amountExtracted: extractedAmount !== null,
        merchantNameExtracted: extractedMerchantName !== null
      };
      
      // Add amount if extracted
      if (extractedAmount !== null) {
        responseData.amount = extractedAmount.toString();
      }
      
      // Add merchant name if extracted
      if (extractedMerchantName !== null) {
        responseData.merchantName = extractedMerchantName;
      }
      
      // Add date if available
      if (extractedDate !== null) {
        responseData.transactionDate = extractedDate;
      }
      
      // Add debugging log to verify response structure
      console.log("Sending OCR response:", JSON.stringify(responseData, null, 2));
      
      res.json(responseData);
    } else {
      // Nothing useful was extracted
      const errorResponse = {
        success: false,
        error: "Could not extract any useful information from receipt",
        imagePath: req.file.path,
        recognizedText
      };
      console.log("Sending error response:", JSON.stringify(errorResponse, null, 2));
      res.json(errorResponse);
    }
  } catch (error) {
    console.error("Error processing receipt:", error.message);
    // In case of error, return error message
    res.status(500).json({ 
      error: "Failed to process receipt image"
    });
  }
};