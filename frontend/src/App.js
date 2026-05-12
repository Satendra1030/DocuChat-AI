import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [displayedAnswer, setDisplayedAnswer] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] =
    useState(false);
  const [darkMode, setDarkMode] =
    useState(true);

  // =========================================
  // THEME
  // =========================================
  const theme = {
    background: darkMode
      ? "linear-gradient(to bottom right, #020617, #111827)"
      : "#f1f5f9",

    card: darkMode
      ? "rgba(30, 41, 59, 0.85)"
      : "#ffffff",

    sidebar: darkMode
      ? "rgba(15, 23, 42, 0.95)"
      : "#ffffff",

    text: darkMode ? "#ffffff" : "#0f172a",

    secondary: darkMode
      ? "#94a3b8"
      : "#475569",

    input: darkMode
      ? "#0f172a"
      : "#f8fafc",

    border: darkMode
      ? "#334155"
      : "#cbd5e1",
  };

  // =========================================
  // HANDLE PDF UPLOAD
  // =========================================
  const uploadPDF = async (selectedFile) => {
    if (!selectedFile) return;

    // ONLY PDF VALIDATION
    if (
      selectedFile.type !== "application/pdf"
    ) {
      setError("Please upload a PDF file only.");
      return;
    }

    setFileName(selectedFile.name);
    setStatus("Uploading and processing PDF...");
    setError("");
    setAnswer("");
    setDisplayedAnswer("");

    try {
      const formData = new FormData();

      formData.append("pdf", selectedFile);

      const res = await axios.post(
        "https://docuchat-backend-2rbd.onrender.com/upload",
        formData
      );

      setStatus(res.data.message);

    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message;

      setError(msg);
      setStatus("");
      setAnswer("");
      setDisplayedAnswer("");

      console.error(err);
    }
  };

  // =========================================
  // FILE INPUT
  // =========================================
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];

    uploadPDF(selectedFile);
  };

  // =========================================
  // ASK AI
  // =========================================
  const handleAsk = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setDisplayedAnswer("");

    try {
      const response = await axios.post(
        "https://docuchat-backend-2rbd.onrender.com/ask",
        { question }
      );

      const aiAnswer = response.data.answer;

      setAnswer(aiAnswer);

      // CHAT HISTORY
      setChatHistory((prev) => [
        {
          question,
          answer: aiAnswer,
        },
        ...prev,
      ]);

      setQuestion("");

      // =========================================
      // TYPING EFFECT
      // =========================================
      let displayedText = "";

      const words = aiAnswer.split(" ");

      for (let i = 0; i < words.length; i++) {
        displayedText += words[i] + " ";

        setDisplayedAnswer(displayedText);

        await new Promise((resolve) =>
          setTimeout(resolve, 20)
        );
      }

    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message;

      setError(msg);

      setAnswer("");
      setDisplayedAnswer("");

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ENTER SUPPORT
  // =========================================
  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      handleAsk();
    }
  };

  // =========================================
  // DRAG EVENTS
  // =========================================
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    setDragActive(false);

    const selectedFile =
      e.dataTransfer.files[0];

    uploadPDF(selectedFile);
  };

  // =========================================
  // EXPORT PDF
  // =========================================
  const exportPDF = () => {
    if (!answer) return;

    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text("DocuChat AI Notes", 20, 20);

    doc.setFontSize(12);

    const splitText =
      doc.splitTextToSize(answer, 170);

    doc.text(splitText, 20, 40);

    doc.save("DocuChat-Notes.pdf");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        fontFamily:
          "Arial, sans-serif",
        padding: "30px",
        transition: "0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "25px",
          maxWidth: "1500px",
          margin: "auto",
          alignItems: "flex-start",
        }}
      >

        {/* SIDEBAR */}
        <div
          style={{
            width: "320px",
            background: theme.sidebar,
            borderRadius: "24px",
            padding: "20px",
            height: "90vh",
            overflowY: "auto",
            border: `1px solid ${theme.border}`,
            boxShadow:
              "0 10px 40px rgba(0,0,0,0.35)",
            position: "sticky",
            top: "20px",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              fontSize: "24px",
            }}
          >
            💬 Chat History
          </h2>

          {chatHistory.length === 0 ? (
            <p
              style={{
                color: theme.secondary,
              }}
            >
              No chats yet
            </p>
          ) : (
            chatHistory.map(
              (chat, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setQuestion(
                      chat.question
                    );

                    setAnswer(
                      chat.answer
                    );

                    setDisplayedAnswer(
                      chat.answer
                    );
                  }}
                  style={{
                    background:
                      theme.input,

                    padding: "15px",

                    borderRadius:
                      "14px",

                    marginBottom:
                      "12px",

                    cursor: "pointer",

                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: theme.text,
                      fontWeight:
                        "bold",
                      lineHeight:
                        "1.5",
                    }}
                  >
                    {chat.question.slice(
                      0,
                      45
                    )}
                    ...
                  </p>
                </div>
              )
            )
          )}
        </div>

        {/* MAIN */}
        <div style={{ flex: 1 }}>

          {/* TOP BAR */}
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              📄 DocuChat AI
            </h2>

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              style={{
                padding: "12px 20px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: darkMode
                  ? "#1e293b"
                  : "#e2e8f0",
                color: darkMode
                  ? "white"
                  : "#0f172a",
              }}
            >
              {darkMode
                ? "☀️ Light Mode"
                : "🌙 Dark Mode"}
            </button>
          </div>

          {/* HEADER */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "50px",
            }}
          >
            <h1
              style={{
                fontSize: "56px",
                marginBottom: "15px",
                fontWeight: "800",
                background:
                  "linear-gradient(to right, #60a5fa, #a78bfa)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
              }}
            >
              📄 DocuChat AI
            </h1>

            <p
              style={{
                color: theme.secondary,
                fontSize: "20px",
              }}
            >
              Upload PDFs and interact
              with your documents using
              AI
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div
              style={{
                background:
                  "rgba(127, 29, 29, 0.9)",
                color: "#fecaca",
                padding: "18px",
                borderRadius: "16px",
                marginBottom: "25px",
                border:
                  "1px solid #ef4444",
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* STATUS */}
          {status && (
            <div
              style={{
                marginBottom: "25px",
                background:
                  "rgba(8, 47, 73, 0.9)",
                color: "#7dd3fc",
                padding: "15px",
                borderRadius: "14px",
                border:
                  "1px solid #0ea5e9",
              }}
            >
              ✅ {status}
            </div>
          )}

          {/* UPLOAD CARD */}
          <div
            onDragOver={
              handleDragOver
            }
            onDragLeave={
              handleDragLeave
            }
            onDrop={handleDrop}
            style={{
              background: dragActive
                ? "rgba(37, 99, 235, 0.25)"
                : theme.card,

              border: dragActive
                ? "2px solid #60a5fa"
                : `1px solid ${theme.border}`,

              padding: "35px",

              borderRadius: "28px",

              marginBottom: "30px",

              backdropFilter:
                "blur(12px)",

              boxShadow:
                "0 10px 40px rgba(0,0,0,0.35)",
            }}
          >
            <h2
              style={{
                marginBottom: "25px",
                fontSize: "30px",
              }}
            >
              📤 Upload PDF
            </h2>

            <div
              style={{
                border:
                  "2px dashed #60a5fa",

                borderRadius: "20px",

                padding: "40px",

                textAlign: "center",
              }}
            >
              <p
                style={{
                  marginBottom: "20px",
                  color:
                    theme.secondary,
                  fontSize: "18px",
                }}
              >
                Drag & Drop PDF Here
              </p>

              <label
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap: "10px",

                  padding:
                    "16px 28px",

                  background:
                    "linear-gradient(to right, #2563eb, #7c3aed)",

                  borderRadius:
                    "16px",

                  cursor: "pointer",

                  fontWeight:
                    "bold",

                  fontSize: "16px",
                }}
              >
                📁 Choose PDF

                <input
                  type="file"
                  accept=".pdf"
                  onChange={
                    handleFileUpload
                  }
                  hidden
                />
              </label>
            </div>

            {fileName && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background:
                    theme.input,
                  borderRadius:
                    "14px",
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                📄 {fileName}
              </div>
            )}
          </div>

          {/* ASK CARD */}
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              padding: "35px",
              borderRadius: "28px",
              backdropFilter:
                "blur(12px)",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.35)",
            }}
          >
            <h2
              style={{
                marginBottom: "25px",
                fontSize: "30px",
              }}
            >
              🤖 Ask AI
            </h2>

            <textarea
              rows="5"
              placeholder="Ask anything about your PDF..."
              value={question}
              onChange={(e) =>
                setQuestion(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              style={{
                width: "100%",
                padding: "20px",
                borderRadius: "18px",
                border: `1px solid ${theme.border}`,
                background:
                  theme.input,
                color: theme.text,
                fontSize: "16px",
                resize: "none",
                outline: "none",
                boxSizing:
                  "border-box",
                lineHeight: "1.8",
              }}
            />

            <button
              onClick={handleAsk}
              disabled={loading}
              style={{
                marginTop: "22px",
                padding: "16px 32px",
                borderRadius: "16px",
                border: "none",
                background: loading
                  ? "#475569"
                  : "linear-gradient(to right, #2563eb, #7c3aed)",

                color: "white",

                fontSize: "17px",

                fontWeight: "700",

                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "🤖 Thinking..."
                : "🚀 Ask AI"}
            </button>
          </div>

          {/* ANSWER */}
          {displayedAnswer && (
            <div
              style={{
                background: theme.card,
                marginTop: "35px",
                padding: "40px",
                borderRadius: "28px",
                lineHeight: "1.9",
                boxShadow:
                  "0 10px 40px rgba(0,0,0,0.35)",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                }}
              >
                <h2
                  style={{
                    fontSize: "34px",
                    margin: 0,
                  }}
                >
                  📌 AI Answer
                </h2>

                <button
                  onClick={exportPDF}
                  style={{
                    padding:
                      "12px 20px",
                    border: "none",
                    borderRadius:
                      "12px",
                    background:
                      "linear-gradient(to right, #059669, #10b981)",

                    color: "white",

                    fontWeight:
                      "bold",

                    cursor: "pointer",
                  }}
                >
                  📄 Export PDF
                </button>
              </div>

              <div
                style={{
                  color: theme.text,
                  fontSize: "17px",
                }}
              >
                <ReactMarkdown>
                  {displayedAnswer}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;