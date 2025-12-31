# 🧠 MindMap Pro (Offline Chrome Extension)

A powerful, **100% offline** Mind Mapping tool built as a Chrome Extension. No internet required, no external servers, and no data tracking. Everything is saved locally in your browser.

Interface
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/deb8bdc2-0821-4215-8cb4-eab9aff74b30" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/98afbe03-eb04-42c8-94fc-d7776cf047e8" />


## ✨ Features

* **100% Offline:** Uses LocalStorage. Your data never leaves your device.
* **Infinite Canvas:** Pan and zoom freely to organize your thoughts.
* **Rich Media:** * **Upload** images from your computer.
    * **Paste** images directly from your clipboard (`Ctrl+V`).
* **Productivity Tools:**
    * **Undo / Redo** history stack.
    * **Dark Mode** / Light Mode.
    * **Auto-Save** (never lose your work).
* **Project Management:** Create multiple project folders.
* **Backup:** Export your mind maps to a `.json` file for backup.

## 🚀 Installation

Since this is a developer extension, you install it via "Load Unpacked":

1.  **Download** this repository (Code > Download ZIP) and unzip it.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable **Developer Mode** (toggle switch in the top right corner).
4.  Click the **Load unpacked** button.
5.  Select the folder where you unzipped the files.
6.  Click the extension icon in your browser toolbar to start!

## 🎮 How to Use

### Basic Controls
* **Add Node:** Hover over a node and click the **+** button.
* **Edit Node:** Click the **✎** (pencil) button to open the editor.
* **Delete Node:** Click the trash icon (child nodes only).
* **Move Canvas:** Click and drag anywhere on the background.
* **Zoom:** Use the on-screen buttons or `Ctrl + Scroll`.

### Adding Images
1.  Open the **Edit Node** modal.
2.  Click "Choose File" to upload.
3.  OR simply press **Ctrl+V** anywhere while the modal is open to paste an image.
4.  Click an image in the gallery to set it as the "Cover" (highlighted blue).

## 🛠️ Tech Stack

* **HTML5 / CSS3:** Built using standard web technologies (no external frameworks like Tailwind/Bootstrap to ensure offline compatibility).
* **Vanilla JavaScript:** Lightweight and fast logic without dependencies.
* **Chrome Extension API:** Manifest V3.

## 📂 Project Structure

```text
/
├── manifest.json   # Extension configuration
├── background.js   # Service worker
├── index.html      # Dashboard UI (Project List)
├── index.js        # Dashboard Logic
├── mindmap.html    # Editor UI (The Canvas)
└── mindmap.js      # Editor Logic (Drawing, Dragging, Saving)
