import { Label } from "../db/schema.js";

// get all labels
export const getAllLabels = async (req, res) => {
    try {
        const labels = await Label.find();
        res.json(labels);
    } catch (err) {
        res.status(500).json({ error: "Failed to get labels" });
    }
};