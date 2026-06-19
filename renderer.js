// State Management
let allItems = [];
let filteredItems = [];
let currentFilter = 'all';
let selectedItem = null;

// DOM Elements
const elements = {
  healthScore: document.getElementById('health-score'),
  healthStatus: document.getElementById('health-status'),
  healthValuePath: document.getElementById('health-value-path'),
  
  btnScan: document.getElementById('btn-scan'),
  searchInput: document.getElementById('search-input'),
  itemsList: document.getElementById('items-list'),
  scanLoading: document.getElementById('scan-loading'),
  emptyState: document.getElementById('empty-state'),
  
  detailPanel: document.getElementById('detail-panel'),
  detailClose: document.getElementById('detail-close'),
  detailTitle: document.getElementById('detail-title'),
  detailBadge: document.getElementById('detail-badge'),
  detailSourceDesc: document.getElementById('detail-source-desc'),
  detailTriggerDesc: document.getElementById('detail-trigger-desc'),
  detailRiskBadge: document.getElementById('detail-risk-badge'),
  detailCommandText: document.getElementById('detail-command-text'),
  detailExplanationText: document.getElementById('detail-explanation-text'),
  
  scriptContentSection: document.getElementById('script-content-section'),
  scriptFileName: document.getElementById('script-file-name'),
  scriptCodeContent: document.getElementById('script-code-content'),
  scriptAnalysisBox: document.getElementById('script-analysis-box'),
  
  btnReveal: document.getElementById('btn-reveal'),
  btnGoogle: document.getElementById('btn-google'),
  btnDisable: document.getElementById('btn-disable'),
  
  countAll: document.getElementById('count-all'),
  countConsole: document.getElementById('count-console'),
  countRegistry: document.getElementById('count-registry'),
  countFolder: document.getElementById('count-folder'),
  countTask: document.getElementById('count-task'),
  
  filterButtons: document.querySelectorAll('.nav-item')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  performScan();
});

// Event Listeners Setup
function setupEventListeners() {
  // Scan Button
  elements.btnScan.addEventListener('click', performScan);

  // Search Input
  elements.searchInput.addEventListener('input', () => {
    filterAndRenderItems();
  });

  // Filter Category Buttons
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.currentTarget;
      elements.filterButtons.forEach(b => b.classList.remove('active'));
      targetBtn.classList.add('active');
      currentFilter = targetBtn.getAttribute('data-filter');
      filterAndRenderItems();
    });
  });

  // Detail panel close
  elements.detailClose.addEventListener('click', closeDetailPanel);

  // Action Buttons
  elements.btnReveal.addEventListener('click', async () => {
    if (selectedItem && selectedItem.cleanPath) {
      const revealed = await window.api.revealInExplorer(selectedItem.cleanPath);
      if (!revealed) {
        alert('Dosya bulunamadı veya bu öğe bir kayıt defteri anahtarı olduğundan klasörde gösterilemiyor.');
      }
    }
  });

  elements.btnGoogle.addEventListener('click', () => {
    if (selectedItem) {
      const query = encodeURIComponent(`${selectedItem.Name} ${selectedItem.Command} startup windows`);
      const url = `https://www.google.com/search?q=${query}`;
      window.open(url, '_blank');
    }
  });

  elements.btnDisable.addEventListener('click', async () => {
    if (!selectedItem) return;
    
    const confirmMessage = `"${selectedItem.Name}" öğesini başlangıçtan kaldırmak/devre dışı bırakmak istediğinize emin misiniz?\n\nNot: Bazı sistem araçları için yönetici izni gerekebilir.`;
    if (confirm(confirmMessage)) {
      elements.btnDisable.disabled = true;
      elements.btnDisable.textContent = 'Kaldırılıyor...';
      
      const result = await window.api.disableStartupItem(selectedItem);
      
      elements.btnDisable.disabled = false;
      elements.btnDisable.textContent = 'Başlangıçtan Kaldır';

      if (result.success) {
        alert('Öğe başarıyla başlangıçtan kaldırıldı/devre dışı bırakıldı.');
        closeDetailPanel();
        performScan();
      } else {
        alert(`Hata Oluştu!\n\nÖğe devre dışı bırakılamadı. Bu işlem muhtemelen yönetici yetkisi (Administrator) gerektiriyor.\nDetay: ${result.error}`);
      }
    }
  });
}

