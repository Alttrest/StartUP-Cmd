# StartupCMD - Windows Başlangıç Komut Analizörü ve Yöneticisi

StartupCMD, Windows işletim sistemi başladığında otomatik olarak arka planda veya ön planda çalışan tüm komut satırı araçlarını, script dosyalarını ve uygulamaları tarayan, açıklayan ve yöneten Electron tabanlı profesyonel bir masaüstü uygulamasıdır. 

Özellikle sistem açılışında kısa süreliğine veya kalıcı olarak açılan siyah komut istemi (CMD) pencerelerinin kaynağını tespit etmek, analiz etmek ve açılış hızını optimize etmek amacıyla tasarlanmıştır.

## 🚀 Özellikler

- **Gelişmiş Başlangıç Taraması**: Kayıt Defteri (Registry Run/RunOnce), Kullanıcı ve Ortak Başlangıç Klasörleri ile Zamanlanmış Görevleri (Scheduled Tasks - Logon/Boot) tek tıkla tarar.
- **CMD ve Script Tespiti**: Açılışta terminal penceresi (CMD/PowerShell) açılmasına yol açan girdileri otomatik tespit eder ve işaretler.
- **Kod Analizörü (Script Reader)**: Tespit edilen `.bat`, `.cmd`, `.ps1` gibi betik dosyalarının kod içeriğini doğrudan uygulama içinde gösterir.
- **Tehlike Analiz Raporu**: Betik kodlarını otomatik olarak tarayarak; dosya silme (`del`), kayıt defteri düzenleme (`reg`), internetten dosya indirme (`curl`/`wget`), sistemi kapatma (`shutdown`) gibi hassas sistem işlemlerini raporlar.
- **Tek Tıkla Başlangıçtan Kaldırma**: İstenmeyen veya gereksiz başlangıç girdilerini ilgili kayıt yollarından veya zamanlanmış görevlerden güvenli bir şekilde siler/devre dışı bırakır.
- **Dosya Konumunu Keşfetme**: Başlangıç girdisine ait dosya yolunu doğrudan Dosya Gezgini'nde açar.
- **İnternette Arama**: Tanınmayan dosyalar hakkında bilgi edinmek için doğrudan Google üzerinde arama yapma kolaylığı sağlar.
- **Premium Arayüz (Aesthetics)**: Modern glassmorphism efektleri, neon renk geçişleri, dinamik yükleme animasyonları ve sistem sağlık göstergesi içeren üst düzey karanlık tema.

## 🛠️ Kurulum ve Geliştirme

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
- **Windows İşletim Sistemi** (Tarama betikleri PowerShell entegrasyonu kullanmaktadır)
- **Node.js** (v18 veya üzeri sürüm önerilir)

### Adımlar

1. Depoyu klonlayın veya zip dosyasını çıkarın:
   ```bash
   git clone https://github.com/Alttre/startupcmd.git
   cd startupcmd
   ```

2. Gerekli tüm bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Uygulamayı geliştirici modunda çalıştırın:
   ```bash
   npm start
   ```

## 📦 Taşınabilir (Portable) EXE Dosyası Üretme

Uygulamayı herhangi bir Windows bilgisayarda kuruluma gerek olmadan doğrudan çalıştırılabilecek tek bir **portable .exe** dosyası haline getirmek için:

```bash
npm run build
```

Bu komut çalıştığında:
- Uygulama kodları sıkıştırılır.
- Uygulama ikonu (`icon.ico`) otomatik olarak paketlenir.
- Çıktı olarak tek parça taşınabilir `.exe` dosyası projenin ana dizinindeki **`dist/`** klasörünün içine (`dist/StartupCMD.exe`) kaydedilir.

---

## 🎨 Tasarım ve Arayüz Detayları

Arayüz, sistem bileşenlerinin durumunu gösteren dairesel bir **Sağlık Göstergesi (Health Score)** ile başlar. Başlangıçta açılan konsol pencereleri veya scriptlerin sayısı arttıkça sağlık puanı düşerek kullanıcının dikkatini çeker.

- **Kayıt Defteri Simgesi**: Registry girdileri için kalkan simgesi.
- **Klasör Simgesi**: Başlangıç klasörü öğeleri için klasör görseli.
- **Terminal Simgesi**: Açılışta açılan tüm siyah CMD ekranları ve scriptleri için terminal simgesi.

## ⚖️ Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasını inceleyebilirsiniz.
