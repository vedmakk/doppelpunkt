# doppelp:nkt – Minimal Markdown Editor

A **minimalist**, **distraction-free** Markdown editor – ready the moment you open it. With live syntax-aware rendering, inspired by the writing experiences in apps like **Things**.

👉 Just start writing at [doppelpunkt.io](https://doppelpunkt.io) – no sign-up required.

## ✨ Features

📝 **Markdown Input & Output**  
Text input and rendered output are the same — rendered with syntax-aware highlighting while preserving raw Markdown syntax.

➕ **New File**  
Empties the editor content. Prompts confirmation if unsaved text exists.

📂 **Open File**  
Load a local `.md` file into the editor.

💾 **Export**  
Save the current editor content as a `.md` file.

🖨️ **Print-Ready**  
Includes `print.css` for consistent printed output (or **PDF export** via Print). Make sure to select `Print backgrounds` in the print dialog when in dark mode.

💡 **Auto-Save**  
Text is auto-saved in **LocalStorage** between sessions. Auto-save is disabled by default.

↩️↪️ **Undo/Redo**  
Supports full undo/redo history for text changes.

## 🧰 Tech Stack

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite.js](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [@emotion/react](https://emotion.sh/docs/introduction)

### Libraries Used

- [react-simple-code-editor](https://react-simple-code-editor.github.io/react-simple-code-editor/)
- [prismjs](https://prismjs.com) – For syntax highlighting

## 📦 Getting Started

```bash
# Clone the repo
...

# Install dependencies
bun install

# Start development server
bun run dev
```

## 📜 License

This project is licensed under the MIT License — use freely, modify openly, and share widely.  
See the [LICENSE](LICENSE) file for full details.

The Fira Code font is included under the terms of the SIL Open Font License, Version 1.1.  
See the [Fira Code License](src/theme/fonts/woff2/LICENSE) for more information.
