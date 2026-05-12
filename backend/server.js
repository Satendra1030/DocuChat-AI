
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();

// ================================
// GROQ SETUP
// ================================
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());

// ================================
// FILE UPLOAD SETUP
// ================================
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, "doc.pdf");
    },
});

const upload = multer({ storage });

// ================================
// STORE PDF TEXT
// ================================
let pdfText = "";

// ================================
// HELPER FUNCTION
// ================================
function cleanText(text) {
    return text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();
}

// ================================
// ROUTE: UPLOAD PDF
// ================================
app.post("/upload", upload.single("pdf"), async (req, res) => {
    try {
        console.log("📄 PDF received");

        const dataBuffer = fs.readFileSync("uploads/doc.pdf");

        const parsed = await pdfParse(dataBuffer);

        pdfText = cleanText(parsed.text);

        console.log("✅ PDF parsed successfully");
        console.log(`📚 PDF Length: ${pdfText.length} characters`);

        res.json({
            message: "PDF uploaded and processed successfully",
        });
    } catch (err) {
        console.error("❌ Upload Error:", err);

        res.status(500).json({
            error: err.message,
        });
    }
});

// ================================
// ROUTE: ASK QUESTION
// ================================
app.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;

        console.log("❓ Question:", question);

        if (
            !pdfText ||
            pdfText.length < 100 ||
            pdfText.includes("CamScanner")
        ) {
            return res.status(400).json({
                error:
                    "❌ Please upload a valid PDF before asking questions.",
            });
        }
        // ================================
        // SMART PROMPT
        // ================================
        const prompt = `
You are DocuChat AI, a premium AI study assistant.

Your task:
- Answer ONLY using the uploaded PDF
- Make responses visually structured
- Use professional formatting
- Use markdown formatting
- Make notes exam-oriented
- Make answers concise but high quality
- Avoid generic AI explanations
- Never repeat unnecessary information

==========================
PDF CONTENT:
${pdfText.slice(0, 580000)}
==========================

USER QUESTION:
${question}

STRICT RESPONSE RULES:

If the user asks for:
------------------------------------------------

1. Notes:
Format like:

# Topic Name

## Key Concepts
- point
- point

## Important Definitions
- definition

## Summary
short summary

------------------------------------------------

2. Important Questions:
Format like:

# Important Questions

1. Question
2. Question
3. Question

Then add:

# Most Important Topics
- topic
- topic

------------------------------------------------

3. Explanation:
Format like:

# Topic

## Explanation
simple explanation

## Key Points
- point
- point

## Example
example if available

------------------------------------------------

4. Summary:
Format like:

# Summary

## Main Points
- point
- point

## Conclusion
short conclusion

------------------------------------------------

IMPORTANT:
- Use proper markdown headings
- Use bullet points
- Use spacing
- Sound like premium educational software
- Do NOT sound robotic
`;
        // ================================
        // GROQ AI REQUEST
        // ================================
        const completion =
            await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a professional AI document assistant.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],

                model: "llama-3.3-70b-versatile",

                temperature: 0.3,

                max_tokens: 1024,
            });

        const answer =
            completion.choices[0]?.message?.content ||
            "No answer generated.";

        console.log("✅ Answer generated");

        res.json({ answer });
    } catch (err) {
        console.error("❌ Ask Error:", err);

        res.status(500).json({
            error: err.message,
        });
    }
});

// ================================
// START SERVER
// ================================
app.listen(5001, () => {
    console.log("🚀 DocuChat AI running on http://localhost:5001");
});