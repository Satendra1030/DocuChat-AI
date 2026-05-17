const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 60);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 100;
const MAX_STORED_CHARS = Number(process.env.MAX_STORED_CHARS || 750000);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 70000);
const UPLOAD_DIR = path.join(__dirname, "uploads");
const UPLOAD_PATH = path.join(UPLOAD_DIR, "doc.pdf");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        cb(null, "doc.pdf");
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const isPdf =
            file.mimetype === "application/pdf" ||
            file.originalname.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return cb(new Error("Only PDF files are supported."));
        }

        cb(null, true);
    },
    limits: {
        fileSize: MAX_UPLOAD_BYTES,
    },
});

// ================================
// STORE PDF TEXT
// ================================
let pdfText = "";
let pdfMeta = null;

// ================================
// HELPER FUNCTIONS
// ================================
function cleanText(text = "") {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function hasReadableText(text) {
    return text.replace(/\s/g, "").length >= MIN_EXTRACTED_CHARS;
}

function createUploadMiddleware(req, res, next) {
    upload.single("pdf")(req, res, (err) => {
        if (!err) {
            return next();
        }

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error: `PDF is too large. Maximum upload size is ${MAX_UPLOAD_MB}MB.`,
            });
        }

        return res.status(400).json({
            error: err.message || "Unable to upload PDF.",
        });
    });
}

function chunkText(text, maxChunkLength = 1800) {
    const words = text.split(/\s+/);
    const chunks = [];
    let current = "";

    for (const word of words) {
        if ((current + " " + word).trim().length > maxChunkLength) {
            if (current) chunks.push(current.trim());
            current = word;
        } else {
            current = `${current} ${word}`.trim();
        }
    }

    if (current) chunks.push(current.trim());
    return chunks;
}

function getQuestionTerms(question) {
    const commonWords = new Set([
        "about",
        "after",
        "again",
        "also",
        "and",
        "are",
        "can",
        "does",
        "for",
        "from",
        "give",
        "how",
        "into",
        "make",
        "notes",
        "pdf",
        "please",
        "summary",
        "tell",
        "that",
        "the",
        "this",
        "what",
        "when",
        "where",
        "which",
        "why",
        "with",
        "you",
    ]);

    return (
        question
            .toLowerCase()
            .match(/[a-z0-9]+/g)
            ?.filter((term) => term.length > 2 && !commonWords.has(term)) || []
    );
}

function selectRelevantContext(text, question) {
    if (text.length <= MAX_CONTEXT_CHARS) {
        return {
            context: text,
            selectedChunks: 1,
            totalChunks: 1,
        };
    }

    const chunks = chunkText(text);
    const terms = getQuestionTerms(question);

    const scoredChunks = chunks.map((chunk, index) => {
        const lowerChunk = chunk.toLowerCase();
        const score = terms.reduce((total, term) => {
            const matches = lowerChunk.match(new RegExp(`\\b${term}\\b`, "g"));
            return total + (matches ? matches.length : 0);
        }, 0);

        return { chunk, index, score };
    });

    const rankedChunks = scoredChunks.sort(
        (a, b) => b.score - a.score || a.index - b.index
    );

    const selected = [];
    let contextLength = 0;

    for (const item of rankedChunks) {
        if (selected.length > 0 && contextLength + item.chunk.length > MAX_CONTEXT_CHARS) {
            continue;
        }

        selected.push(item);
        contextLength += item.chunk.length;

        if (contextLength >= MAX_CONTEXT_CHARS) {
            break;
        }
    }

    const orderedSelection = selected.sort((a, b) => a.index - b.index);

    return {
        context: orderedSelection.map((item) => item.chunk).join("\n\n---\n\n"),
        selectedChunks: orderedSelection.length,
        totalChunks: chunks.length,
    };
}

// ================================
// ROUTE: UPLOAD PDF
// ================================
app.post("/upload", createUploadMiddleware, async (req, res) => {
    try {
        console.log("PDF received");

        if (!req.file) {
            return res.status(400).json({
                error: "No PDF uploaded.",
            });
        }

        const dataBuffer = fs.readFileSync(UPLOAD_PATH);
        const parsed = await pdfParse(dataBuffer);
        const extractedText = cleanText(parsed.text || "");

        if (!hasReadableText(extractedText)) {
            pdfText = "";
            pdfMeta = null;

            return res.status(422).json({
                error:
                    "This PDF looks scanned or image-only, so no readable text was found. Please upload a text-based PDF or run OCR on the scanned PDF first.",
            });
        }

        const wasTrimmed = extractedText.length > MAX_STORED_CHARS;
        pdfText = wasTrimmed
            ? extractedText.slice(0, MAX_STORED_CHARS)
            : extractedText;

        pdfMeta = {
            fileName: req.file.originalname,
            pages: parsed.numpages || 0,
            characters: pdfText.length,
            wasTrimmed,
        };

        console.log("PDF parsed successfully");
        console.log(`PDF Length: ${pdfText.length} characters`);

        res.json({
            message: wasTrimmed
                ? `PDF uploaded successfully. It is very large, so the first ${MAX_STORED_CHARS.toLocaleString()} characters were indexed.`
                : `PDF uploaded and processed successfully (${pdfMeta.pages} pages).`,
        });
    } catch (err) {
        console.error("Upload Error:", err);

        pdfText = "";
        pdfMeta = null;

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

        console.log("Question:", question);

        if (!pdfText || !pdfMeta) {
            return res.status(400).json({
                error: "Please upload a readable text-based PDF before asking questions.",
            });
        }

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Please enter a question.",
            });
        }

        const selectedContext = selectRelevantContext(pdfText, question);

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
${selectedContext.context}
==========================

DOCUMENT DETAILS:
- File: ${pdfMeta.fileName}
- Pages: ${pdfMeta.pages}
- Context chunks used: ${selectedContext.selectedChunks}/${selectedContext.totalChunks}

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
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional AI document assistant.",
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
            completion.choices[0]?.message?.content || "No answer generated.";

        console.log("Answer generated");

        res.json({ answer });
    } catch (err) {
        console.error("Ask Error:", err);

        res.status(500).json({
            error: err.message,
        });
    }
});

// ================================
// START SERVER
// ================================
app.listen(5001, () => {
    console.log("DocuChat AI running on http://localhost:5001");
});
