# 📄 NeuroNotes AI
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

 # 🔗Live Demo
  https://docu-chat-ai-virid.vercel.app/

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


🚀 Installation

1️⃣ Clone Repository
-git clone https://github.com/YOUR_USERNAME/DocuChat-AI.git
-cd DocuChat-AI

⚙️ Backend Setup

2️⃣ Open Backend Folder
-cd backend

3️⃣ Install Dependencies
 -npm install

4️⃣ Create .env File
 -Create a file named:
 .env

-Add:
GROQ_API_KEY=your_groq_api_key_here

5️⃣ Start Backend Server
-node server.js

-Backend runs on:
http://localhost:5001

💻 Frontend Setup

6️⃣ Open Frontend Folder
cd frontend

7️⃣ Install Dependencies
 npm install

8️⃣ Start React App
-npm start

-Frontend runs on:
http://localhost:3000

🔑 Get Groq API Key
-Visit:
 https://console.groq.com

-Create account
 Generate API key
 Paste inside .env

🌐 Deployment

-Frontend Deployment (Vercel)
https://vercel.com

-Backend Deployment (Render)
https://render.com

📦 Required Packages

-Frontend
 npm install axios react-markdown jspdf

-Backend
 npm install express multer cors pdf-parse dotenv groq-sdk

📸 Screenshots

🌙 Dark Mode
-Modern glassmorphism design
-Gradient UI
-AI answer cards
-Chat history sidebar

☀️ Light Mode
-Clean minimal interface
-Responsive layout
-Professional appearance

🧠 AI Capabilities
DocuChat AI can:

-Generate notes
-Summarize PDFs
-Explain topics
-Create important questions
-Answer PDF-based queries
-Produce exam-oriented content

🔒 Important Notes
-Upload a valid PDF before asking questions
-Large PDFs may take longer to process
-Backend must be running before frontend
-Never expose your API key publicly

📌 Future Improvements
-Multiple PDF support
-AI streaming responses
-Authentication system
-Cloud storage
-Vector database integration
-PDF page references
-Mobile app version

👨‍💻 Author
Developed by Satendra Prasad Kushwaha

⭐ Support
If you like this project:

⭐ Star the repository
🍴 Fork the project
🛠️ Contribute improvements
