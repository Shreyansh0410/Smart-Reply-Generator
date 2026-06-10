# Smart Reply Generator

An elegant, context-aware Generative AI application built to automatically analyze incoming emails and draft highly tailored, structure-aware email responses.

## Features

- **Context Insights**: Automatical analysis of the input email, extracting:
  - Detected sender sentiment (e.g. Friendly, Frustrated, Apologetic, Neutral)
  - Urgency level (Low, Medium, High)
  - 1-sentence summary of the core issue
  - Extracted bullet points of specific requests/questions
  - AI-generated Response Strategy recommendations
- **Three Draft Variations**:
  - ⚡ **Direct & Efficient**: Crisp, clean, straight-to-the-point reply.
  - 😊 **Warm & Friendly**: Collaborative, polite, relationship-building reply.
  - 📊 **Structured / Detailed**: Sectioned, bulleted format addressing all concerns.
- **Advanced Control Configs**: Configure responses using Tone (Professional, Casual, Assertive, etc.), Length (Short, Standard, Detailed), and Custom Key Points (direct answers or instructions).
- **Dual API Support**: Out-of-the-box support for both **Google Gemini API** (using Gemini 2.5/1.5 models) and **OpenAI API** (using GPT-4o models).
- **Premium Glassmorphic UI**: High-fidelity dark mode with neon gradients, smooth micro-animations, copy actions, and local credential storage.

---

## Technical Architecture

- **Backend**: FastAPI web server (Python) exposing REST endpoints for AI processing.
- **LLM Integration**: Direct HTTP REST wrappers to the Gemini and OpenAI endpoints for version stability.
- **Frontend**: Single Page Application (HTML5 / Vanilla CSS / ES6 JavaScript) served directly by FastAPI.

---

## Getting Started

### Prerequisites
- Python 3.9 or higher

### Running the App
The root folder contains a bootstrapper script (`run.py`) that sets up the virtual environment, installs dependencies, and runs the FastAPI server.

1. Navigate to the project folder:
   ```bash
   cd /Users/shreyanshtiwari0410/.gemini/antigravity-ide/scratch/smart-reply-generator
   ```
2. Execute the bootstrap script:
   ```bash
   python3 run.py
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

### Setup API Key
1. Open the application.
2. Click the **Settings** gear icon in the top right.
3. Select your provider (**Google Gemini** or **OpenAI**).
4. Enter your API Key.
5. Click **Save Settings** (your key is saved client-side in secure session/local storage).
6. Paste an email, configure your preferences, and click **Analyze & Generate Replies**!
