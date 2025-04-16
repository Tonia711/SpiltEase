import express from "express";

const router = express.Router();

// OCR receipt
router.post("/receipt", (req, res) => {
  res.send("OCR receipt API");
});

export default router;