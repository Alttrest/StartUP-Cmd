<p align="center">\n  <img src="https://raw.githubusercontent.com/Alttrest/StartUP-Cmd/main/banner.jpeg" width="100%" alt="Project Banner" />\n</p>\n\n<div align="center">
  
# ✨ StartUP-Cmd ✨

![GitHub Repo stars](https://img.shields.io/github/stars/Alttrest/StartUP-Cmd?style=for-the-badge&color=yellow)
![GitHub forks](https://img.shields.io/github/forks/Alttrest/StartUP-Cmd?style=for-the-badge&color=blue)
![GitHub last commit](https://img.shields.io/github/last-commit/Alttrest/StartUP-Cmd?style=for-the-badge&color=green)
![GitHub top language](https://img.shields.io/github/languages/top/Alttrest/StartUP-Cmd?style=for-the-badge&color=red)

<br/>

  <!-- GitHub Repo Pin Card SVG -->
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=Alttrest&repo=StartUP-Cmd&theme=radical&show_owner=true" alt="Repo Stats" />

</div>

<br/>

## 📸 Screenshots

<div align="center">
  <table>
    <tr>
      <td><img src="https://placehold.co/600x400/1e1e2e/cdd6f4?text=Screenshot+1" alt="Screenshot 1" width="400"/></td>
      <td><img src="https://placehold.co/600x400/1e1e2e/cdd6f4?text=Screenshot+2" alt="Screenshot 2" width="400"/></td>
    </tr>
    <tr>
      <td><img src="https://placehold.co/600x400/1e1e2e/cdd6f4?text=Screenshot+3" alt="Screenshot 3" width="400"/></td>
      <td><img src="https://placehold.co/600x400/1e1e2e/cdd6f4?text=Screenshot+4" alt="Screenshot 4" width="400"/></td>
    </tr>
  </table>
  <p><i>Screenshots of the project in action.</i></p>
</div>

---

<div align="center">
  <h1>✨ StartUP-Cmd ✨</h1>
  <p><i>StartupCMD is a professional, Electron-based desktop application for Windows that scans, explains, and manages command line tools, scripting files, and applications that launch automatically when your system starts up.</i></p>

  <!-- Badges -->
  <img src="https://img.shields.io/github/languages/top/Alttrest/StartUP-Cmd?style=for-the-badge&color=blue" alt="Top Language" />
  <img src="https://img.shields.io/github/repo-size/Alttrest/StartUP-Cmd?style=for-the-badge" alt="Repo Size" />
  <img src="https://img.shields.io/github/last-commit/Alttrest/StartUP-Cmd?style=for-the-badge" alt="Last Commit" />
</div>

<br />

# StartupCMD - Windows Startup Command Analyzer & Manager

StartupCMD is a professional, Electron-based desktop application for Windows that scans, explains, and manages command line tools, scripting files, and applications that launch automatically when your system starts up.

It is specifically designed to diagnose and identify the source of command prompt (CMD) windows that flash or stay open briefly or permanently during Windows boot, allowing you to optimize your system startup speed and security.

## 🚀 Features

- **Comprehensive Startup Scanning**: Scans Registry Run/RunOnce keys (HKCU & HKLM), User & Common Startup folders, and Scheduled Tasks (specifically Logon/Boot triggers).
- **CMD & Script Detection**: Highlights items executing via terminal shells (`cmd.exe`, `powershell.exe`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`) that cause console windows to popup.
- **Direct Script Inspector**: Reads and displays the source code of `.bat`, `.cmd`, `.ps1` scripts directly within the application.
- **Automated Security Analysis**: Scans script code for high-risk commands such as file deletions (`del`), registry edits (`reg`), file downloads (`curl`/`wget`), system shutdown commands (`shutdown`), process terminations (`taskkill`), and loops (`:loop`).
- **One-Click Disable / Remove**: Safely removes registry values, deletes startup folder links, or disables scheduled tasks with administrative safety fallbacks.
- **Reveal in File Explorer**: Opens the folder containing the target script/executable in Windows Explorer.
- **Search Online**: Quickly search Google for unfamiliar processes or commands with one click.
- **Premium Dark UI**: High-fidelity dark mode with glassmorphic cards, glowing background blobs, dynamic scanning loaders, and a circular system health dashboard gauge.

## 🛠️ Installation & Development

Follow these steps to run the project locally on your machine:

### Prerequisites
- **Windows OS** (Scan operations rely on integrated PowerShell hooks)
- **Node.js** (v18 or higher recommended)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/alttrest/startupcmd.git
   cd startupcmd
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Launch the application in development mode:
   ```bash
   npm start
   ```

## 📦 Packaging a Portable Windows Executable (.exe)

You can package the application into a single, standalone **portable .exe** file that requires no installation:

```bash
npm run build
```

This will:
- Bundle and compress the source code.
- Package the transparent application icon (`icon.ico`) directly inside the executable.
- Output the portable binary file to the **`dist/`** folder as `dist/StartupCMD.exe`.

---

## 🎨 UI Design & System Health

The application features a circular **System Health Score** in the left panel. As the count of startup command shell windows increases, the health indicator score lowers, notifying the user to review potential startup optimizations.

- **Kayıt Defteri (Registry)**: Shield icon for registry entries.
- **Başlangıç Klasörü (Startup Folder)**: Folder icon for links in the startup folder.
- **Konsol ve Komutlar (Terminal & Scripts)**: Terminal icon for script and shell command-line launchers.

## ⚖️ License

This project is licensed under the MIT License - see the `LICENSE` file for details.
