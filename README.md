# TEST YOUR ENGINEERING BRAIN 🧠
### Interactive Engineering Quiz Game with Automatic E-Certificate Generation
**Organized by:** MGR IEI Students Chapter, Dr. M.G.R. Educational and Research Institute (Deemed to be University, Accredited with NAAC A+ Grade, Graded Autonomy Status)

---

## 🌟 Project Overview

**TEST YOUR ENGINEERING BRAIN** is a full-stack, responsive, gamified technical quiz web application designed for college engineering festivals and technical competitions. It delivers a fast, engaging mini-game experience while enforcing rigorous academic standards through server-side score calculation, instant high-resolution landscape PDF E-certificate generation, automated transactional email delivery, and an administrative audit dashboard.

---

## 🚀 Key Features

### 1. Student Registration & Validation
* Clean, responsive landing page with authentic institutional branding (Dr. M.G.R. University crest, NAAC A+ seal, and the Institution of Engineers (India) Royal Charter emblem).
* Real-time client & server-side validation for:
  * Full Name (minimum 2 characters, alphabetic sanitization)
  * Email Address (RFC-compliant regex verification)
  * Engineering Branch dropdown (CSE, IT, AI & DS, AI & ML, Cyber Security, Cyber Forensics and Information Security, ECE, EEE, Mechanical, Civil, Biomedical, Other)
  * College/Institute Name (optional)
* Secure participant ID generation (`PART-XXXX-XXXX`) and idempotency to prevent duplicate submissions.

### 2. Gamified Engineering Quiz Game
* Exactly 10 curated multiple-choice questions spanning:
  1. Computer Science and Programming (Data structures, Big-O complexity)
  2. Electrical and Electronics Engineering (Maximum power transfer theorem)
  3. Mechanical Engineering (Carnot efficiency, 2nd law of thermodynamics)
  4. Civil Engineering (Bending moments under UDL)
  5. Engineering Mathematics & Physics (Eigenvalues, Matrix Trace)
  6. Artificial Intelligence & Emerging Tech (Vanishing gradients & ReLU)
  7. General Engineering (Fluid mechanics, Reynolds number)
  8. Computer Networks & Systems (OSI Layer 3 routing)
  9. Digital Electronics & Microcontrollers (Nyquist sampling theorem)
  10. Materials Science & Mechanics (Stress-strain curve, Yield point)
* Single-question HUD interface with:
  * Animated percentage progress track
  * Category badge & difficulty level
  * Interactive 4-choice options (A, B, C, D) with hover and selected glowing states
  * Full keyboard hotkeys (`A-D`, `1-4`, `←`, `→`)
  * Elapsed timer ticker
  * 10-Question status dot navigator (jump directly to any question; color-coded answered status)
  * Review and submit confirmation modal.

### 3. Server-Side Scoring & Results Hub
* Anti-cheat design: Correct answers and score formulas are **never exposed to client JavaScript**.
* Automated score evaluation out of 10 marks and percentage calculation.
* Dynamic performance bracket messages:
  * **9–10 marks:** *"Outstanding! You have an excellent engineering brain!"* (Master Engineer 🏆)
  * **7–8 marks:** *"Great Job! Your engineering knowledge is impressive!"* (Senior Innovator ⭐)
  * **5–6 marks:** *"Good Effort! Keep learning and improving!"* (Aspiring Engineer 💡)
  * **0–4 marks:** *"Keep Practising! Every engineer starts with curiosity!"* (Engineering Explorer 🚀)
* Animated radial progress ring counter and celebration confetti.
* In-depth Question Review Accordion with engineering explanations for each topic.

### 4. Dynamic Landscape PDF Certificate Generation
* Faithfully reproduces the official MGR IEI Students Chapter certificate design reference.
* Standard print-ready landscape A4 PDF (`842 x 595` pt) generated via `pdf-lib`.
* Official institutional emblems preserved with 100% authenticity:
  * Dr. M.G.R. Educational and Research Institute crest and University title
  * NAAC A+ accredited seal
  * Institution of Engineers (India) 1935 Royal Charter golden rosette seal
  * Teal, navy, white, and gold geometric border banners
* Vector selectable typography:
  * Dynamic recipient name centering with automatic font scaling for long names
  * Engineering branch
  * Score and percentage badge (e.g. `Score: 10 / 10 (100%)`)
  * Date of completion
  * Unique verifiable Certificate ID (`TYEB-2026-XXXXXX`)
  * Digital verification seal and chapter sign-off.
* Direct browser download via **DOWNLOAD E-CERTIFICATE (PDF)** button.

### 5. Automatic Transactional Email Delivery
* Automatically dispatches personalized E-certificates to the participant's registered email address upon submission.
* Supports **Resend API** and **SMTP** (Gmail, SendGrid, Amazon SES, custom SMTP).
* Graceful fallback & simulation mode: If email credentials are not yet set in `.env`, the system safely logs the complete formatted email with PDF attachment reference to the audit log without crashing, providing clear setup instructions and an interactive email preview dialog.
* Includes email retry mechanism and duplicate email prevention.