// Perform Scan Command
async function performScan() {
  // Show loading
  elements.scanLoading.classList.remove('hidden');
  elements.itemsList.classList.add('hidden');
  elements.emptyState.classList.add('hidden');
  closeDetailPanel();

  try {
    const rawItems = await window.api.getStartupItems();
    allItems = rawItems.map(item => processStartupItem(item));
    
    // Sort items: Console/Script items first, then alphabetical
    allItems.sort((a, b) => {
      if (a.isConsole && !b.isConsole) return -1;
      if (!a.isConsole && b.isConsole) return 1;
      return a.Name.localeCompare(b.Name);
    });

    filterAndRenderItems();
    updateDashboardStats();
  } catch (err) {
    console.error('Scan failed:', err);
    alert('Başlangıç öğeleri yüklenirken bir hata oluştu: ' + err.message);
  } finally {
    elements.scanLoading.classList.add('hidden');
  }
}

// Process startup item raw data
function processStartupItem(item) {
  const cmd = item.Command || '';
  
  // Extract path and clean quotes
  let cleanPath = '';
  const match = cmd.match(/^"([^"]+)"/) || cmd.match(/^([^\s]+)/);
  if (match) {
    cleanPath = match[1];
  } else {
    cleanPath = cmd;
  }

  // Detect script type & CMD windows triggers
  const extMatch = cleanPath.match(/\.(bat|cmd|ps1|vbs|js|reg)$/i);
  const isConsoleExe = /cmd(\.exe)?|powershell(\.exe)?|pwsh(\.exe)?|wscript(\.exe)?|cscript(\.exe)?/i.test(cleanPath);
  const hasConsoleParam = /cmd|powershell|pwsh|\.bat|\.cmd|\.ps1/i.test(cmd);
  
  const isConsole = !!(extMatch || isConsoleExe || hasConsoleParam);
  
  // Risk & Type classifications
  let risk = 'low';
  let typeLabel = 'Uygulama';

  if (isConsole) {
    risk = 'warning';
    typeLabel = extMatch ? `${extMatch[1].toUpperCase()} Komut Dosyası` : 'Komut İstemi (CMD/PowerShell)';
  }

  // Handle specific suspicious paths
  if (cleanPath.toLowerCase().includes('appdata\\local\\temp') || cleanPath.toLowerCase().includes('windows\\temp')) {
    risk = 'danger';
    typeLabel += ' (Geçici Klasör - Şüpheli)';
  }

  return {
    ...item,
    cleanPath,
    isConsole,
    risk,
    typeLabel
  };
}

// Filter and Render UI List
function filterAndRenderItems() {
  const searchQuery = elements.searchInput.value.toLowerCase().trim();
  
  filteredItems = allItems.filter(item => {
    // 1. Category Filter
    if (currentFilter === 'console' && !item.isConsole) return false;
    if (currentFilter === 'registry' && item.Source !== 'Registry') return false;
    if (currentFilter === 'folder' && item.Source !== 'Startup Folder') return false;
    if (currentFilter === 'task' && item.Source !== 'Scheduled Task') return false;

    // 2. Search Query Filter
    if (searchQuery) {
      const nameMatch = item.Name.toLowerCase().includes(searchQuery);
      const cmdMatch = (item.Command || '').toLowerCase().includes(searchQuery);
      const srcMatch = item.Source.toLowerCase().includes(searchQuery);
      return nameMatch || cmdMatch || srcMatch;
    }

    return true;
  });

  renderItemsList();
}

