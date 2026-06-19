const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.ico') // Icon can be optional
  });

  mainWindow.loadFile('index.html');
  // Open dev tools in development if needed
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler to query Windows startup items using PowerShell
ipcMain.handle('get-startup-items', async () => {
  return new Promise((resolve, reject) => {
    const psScript = `
      $regPaths = @(
          "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
          "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
          "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
          "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
          "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Run",
          "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\RunOnce"
      )
      $items = @()
      
      # 1. Query Registry Paths
      foreach ($path in $regPaths) {
          if (Test-Path $path) {
              try {
                  $key = Get-Item -Path $path -ErrorAction SilentlyContinue
                  if ($key) {
                      foreach ($prop in $key.Property) {
                          $val = (Get-ItemProperty -Path $path -Name $prop -ErrorAction SilentlyContinue).$prop
                          if ($val) {
                              $items += [PSCustomObject]@{
                                  Name = $prop
                                  Command = $val
                                  Location = $path
                                  Source = "Registry"
                                  Trigger = "Boot/Logon"
                              }
                          }
                      }
                  }
              } catch {}
          }
      }

      # 2. Query Startup Folders
      $startupPaths = @(
          "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup",
          "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
      )
      try {
          $shell = New-Object -ComObject WScript.Shell
          foreach ($path in $startupPaths) {
              if (Test-Path $path) {
                  Get-ChildItem -Path $path -File | ForEach-Object {
                      $itemPath = $_.FullName
                      $cmd = $itemPath
                      if ($_.Extension -eq '.lnk') {
                          try {
                              $shortcut = $shell.CreateShortcut($itemPath)
                              $cmd = "$($shortcut.TargetPath) $($shortcut.Arguments)".Trim()
                          } catch {}
                      }
                      $items += [PSCustomObject]@{
                          Name = $_.Name
                          Command = $cmd
                          Location = $itemPath
                          Source = "Startup Folder"
                          Trigger = "Logon"
                      }
                  }
              }
          }
      } catch {}

      # 3. Query Scheduled Tasks with Logon/Boot triggers
      try {
          $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue
          if ($tasks) {
              foreach ($t in $tasks) {
                  if ($t.State -ne 'Disabled' -and $t.Triggers) {
                      foreach ($trig in $t.Triggers) {
                          $className = $trig.CimClass.CimClassName
                          if ($className -match 'Logon|Boot') {
                              $cmd = ($t.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)".Trim() }) -join ' | '
                              if ($cmd.Trim()) {
                                  $items += [PSCustomObject]@{
                                      Name = $t.TaskName
                                      Command = $cmd
                                      Location = $t.TaskPath
                                      Source = "Scheduled Task"
                                      Trigger = $className
                                  }
                              }
                          }
                      }
                  }
              }
          }
      } catch {}

      if ($items.Count -gt 0) {
          $items | ConvertTo-Json -Depth 3
      } else {
          "[]"
      }
    `;

    // Execute PowerShell script
    exec(psScript, { shell: 'powershell.exe', maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.error('PowerShell Scan Error:', error);
        reject(error);
        return;
      }
      try {
        const parsed = JSON.parse(stdout || '[]');
        // Ensure result is an array
        const result = Array.isArray(parsed) ? parsed : [parsed];
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse PowerShell JSON output:', stdout);
        resolve([]);
      }
    });
  });
});

// IPC Handler to read script content
ipcMain.handle('read-script-content', async (event, filePath) => {
  return new Promise((resolve) => {
    // Resolve absolute path or environment vars if any
    let targetPath = filePath;
    if (targetPath.startsWith('%')) {
      // Resolve common Windows environment variables
      targetPath = targetPath.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
    }
    
    // Safety check: ensure file exists and is not too large (limit to 1MB)
    if (!fs.existsSync(targetPath)) {
      resolve({ error: 'Dosya bulunamadı: ' + targetPath });
      return;
    }

    try {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        resolve({ error: 'Seçilen öğe bir klasör, dosya değil.' });
        return;
      }

      if (stats.size > 1024 * 1024) {
        resolve({ error: 'Dosya boyutu analiz edilemeyecek kadar büyük (Maks 1MB).' });
        return;
      }

      const content = fs.readFileSync(targetPath, 'utf-8');
      resolve({ content });
    } catch (err) {
      resolve({ error: 'Dosya okuma hatası: ' + err.message });
    }
  });
});

// IPC Handler to reveal file in explorer
ipcMain.handle('reveal-in-explorer', async (event, filePath) => {
  if (!filePath) return false;
  let targetPath = filePath;
  if (targetPath.startsWith('%')) {
    targetPath = targetPath.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
  }
  
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
    return true;
  } else {
    // If registry path, it is not a file, so we can't reveal it directly
    return false;
  }
});

// IPC Handler to disable/delete startup items
ipcMain.handle('disable-startup-item', async (event, item) => {
  return new Promise((resolve) => {
    let script = '';

    if (item.Source === 'Registry') {
      // Remove registry value
      script = `Remove-ItemProperty -Path "${item.Location}" -Name "${item.Name}" -ErrorAction Stop`;
    } else if (item.Source === 'Startup Folder') {
      // Delete shortcut file
      script = `Remove-Item -Path "${item.Location}" -Force -ErrorAction Stop`;
    } else if (item.Source === 'Scheduled Task') {
      // Disable task
      script = `Disable-ScheduledTask -TaskName "${item.Name}" -TaskPath "${item.Location}" -ErrorAction Stop`;
    }

    if (!script) {
      resolve({ success: false, error: 'Bilinmeyen başlangıç kaynağı türü.' });
      return;
    }

    exec(script, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
      if (error) {
        console.error('Disable Error:', stderr || error.message);
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});