### 6. Administrator Control Panel
* Accessible via the top navbar button or direct `#admin` route.
* Protected by administrative access key (`IEI@Engineering2026`).
* Live analytics dashboard:
  * Total registered participants
  * Quizzes completed
  * Certificates issued
  * Successful and pending email deliveries
  * Average score and highest score
  * Branch-wise participation bar chart
  * Score bracket performance distribution
* Full participant search and multi-criteria filtering (by name, email, branch, status, score).
* One-click **Export to CSV (Excel)** with UTF-8 BOM encoding.
* Individual participant response sheet inspection and authorized email resend actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Properties, Glassmorphism, CSS Grid), Vanilla JavaScript (ES6+), Web Audio API, Canvas particle animations |
| **Backend** | Node.js, Express 5 REST API |
| **PDF Engine** | `pdf-lib` (pure JavaScript vector PDF generation and image compositing) |
| **Email Service** | `nodemailer` & Resend API with PDF attachment support |
| **Database** | Persistent JSON storage engine with atomic writes (`fs.renameSync`) |
| **Deployment** | Vercel Serverless Ready (`vercel.json`) |

---

## 📁 Project Structure

```
test-your-engineering-brain/
├── assets/                               # Official design templates and crests
│   ├── certificate-clean-template.jpg    # Calibrated background with branding
│   ├── certificate-template.jpg          # Original uploaded reference design
│   ├── iei-emblem.png                    # Institution of Engineers emblem
│   ├── mgr-crest.png                     # Dr. M.G.R. University crest
│   └── naac-seal.png                     # NAAC A+ accreditation seal
├── data/                                 # Persistent database storage
│   └── database.json                     # Participants, attempts, certificates, audit logs
├── generated_certificates/               # Storage for generated PDF files
├── public/                               # Frontend single-page application
│   ├── assets/logos/                     # Public web assets
│   ├── css/
│   │   └── style.css                     # Responsive fest theme stylesheet
│   ├── js/
│   │   └── app.js                        # App state, quiz controller, audio, admin UI
│   └── index.html                        # Application entry point
├── src/                                  # Backend application modules
│   ├── certificateGenerator.js           # PDF generation engine
│   ├── database.js                       # Data access layer & queries
│   ├── emailService.js                   # Transactional email dispatcher
│   └── questions.js                      # Question bank & server-side evaluation
├── .env.example                          # Sample configuration template
├── package.json                          # Node dependencies and scripts
├── server.js                             # Express application & API endpoints
├── test-suite.js                         # Unit and integration test suite
├── test-server-endpoints.js              # Live HTTP endpoint test suite
├── vercel.json                           # Cloud deployment configuration
└── README.md                             # Project documentation
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher

### Steps

1. **Navigate to the Project Directory:**
   ```bash
   cd C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your preferred configuration:
   ```env
   PORT=3000
   ADMIN_PASSWORD=IEI@Engineering2026

   # Option 1: Resend (Recommended)
   RESEND_API_KEY=your_resend_api_key_here

   # Option 2: SMTP (Gmail / SendGrid / Custom)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=iei@drmgrdu.ac.in
   FROM_NAME="MGR IEI Students Chapter"
   ```
   *(Note: The application will run smoothly in simulation/standby mode even if email credentials are left as defaults).*

4. **Run the Automated Test Suite:**
   ```bash
   npm test
   ```
   Runs 14 verification tests covering database operations, PDF generation, email formatting, and scoring.

5. **Start the Application:**
   ```bash
   npm start
   ```
   Open your browser and navigate to:
   **`http://localhost:3000`**

---

## 🔒 Administrator Access

* Click the **Admin Portal** button in the top-right header or visit `http://localhost:3000/#admin`.
* **Default Security Key:** `IEI@Engineering2026` (configurable in `.env`).
* Administrators can:
  * View real-time participation statistics and branch distributions.
  * Search participants by name or email.
  * Filter participants by branch, score, or completion status.
  * Inspect individual response sheets (Q1–Q10).
  * Download generated certificates for any participant.
  * Resend certificate emails with one click.
  * Export the complete participant dataset to an Excel-compatible CSV file.

---

## ☁️ Deployment Guide (Vercel)

The codebase is pre-configured for one-click deployment on **Vercel**:

1. Push this directory to your GitHub or GitLab repository.
2. In the Vercel dashboard, click **Add New Project** and select the repository.
3. In **Environment Variables**, add:
   * `ADMIN_PASSWORD` = Your desired administrator password
   * `RESEND_API_KEY` = Your Resend API key (or SMTP credentials)
   * `FROM_EMAIL` = `iei@drmgrdu.ac.in`
   * `FROM_NAME` = `MGR IEI Students Chapter`
4. Click **Deploy**. Vercel will automatically build the project and serve both the static frontend and serverless API endpoints via `vercel.json`.

---

## 📜 Academic Integrity & Attribution

* **Institution:** Dr. M.G.R. Educational and Research Institute, Maduravoyal, Chennai - 600095, Tamil Nadu, India.
* **Organizing Chapter:** MGR IEI Students Chapter, The Institution of Engineers (India).
* **Event:** Test Your Engineering Brain Annual Challenge.
"# test-your-engineering-brain" 