// Render Items Grid HTML
function renderItemsList() {
  elements.itemsList.innerHTML = '';

  if (filteredItems.length === 0) {
    elements.itemsList.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.itemsList.classList.remove('hidden');

  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = `item-card ${item.isConsole ? 'console-warn' : ''}`;
    card.addEventListener('click', () => showDetailPanel(item));

    // Select suitable icon
    let iconSvg = '';
    if (item.isConsole) {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 17 10 11 4 5"/>
          <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
      `;
    } else if (item.Source === 'Registry') {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      `;
    } else if (item.Source === 'Startup Folder') {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="item-icon-wrapper">
          ${iconSvg}
        </div>
        <div class="item-meta">
          <h4 class="item-title" title="${escapeHtml(item.Name)}">${escapeHtml(item.Name)}</h4>
          <span class="item-source-tag">${escapeHtml(item.Source)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="command-snippet" title="${escapeHtml(item.Command)}">${escapeHtml(item.Command)}</div>
      </div>
      <div class="card-footer">
        <span class="category-pill ${item.isConsole ? 'console-pill' : ''}">${escapeHtml(item.typeLabel)}</span>
        <span class="card-action-hint">
          Detaylar
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </span>
      </div>
    `;

    elements.itemsList.appendChild(card);
  });
}

// Update counts and circular health gauge
function updateDashboardStats() {
  const counts = {
    all: allItems.length,
    console: allItems.filter(i => i.isConsole).length,
    registry: allItems.filter(i => i.Source === 'Registry').length,
    folder: allItems.filter(i => i.Source === 'Startup Folder').length,
    task: allItems.filter(i => i.Source === 'Scheduled Task').length,
  };

  elements.countAll.textContent = counts.all;
  elements.countConsole.textContent = counts.console;
  elements.countRegistry.textContent = counts.registry;
  elements.countFolder.textContent = counts.folder;
  elements.countTask.textContent = counts.task;

  // Health Score calculation
  // Base score 100%. Suspicious or scripting items decrease health
  // because scripts at boot frequently cause cmd prompt window popup annoyances.
  let score = 100;
  score -= (counts.console * 15);
  
  // Severe danger paths (temp directories, etc.) reduce score further
  const dangerItems = allItems.filter(i => i.risk === 'danger').length;
  score -= (dangerItems * 25);

  score = Math.max(10, Math.min(100, score));

  // Update circle gauge UI
  elements.healthScore.textContent = `%${score}`;
  
  // Set stroke-dasharray (circumference is 2 * PI * 15.9155 = 100)
  elements.healthValuePath.setAttribute('stroke-dasharray', `${score}, 100`);

  // Classify gauge color classes
  elements.healthValuePath.className = 'gauge-value';
  if (score > 80) {
    elements.healthValuePath.classList.add('good');
    elements.healthStatus.innerHTML = `Sistem İyi Durumda<div class="health-desc">Açılışta sadece ${counts.console} komut dosyası çalışıyor.</div>`;
  } else if (score > 50) {
    elements.healthValuePath.classList.add('warning');
    elements.healthStatus.innerHTML = `Orta Seviye Uyarı<div class="health-desc">${counts.console} başlangıç komutu/cmd açılışı yavaşlatabilir.</div>`;
  } else {
    elements.healthValuePath.classList.add('critical');
    elements.healthStatus.innerHTML = `Analiz Gerekli!<div class="health-desc">${counts.console} komut dosyası veya şüpheli açılış öğesi bulundu.</div>`;
  }
}

// Show selected startup item details
async function showDetailPanel(item) {
  selectedItem = item;
  
  elements.detailTitle.textContent = item.Name;
  elements.detailSourceDesc.textContent = `${item.Source} (${item.Location})`;
  elements.detailTriggerDesc.textContent = getFriendlyTrigger(item.Trigger || item.Source);
  elements.detailCommandText.textContent = item.Command;

  // Reset risk badge
  elements.detailRiskBadge.className = 'risk-badge';
  if (item.risk === 'danger') {
    elements.detailRiskBadge.classList.add('risk-danger');
    elements.detailRiskBadge.textContent = 'Şüpheli / Riskli';
  } else if (item.risk === 'warning') {
    elements.detailRiskBadge.classList.add('risk-warning');
    elements.detailRiskBadge.textContent = 'CMD / Komut Dosyası';
  } else {
    elements.detailRiskBadge.classList.add('risk-low');
    elements.detailRiskBadge.textContent = 'Güvenli (Uygulama)';
  }

  // Style badge based on console type
  elements.detailBadge.textContent = item.typeLabel;
  if (item.isConsole) {
    elements.detailBadge.className = 'badge badge-console';
  } else {
    elements.detailBadge.className = 'badge';
  }

  // Get Explanation text
  elements.detailExplanationText.innerHTML = generateExplanation(item);

  // Read Script Content if it's a file
  if (item.isConsole && item.cleanPath && (item.cleanPath.match(/\.(bat|cmd|ps1|vbs|js)$/i) || item.Source === 'Startup Folder')) {
    elements.scriptContentSection.classList.remove('hidden');
    elements.scriptFileName.textContent = getFileName(item.cleanPath);
    elements.scriptCodeContent.textContent = 'Script dosyası okunuyor...';
    elements.scriptAnalysisBox.innerHTML = 'Kod analizi yapılıyor...';

    const fileResult = await window.api.readScriptContent(item.cleanPath);
    
    if (fileResult.error) {
      elements.scriptCodeContent.textContent = fileResult.error;
      elements.scriptAnalysisBox.innerHTML = '<div class="analysis-warning-item">Dosya okunamadı. Programın exe veya kayıt defterine gömülü bir komut dizesi olması muhtemeldir.</div>';
    } else {
      elements.scriptCodeContent.textContent = fileResult.content;
      analyzeScriptCode(fileResult.content);
    }
  } else {
    elements.scriptContentSection.classList.add('hidden');
  }

  // Enable/Disable "Dosya Konumunu Aç" button
  if (item.cleanPath && item.Source !== 'Registry') {
    elements.btnReveal.style.display = 'flex';
  } else {
    elements.btnReveal.style.display = 'none';
  }

  // Open detail panel
  elements.detailPanel.classList.remove('closed');
}

// Close detail panel
function closeDetailPanel() {
  elements.detailPanel.classList.add('closed');
  selectedItem = null;
}

// Get cleaner trigger translation
function getFriendlyTrigger(trigger) {
  if (!trigger) return 'Açılışta';
  const t = trigger.toLowerCase();
  if (t.includes('logon')) return 'Kullanıcı Girişinde (Logon)';
  if (t.includes('boot')) return 'Bilgisayar Açılışında (Boot)';
  if (t.includes('registry')) return 'Kayıt Defteri Üzerinden';
  if (t.includes('folder')) return 'Başlangıç Klasöründen';
  return 'Açılışta';
}

// Extract filename
function getFileName(filepath) {
  if (!filepath) return '';
  return filepath.substring(filepath.lastIndexOf('\\') + 1);
}

// Explanations Dictionary & Parser
function generateExplanation(item) {
  const name = item.Name.toLowerCase();
  const cmd = item.Command.toLowerCase();
  
  // 1. Static Dictionary checks
  if (name.includes('onedrive')) {
    return `<p><strong>Microsoft OneDrive</strong> bulut yedekleme hizmetidir.</p><p>Açılışta dosyalarınızı senkronize etmek için çalışır. Kapatılması açılış hızını artırır ancak bulut senkronizasyonunun siz uygulamayı elinizle açana kadar çalışmasını engeller.</p>`;
  }
  if (name.includes('steam')) {
    return `<p><strong>Steam</strong> oyun platformudur.</p><p><code>-silent</code> parametresi ile arka planda sessizce (ekran açılmadan) çalışacak şekilde ayarlanmıştır. Oyun güncellemelerini almak ve arkadaşlarınızın aktifliğini görmek için çalışır. Güvenlidir, başlangıçtan kaldırılabilir.</p>`;
  }
  if (name.includes('razer')) {
    return `<p><strong>Razer Yazılımları</strong> (Synapse, Axon veya Cortex).</p><p>Razer marka klavye, fare veya kulaklıklarınızın renk profillerini, makrolarını ve özel tuş ayarlarını yükler. Kapatılması durumunda donanımlarınız varsayılan ışık/DPI ayarlarına dönebilir.</p>`;
  }
  if (name.includes('opera')) {
    return `<p><strong>Opera / Opera GX</strong> tarayıcı otomatik başlatıcısı veya asistanıdır.</p><p>Tarayıcının arka planda hazır beklemesini veya bildirim göndermesini sağlar. Sistem açılış hızını korumak için kapatılması önerilir.</p>`;
  }
  if (name.includes('riotclient')) {
    return `<p><strong>Riot Client</strong> (League of Legends, Valorant vb. oyunların ana istemcisi).</p><p>Arka planda sessiz modda çalışarak oyun güncellemelerini denetler. Güvenle kapatılabilir; kapatıldığında oyunlar açılırken Riot istemcisi kendiliğinden açılır.</p>`;
  }
  if (name.includes('discord')) {
    return `<p><strong>Discord</strong> sesli ve yazılı iletişim uygulamasıdır.</p><p>Bilgisayar açıldığında otomatik olarak arka planda başlar. Güvenle başlangıçtan kaldırılabilir.</p>`;
  }
  if (name.includes('lm studio')) {
    return `<p><strong>LM Studio</strong> yerel yapay zeka modelleri arayüzüdür.</p><p>Arka planda bir yapay zeka servisi başlatmak için ayarlanmıştır. İhtiyacınız yoksa başlangıçtan kaldırabilirsiniz.</p>`;
  }
  if (name.includes('hackatime') || name.includes('wakatime')) {
    return `<p><strong>Hackatime / WakaTime</strong> kod yazma süresi istatistik takibidir.</p><p>Geliştirme editörlerindeki aktiviteleri kaydetmek için arka planda küçük bir servis başlatır.</p>`;
  }
  if (name.includes('microsoftedgeautolaunch') || cmd.includes('msedge.exe')) {
    return `<p><strong>Microsoft Edge Hızlı Başlatıcı</strong>.</p><p>Edge tarayıcısının açılışını hızlandırmak için Edge parçalarını sistem açılışında arka belleğe yükler. Kapatılması Edge'in ilk açılışını yarım saniye geciktirebilir ama sistem açılışını rahatlatır.</p>`;
  }
  if (name.includes('copilot') || cmd.includes('mscopilot.exe')) {
    return `<p><strong>Microsoft Copilot</strong> yapay zeka asistanı yardımcı uygulamasıdır. Başlangıçta arka planda hazır beklemek üzere açılır.</p>`;
  }
  if (name.includes('ollama')) {
    return `<p><strong>Ollama AI</strong> yerel yapay zeka modeli sunucusudur.</p><p>Llama, Mistral gibi modelleri çalıştırmak için arka planda bir servis sunucusu barındırır. Güvenle kapatılabilir.</p>`;
  }
  if (name.includes('cloudflare warp') || cmd.includes('cloudflare warp')) {
    return `<p><strong>Cloudflare WARP</strong> DNS ve VPN servisidir.</p><p>İnternet bağlantınızı daha güvenli hale getirmek amacıyla açılışta otomatik olarak devreye girer.</p>`;
  }

  // 2. Shell Command / Scripts Check
  if (item.isConsole) {
    let html = `<p>⚠️ <strong>Konsol / Script Girdisi</strong></p>
                <p>Bu girdi doğrudan Windows Komut İstemi (CMD) veya PowerShell üzerinden bir script çalıştırmaktadır. <strong>Açılışta siyah CMD pencerelerinin yanıp sönmesinin veya açık kalmasının ana sebebi budur.</strong></p>`;
    
    // Command parameter extraction and analysis
    const params = [];
    if (cmd.includes('/c ')) {
      params.push(`<li><strong>/c</strong>: Komutu çalıştırır ve işlem bittiğinde siyah CMD penceresini otomatik kapatır. (Genellikle hızlıca yanıp sönen pencereler bu parametreyi kullanır)</li>`);
    }
    if (cmd.includes('/k ')) {
      params.push(`<li><strong>/k</strong>: Komutu çalıştırdıktan sonra CMD penceresini <strong>açık tutar</strong>. (Eğer açılışta siyah ekran gitmiyorsa bu parametre kullanılıyor olabilir)</li>`);
    }
    if (cmd.includes('/d ')) {
      params.push(`<li><strong>/d</strong>: Kayıt defterindeki otomatik çalıştırma komutlarını (AutoRun) yok sayar (Güvenlik için iyi).</li>`);
    }
    if (cmd.includes('-executionpolicy bypass') || cmd.includes('-ep bypass')) {
      params.push(`<li><strong>-ExecutionPolicy Bypass</strong>: PowerShell script çalıştırma kısıtlamalarını aşmak için güvenlik politikasını geçici olarak devre dışı bırakır. (Çoğu script kurulumunda kullanılır)</li>`);
    }
    if (cmd.includes('-windowstyle hidden') || cmd.includes('-w hidden')) {
      params.push(`<li><strong>-WindowStyle Hidden</strong>: Komut penceresini kullanıcıdan gizleyerek arka planda çalıştırmayı dener.</li>`);
    }
    if (cmd.includes('-noprofile') || cmd.includes('-nop')) {
      params.push(`<li><strong>-NoProfile</strong>: PowerShell kullanıcı profili yüklemesini atlayarak scriptin daha hızlı açılmasını sağlar.</li>`);
    }

    if (params.length > 0) {
      html += `<p style="margin-top: 10px;"><strong>Kullanılan Parametrelerin Analizi:</strong></p><ul>${params.join('')}</ul>`;
    }

    if (item.cleanPath) {
      html += `<p style="margin-top: 10px;"><strong>Çalıştırılan Dosya:</strong> <code>${escapeHtml(getFileName(item.cleanPath))}</code></p>`;
    }

    return html;
  }

  // Default fallback explanation
  return `<p>Bu başlangıç girdisi bir sistem uygulaması veya üçüncü parti bir yazılımdır.</p>
          <p>Yazılım adı: <strong>${escapeHtml(item.Name)}</strong></p>
          <p>Eğer bu programı tanımıyorsanız ve açılışta gereksiz yere çalıştığını düşünüyorsanız, aşağıdaki butonu kullanarak başlangıçtan kaldırabilirsiniz. Bu işlem programı silmez, sadece bilgisayar açıldığında kendiliğinden açılmasını engeller.</p>`;
}

// Analyze loaded script code contents for warnings
function analyzeScriptCode(code) {
  const lowercaseCode = code.toLowerCase();
  const warnings = [];

  // 1. File deletion commands
  if (lowercaseCode.includes('del ') || lowercaseCode.includes('erase ') || lowercaseCode.includes('rmdir ') || lowercaseCode.includes('rd ')) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Dosya veya Klasör Silme (del, rmdir) komutları içeriyor.</span>
      </div>
    `);
  }

  // 2. Registry operations
  if (lowercaseCode.includes('reg add') || lowercaseCode.includes('reg delete') || lowercaseCode.includes('regedit')) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>Kayıt Defteri (Registry) üzerinde değişiklik yapan kodlar barındırıyor.</span>
      </div>
    `);
  }

  // 3. Network operations (downloaders)
  if (lowercaseCode.includes('curl ') || lowercaseCode.includes('wget ') || lowercaseCode.includes('bitsadmin') || lowercaseCode.includes('invoke-webrequest') || lowercaseCode.includes('iwr ')) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>İnternetten dosya indirme/veri transferi (curl, wget vb.) kodları içeriyor.</span>
      </div>
    `);
  }

  // 4. Shutdown commands
  if (lowercaseCode.includes('shutdown') && (lowercaseCode.includes('-s') || lowercaseCode.includes('/s') || lowercaseCode.includes('-r') || lowercaseCode.includes('/r'))) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>
        </svg>
        <span>Bilgisayarı Kapatma veya Yeniden Başlatma komutu barındırıyor.</span>
      </div>
    `);
  }

  // 5. Service operations / process termination
  if (lowercaseCode.includes('net stop') || lowercaseCode.includes('sc stop') || lowercaseCode.includes('taskkill') || lowercaseCode.includes('stop-service')) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>Çalışan servisleri veya programları durdurma (taskkill, net stop) kodları içeriyor.</span>
      </div>
    `);
  }

  // 6. Infinite loops
  if (lowercaseCode.includes(':loop') || lowercaseCode.includes('goto loop') || lowercaseCode.includes('while($true)') || lowercaseCode.includes('while (true)')) {
    warnings.push(`
      <div class="analysis-warning-item">
        <svg class="warning-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67"/>
        </svg>
        <span>Döngüsel işlemler barındırıyor (arka planda sürekli çalışma riski).</span>
      </div>
    `);
  }

  // Render warnings or default green
  if (warnings.length > 0) {
    elements.scriptAnalysisBox.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 8px; color: var(--color-orange)">Kod Analiz Raporu:</div>
      ${warnings.join('')}
    `;
    elements.scriptAnalysisBox.style.background = 'rgba(249, 115, 22, 0.05)';
    elements.scriptAnalysisBox.style.borderColor = 'rgba(249, 115, 22, 0.25)';
  } else {
    elements.scriptAnalysisBox.innerHTML = `
      <div style="display: flex; gap: 8px; color: var(--color-green); font-weight: 600;">
        <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Temiz Gözüküyor: Potansiyel tehlikeli sistem komutları algılanmadı.</span>
      </div>
    `;
    elements.scriptAnalysisBox.style.background = 'rgba(16, 185, 129, 0.05)';
    elements.scriptAnalysisBox.style.borderColor = 'rgba(16, 185, 129, 0.25)';
  }
}

// Escape HTML utility helper
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
