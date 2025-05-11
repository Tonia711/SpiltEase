import request from "supertest";
import { describe, it, expect, vi, beforeAll } from "vitest";
import path from "path";
import app from "../../../app.js"; 

vi.mock("@azure/ai-form-recognizer", async () => {
  return {
    AzureKeyCredential: class {
      constructor() {}
    },
    DocumentAnalysisClient: class {
      constructor() {}
      async beginAnalyzeDocument() {
        return {
          pollUntilDone: async () => ({
            documents: [
              {
                fields: {
                  Total: { kind: "number", value: 42.5 },
                  MerchantName: { kind: "string", value: "Test Store" },
                  TransactionDate: { kind: "date", value: "2024-05-01" },
                }
              }
            ],
            pages: [
              {
                lines: [
                  { content: "Test Store $42.50" },
                  { content: "Date: 01/05/2024" }
                ]
              }
            ]
          })
        };
      }
    }
  };
});

describe("POST /api/ocr/receipt", () => {
  it("should extract amount, merchant, and date from uploaded receipt", async () => {
    const testImagePath = path.resolve("public/uploads/ocr_testing.jpg"); 

    const response = await request(app)
      .post("/api/ocr/receipt")
      .attach("image", testImagePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.imagePath).toBeTruthy();
  });

  it("should return error if no image is uploaded", async () => {
    const response = await request(app).post("/api/ocr/receipt");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("No image provided");
  });
});
