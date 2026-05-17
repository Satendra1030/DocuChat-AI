import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const themeVars = {
    "--page-bg": darkMode
      ? "linear-gradient(135deg, #07111f 0%, #111827 100%)"
      : "#f4f7fb",
    "--surface": darkMode ? "rgba(25, 34, 50, 0.9)" : "#ffffff",
    "--sidebar": darkMode ? "rgba(13, 21, 34, 0.96)" : "#ffffff",
    "--text": darkMode ? "#f8fafc" : "#0f172a",
    "--muted": darkMode ? "#9aa8bb" : "#526174",
    "--input": darkMode ? "#101a2a" : "#f8fafc",
    "--border": darkMode ? "#314157" : "#d5dde8",
    "--shadow": darkMode
      ? "0 16px 36px rgba(0, 0, 0, 0.28)"
      : "0 14px 30px rgba(15, 23, 42, 0.1)",
  };

  const uploadPDF = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
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
      const msg = err.response?.data?.error || err.message;

      setError(msg);
      setStatus("");
      setAnswer("");
      setDisplayedAnswer("");

      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    uploadPDF(selectedFile);
  };

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
      setChatHistory((prev) => [{ question, answer: aiAnswer }, ...prev]);
      setQuestion("");

      let displayedText = "";
      const words = aiAnswer.split(" ");

      for (let i = 0; i < words.length; i++) {
        displayedText += words[i] + " ";
        setDisplayedAnswer(displayedText);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;

      setError(msg);
      setAnswer("");
      setDisplayedAnswer("");

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

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

    const selectedFile = e.dataTransfer.files[0];
    uploadPDF(selectedFile);
  };

  const exportPDF = () => {
    if (!answer) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("DocuChat AI Notes", 20, 20);
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(answer, 170);
    doc.text(splitText, 20, 40);
    doc.save("DocuChat-Notes.pdf");
  };

  return (
    <div className="app-shell" style={themeVars}>
      <div className="app-layout">
        <aside className="history-panel" aria-label="Chat history">
          <h2 className="history-title">Chat History</h2>

          {chatHistory.length === 0 ? (
            <p className="history-empty">No chats yet</p>
          ) : (
            <div className="history-list">
              {chatHistory.map((chat, index) => (
                <button
                  className="history-item"
                  key={`${chat.question}-${index}`}
                  onClick={() => {
                    setQuestion(chat.question);
                    setAnswer(chat.answer);
                    setDisplayedAnswer(chat.answer);
                  }}
                  type="button"
                >
                  {chat.question.slice(0, 56)}
                  {chat.question.length > 56 ? "..." : ""}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <h2 className="topbar-title">DocuChat AI</h2>

            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              type="button"
            >
              {darkMode ? "Light" : "Dark"}
            </button>
          </header>

          <section className="hero">
            <h1>NeuroNotes AI</h1>
            <p>Upload a PDF, then ask focused questions about its contents.</p>
          </section>

          {error && <div className="notice notice-error">{error}</div>}
          {status && <div className="notice notice-status">{status}</div>}

          <section
            className={`tool-card upload-card ${dragActive ? "is-dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <h2 className="card-title">Upload PDF</h2>

            <div className="drop-zone">
              <p>Drag and drop your PDF here</p>

              <label className="file-button">
                Choose PDF
                <input
                  accept=".pdf"
                  hidden
                  onChange={handleFileUpload}
                  type="file"
                />
              </label>
            </div>

            {fileName && <div className="file-name">{fileName}</div>}
          </section>

          <section className="tool-card">
            <h2 className="card-title">Ask AI</h2>

            <textarea
              className="question-input"
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your PDF..."
              rows="5"
              value={question}
            />

            <button
              className="primary-button"
              disabled={loading}
              onClick={handleAsk}
              type="button"
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>
          </section>

          {displayedAnswer && (
            <section className="answer-card">
              <div className="answer-header">
                <h2>AI Answer</h2>

                <button
                  className="export-button"
                  onClick={exportPDF}
                  type="button"
                >
                  Export PDF
                </button>
              </div>

              <div className="answer-body">
                <ReactMarkdown>{displayedAnswer}</ReactMarkdown>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
