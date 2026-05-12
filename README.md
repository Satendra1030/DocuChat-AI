# 📄 DocuChat AI
 AI-powered PDF chat application that lets users upload documents and ask questions using advanced AI.
  Built with React, Node.js, Express, Groq AI, and modern glassmorphism UI.

---

# ✨ Features

- 📄 Upload PDF documents
- 🤖 Ask questions about uploaded PDFs
- 💬 AI-generated answers using Groq LLM
- ⚡ Typing animation effect
- 🌙 Dark / ☀️ Light mode
- 🖱️ Drag & Drop PDF upload
- 📝 Markdown formatted AI responses
- 💾 Chat history sidebar
- 📥 Export AI notes as PDF
- ⌨️ Enter key support
- 🎨 Modern glassmorphism UI
- 📱 Responsive design
- 🚫 Smart error handling when no PDF uploaded

# 🛠️ Tech Stack

## Frontend
- React.js
- Axios
- React Markdown
- jsPDF

## Backend
- Node.js
- Express.js
- Multer
- pdf-parse
- Groq SDK

# 📂 Project Structure

```bash
DocuChat-AI/
│
├── backend/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
