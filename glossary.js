/**
 * glossary.js: local, offline translation of scraped README content.
 *
 * No AI, no network: this is a plain term dictionary with greedy
 * longest-phrase matching and light English morphology handling. It
 * translates the words it knows and leaves everything else untouched, so
 * the author's technical terms survive intact.
 *
 * Only plain text is translated; content.js marks code spans (`npm install`,
 * <kbd>Ctrl</kbd>, identifiers) as protected, and those are never touched.
 *
 * Exposed as window.RepoGlossary.translate(text, locale) →
 *   { text: string, hits: number }
 */

(() => {
  /* ------------------------------------------------------------------ *
   * Dictionaries: English term → translation.
   * Multi-word entries win over single words (longest match first).
   * ------------------------------------------------------------------ */

  const DICTIONARIES = {
    /* __APPEND__ */
    sv: {
      // --- phrases ---
      "open source": "öppen källkod",
      "code snippet": "kodsnutt",
      "code snippets": "kodsnuttar",
      "live demo": "live-demo",
      "getting started": "kom igång",
      "how to use": "så använder du",
      "built with": "byggd med",
      "written in": "skriven i",
      "powered by": "drivs av",
      "works with": "fungerar med",
      "cross platform": "plattformsoberoende",
      "self hosted": "självhostad",
      "command line": "kommandorad",
      "dark mode": "mörkt läge",
      "real time": "i realtid",
      "drag and drop": "dra och släpp",
      "out of the box": "direkt ur-boxen",
      "web application": "webbapplikation",
      "source code": "källkod",
      "unit tests": "enhetstester",
      "easy to use": "enkel att använda",
      "ready to use": "klar att använda",

      // --- function words ---
      is: "är", are: "är", and: "och", or: "eller", with: "med", for: "för",
      to: "att", of: "av", in: "i", on: "på", the: "", a: "", an: "",
      this: "detta", your: "din", we: "vi", you: "du", it: "det",
      can: "kan", will: "kommer", from: "från", by: "av", as: "som",
      at: "på", not: "inte", no: "nej", all: "alla", any: "någon",
      also: "också", only: "endast", new: "ny", first: "första",
      last: "sista", more: "mer", most: "mest", less: "mindre",
      that: "att", then: "sedan", so: "så", if: "om", than: "än",

      // --- nouns ---
      app: "app", application: "applikation", project: "projekt", tool: "verktyg",
      library: "bibliotek", plugin: "plugin", framework: "ramverk",
      platform: "plattform", service: "tjänst", server: "server", client: "klient",
      website: "webbplats", browser: "webbläsare", desktop: "skrivbord",
      mobile: "mobil", developer: "utvecklare", user: "användare",
      team: "team", community: "community", contributor: "bidragsgivare",
      code: "kod", file: "fil", folder: "mapp", directory: "katalog",
      config: "konfiguration", configuration: "konfiguration",
      settings: "inställningar", setup: "installation", usage: "användning",
      example: "exempel", template: "mall", script: "skript",
      command: "kommando", documentation: "dokumentation", guide: "guide",
      tutorial: "handledning", reference: "referens", changelog: "ändringslogg",
      roadmap: "färdplan", feature: "funktion", bug: "bugg", issue: "ärende",
      problem: "problem", solution: "lösning", note: "anteckning",
      editor: "redigerare", markdown: "markdown", text: "text", demo: "demo",
      authentication: "autentisering", account: "konto", email: "e-post",
      password: "lösenord", security: "säkerhet", privacy: "integritet",
      performance: "prestanda", speed: "hastighet", memory: "minne",
      version: "version", example: "exempel", installation: "installation",
      dashboard: "instrumentpanel", report: "rapport",
      notification: "avisering", permission: "behörighet", role: "roll",
      admin: "administratör", owner: "ägare", key: "nyckel", token: "token",
      cloud: "moln", local: "lokal", remote: "fjärr", history: "historik",
      list: "lista", table: "tabell", form: "formulär", button: "knapp",
      link: "länk", page: "sida", screen: "skärm", window: "fönster",
      image: "bild", video: "video", audio: "ljud", photo: "foto",
      chat: "chatt", message: "meddelande", task: "uppgift",
      license: "licens", interface: "gränssnitt", support: "support",
      design: "design", screenshot: "skärmbild", product: "produkt",

      // --- adjectives ---
      modern: "modern", fast: "snabb", simple: "enkel", easy: "enkel",
      powerful: "kraftfull", secure: "säker", clean: "ren",
      lightweight: "lätt", flexible: "flexibel", free: "gratis",
      open: "öppen", sleek: "elegant", creative: "kreativ",
      available: "tillgänglig", supported: "stöds", required: "obligatoriskt",
      optional: "valfritt", recommended: "rekommenderat", stable: "stabil",
      beta: "beta", alpha: "alpha", production: "produktion",
      native: "inbyggd", offline: "offline", online: "online",

      // --- verbs ---
      install: "installera", use: "använda", build: "bygga", run: "köra",
      execute: "köra", test: "testa", deploy: "driftsätta", download: "ladda ner",
      upload: "ladda upp", import: "importera", export: "exportera",
      save: "spara", store: "lagra", search: "söka", filter: "filtrera",
      manage: "hantera", share: "dela", create: "skapa", add: "lägg till",
      edit: "redigera", delete: "ta bort", remove: "ta bort", view: "visa",
      preview: "förhandsgranska", display: "visa", show: "visa",
      support: "stöda", update: "uppdatera", upgrade: "uppgradera",
      release: "släppa", sync: "synkronisera", backup: "säkerhetskopiera",
      check: "kontrollera", change: "ändra", choose: "välja", select: "välja",
      start: "starta", stop: "stoppa", pause: "pausa", continue: "fortsätta",
      enable: "aktivera", disable: "inaktivera", include: "inkludera",
      provide: "erbjuda", allow: "tillåta", make: "göra", get: "få",
      find: "hitta", need: "behöva", want: "vilja", help: "hjälpa",
      call: "kalla", name: "namn", look: "se", feel: "kännas",
      work: "fungera", try: "prova", learn: "lära", read: "läsa",
      write: "skriva", design: "designa", develop: "utveckla", release: "släppa",
      host: "hosta", clone: "klona", fork: "forka", customize: "anpassa",
      schedule: "schemalägg", generate: "generera", copy: "kopiera",

      // --- plurals, possessives and participles that stemming can't reach ---
      their: "deras", favorite: "favorit",
      snippet: "kodsnutt", snippets: "kodsnuttar", creatives: "kreativa",
      features: "funktioner", notes: "anteckningar", files: "filer",
      tools: "verktyg", examples: "exempel", users: "användare",
      developers: "utvecklare", libraries: "bibliotek", plugins: "pluginar",
      services: "tjänster", apps: "appar", servers: "servrar",
      designed: "designad", created: "skapad", built: "byggd",
      used: "använd", added: "tillagd", supported: "stödd",
      based: "baserad", written: "skriven", called: "kallad",
      named: "kallad", configured: "konfigurerad", developed: "utvecklad",
    },

    tr: {
      // --- phrases ---
      "open source": "açık kaynak",
      "code snippet": "kod parçacığı",
      "code snippets": "kod parçacıkları",
      "live demo": "canlı demo",
      "getting started": "başlarken",
      "how to use": "nasıl kullanılır",
      "built with": "şununla geliştirildi",
      "written in": "şu dilde yazıldı",
      "powered by": "altyapısı",
      "works with": "ile çalışır",
      "cross platform": "çapraz platform",
      "self hosted": "kendi sunucunuzda",
      "command line": "komut satırı",
      "dark mode": "karanlık mod",
      "real time": "gerçek zamanlı",
      "drag and drop": "sürükle bırak",
      "out of the box": "kutudan çıktığı gibi",
      "web application": "web uygulaması",
      "source code": "kaynak kodu",
      "unit tests": "birim testleri",
      "easy to use": "kullanımı kolay",
      "ready to use": "kullanıma hazır",

      // --- function words ---
      is: "", are: "", and: "ve", or: "veya", with: "ile", for: "için",
      to: "", of: "", in: "", on: "", the: "", a: "", an: "",
      this: "bu", your: "sizin", we: "biz", you: "siz", it: "",
      can: "yapabilir", will: "olacak", from: "", by: "", as: "olarak",
      at: "", not: "değil", no: "hayır", all: "tüm", any: "herhangi",
      also: "ayrıca", only: "yalnızca", new: "yeni", first: "ilk",
      last: "son", more: "daha", most: "en", less: "daha az",
      that: "", then: "sonra", so: "böylece", if: "eğer", than: "kadar",

      // --- nouns ---
      app: "uygulama", application: "uygulama", project: "proje", tool: "araç",
      library: "kütüphane", plugin: "eklenti", framework: "çerçeve",
      platform: "platform", service: "hizmet", server: "sunucu", client: "istemci",
      website: "web sitesi", browser: "tarayıcı", desktop: "masaüstü",
      mobile: "mobil", developer: "geliştirici", user: "kullanıcı",
      team: "ekip", community: "topluluk", contributor: "katkıda bulunan",
      code: "kod", file: "dosya", folder: "klasör", directory: "dizin",
      config: "yapılandırma", configuration: "yapılandırma",
      settings: "ayarlar", setup: "kurulum", usage: "kullanım",
      example: "örnek", template: "şablon", script: "betik",
      command: "komut", documentation: "belgelendirme", guide: "rehber",
      tutorial: "öğretici", reference: "referans", changelog: "değişiklik günlüğü",
      roadmap: "yol haritası", feature: "özellik", bug: "hata", issue: "konu",
      problem: "sorun", solution: "çözüm", note: "not",
      editor: "editör", markdown: "markdown", text: "metin", demo: "demo",
      authentication: "kimlik doğrulama", account: "hesap", email: "e-posta",
      password: "parola", security: "güvenlik", privacy: "gizlilik",
      performance: "performans", speed: "hız", memory: "bellek",
      version: "sürüm", installation: "kurulum",
      dashboard: "panel", report: "rapor",
      notification: "bildirim", permission: "izin", role: "rol",
      admin: "yönetici", owner: "sahip", key: "anahtar", token: "belirteç",
      cloud: "bulut", local: "yerel", remote: "uzak", history: "geçmiş",
      list: "liste", table: "tablo", form: "form", button: "buton",
      link: "bağlantı", page: "sayfa", screen: "ekran", window: "pencere",
      image: "görsel", video: "video", audio: "ses", photo: "fotoğraf",
      chat: "sohbet", message: "mesaj", task: "görev",
      license: "lisans", interface: "arayüz", support: "destek",
      design: "tasarım", screenshot: "ekran görüntüsü", product: "ürün",

      // --- adjectives ---
      modern: "modern", fast: "hızlı", simple: "basit", easy: "kolay",
      powerful: "güçlü", secure: "güvenli", clean: "temiz",
      lightweight: "hafif", flexible: "esnek", free: "ücretsiz",
      open: "açık", sleek: "şık", creative: "yaratıcı",
      available: "mevcut", supported: "desteklenen", required: "zorunlu",
      optional: "isteğe bağlı", recommended: "önerilen", stable: "kararlı",
      beta: "beta", alpha: "alfa", production: "üretim",
      native: "yerel", offline: "çevrimdışı", online: "çevrimiçi",

      // --- verbs ---
      install: "kur", use: "kullan", build: "derle", run: "çalıştır",
      execute: "çalıştır", test: "test et", deploy: "dağıt", download: "indir",
      upload: "yükle", import: "içe aktar", export: "dışa aktar",
      save: "kaydet", store: "depola", search: "ara", filter: "filtrele",
      manage: "yönet", share: "paylaş", create: "oluştur", add: "ekle",
      edit: "düzenle", delete: "sil", remove: "kaldır", view: "görüntüle",
      preview: "önizle", display: "göster", show: "göster",
      support: "destekle", update: "güncelle", upgrade: "yükselt",
      release: "yayınla", sync: "eşitle", backup: "yedekle",
      check: "kontrol et", change: "değiştir", choose: "seç", select: "seç",
      start: "başlat", stop: "durdur", pause: "duraklat", continue: "devam et",
      enable: "etkinleştir", disable: "devre dışı bırak", include: "dahil et",
      provide: "sağla", allow: "izin ver", make: "yap", get: "al",
      find: "bul", need: "ihtiyaç duy", want: "istek", help: "yardım et",
      call: "çağır", name: "ad", look: "bak", feel: "hisset",
      work: "çalış", try: "dene", learn: "öğren", read: "oku",
      write: "yaz", design: "tasarla", develop: "geliştir",
      host: "barındır", clone: "klonla", fork: "çatalla", customize: "özelleştir",
      schedule: "zamanla", generate: "üret", copy: "kopyala",

      // --- plurals, possessives and participles that stemming can't reach ---
      their: "onların", favorite: "favori",
      snippet: "kod parçacığı", snippets: "kod parçacıkları", creatives: "yaratıcılar",
      features: "özellikler", notes: "notlar", files: "dosyalar",
      tools: "araçlar", examples: "örnekler", users: "kullanıcılar",
      developers: "geliştiriciler", libraries: "kütüphaneler",
      plugins: "eklentiler", services: "hizmetler", apps: "uygulamalar",
      servers: "sunucular", designed: "tasarlanmış", created: "oluşturuldu",
      built: "geliştirildi", used: "kullanılan", added: "eklendi",
      supported: "desteklenen", based: "dayalı", written: "yazılmış",
      called: "denir", named: "adlandırılmış", configured: "yapılandırılmış",
      developed: "geliştirilmiş",
    },

    ar: {
      // --- phrases ---
      "open source": "مفتوح المصدر",
      "code snippet": "مقتطف شيفرة",
      "code snippets": "مقتطفات شيفرة",
      "live demo": "عرض حي",
      "getting started": "البداية",
      "how to use": "كيفية الاستخدام",
      "built with": "بُني باستخدام",
      "written in": "مكتوب بلغة",
      "powered by": "مدعوم بواسطة",
      "works with": "يعمل مع",
      "cross platform": "متعدد المنصات",
      "self hosted": "مستضاف ذاتيًا",
      "command line": "سطر الأوامر",
      "dark mode": "الوضع الداكن",
      "real time": "في الوقت الفعلي",
      "drag and drop": "السحب والإفلات",
      "out of the box": "جاهز للاستخدام",
      "web application": "تطبيق ويب",
      "source code": "الشيفرة المصدرية",
      "unit tests": "اختبارات الوحدة",
      "easy to use": "سهل الاستخدام",
      "ready to use": "جاهز للاستخدام",

      // --- function words ---
      is: "هو", are: "هم", and: "و", or: "أو", with: "مع", for: "لـ",
      to: "إلى", of: "من", in: "في", on: "على", the: "", a: "", an: "",
      this: "هذا", your: "سلك", we: "نحن", you: "أنت", it: "هو",
      can: "يمكن", will: "سيتم", from: "من", by: "بواسطة", as: "كـ",
      at: "عند", not: "ليس", no: "لا", all: "كل", any: "أي",
      also: "أيضًا", only: "فقط", new: "جديد", first: "الأول",
      last: "الأخير", more: "أكثر", most: "الأكثر", less: "أقل",
      that: "أن", then: "ثم", so: "لذلك", if: "إذا", than: "أكثر من",

      // --- nouns ---
      app: "تطبيق", application: "تطبيق", project: "مشروع", tool: "أداة",
      library: "مكتبة", plugin: "إضافة", framework: "إطار عمل",
      platform: "منصة", service: "خدمة", server: "خادم", client: "عميل",
      website: "موقع", browser: "متصفح", desktop: "سطح المكتب",
      mobile: "الهاتف", developer: "مطور", user: "مستخدم",
      team: "فريق", community: "مجتمع", contributor: "مساهم",
      code: "شيفرة", file: "ملف", folder: "مجلد", directory: "دليل",
      config: "إعدادات", configuration: "إعدادات",
      settings: "الإعدادات", setup: "التثبيت", usage: "الاستخدام",
      example: "مثال", template: "قالب", script: "سكربت",
      command: "أمر", documentation: "توثيق", guide: "دليل",
      tutorial: "شرح", reference: "مرجع", changelog: "سجل التغييرات",
      roadmap: "خارطة الطريق", feature: "ميزة", bug: "خلل", issue: "مسألة",
      problem: "مشكلة", solution: "حل", note: "ملاحظة",
      editor: "محرر", markdown: "ماركداون", text: "نص", demo: "عرض",
      authentication: "المصادقة", account: "حساب", email: "بريد إلكتروني",
      password: "كلمة مرور", security: "أمان", privacy: "خصوصية",
      performance: "أداء", speed: "سرعة", memory: "ذاكرة",
      version: "إصدار", installation: "التثبيت",
      dashboard: "لوحة تحكم", report: "تقرير",
      notification: "إشعار", permission: "إذن", role: "دور",
      admin: "مسؤول", owner: "مالك", key: "مفتاح", token: "رمز",
      cloud: "سحابة", local: "محلي", remote: "بعيد", history: "السجل",
      list: "قائمة", table: "جدول", form: "نموذج", button: "زر",
      link: "رابط", page: "صفحة", screen: "شاشة", window: "نافذة",
      image: "صورة", video: "فيديو", audio: "صوت", photo: "صورة",
      chat: "دردشة", message: "رسالة", task: "مهمة",
      license: "رخصة", interface: "واجهة", support: "دعم",
      design: "تصميم", screenshot: "لقطة شاشة", product: "منتج",

      // --- adjectives ---
      modern: "حديث", fast: "سريع", simple: "بسيط", easy: "سهل",
      powerful: "قوي", secure: "آمن", clean: "نظيف",
      lightweight: "خفيف", flexible: "مرن", free: "مجاني",
      open: "مفتوح", sleek: "أنيق", creative: "إبداعي",
      available: "متاح", supported: "مدعوم", required: "مطلوب",
      optional: "اختياري", recommended: "موصى به", stable: "مستقر",
      beta: "تجريبي", alpha: "ألفا", production: "إنتاج",
      native: "أصلي", offline: "غير متصل", online: "متصل",

      // --- verbs ---
      install: "ثبّت", use: "استخدم", build: "ابنِ", run: "شغّل",
      execute: "نفّذ", test: "اختبر", deploy: "انشر", download: "نزّل",
      upload: "ارفع", import: "استورد", export: "صدّر",
      save: "احفظ", store: "خزّن", search: "ابحث", filter: "رشّح",
      manage: "أدر", share: "شارك", create: "أنشئ", add: "أضف",
      edit: "حرّر", delete: "احذف", remove: "أزل", view: "اعرض",
      preview: "معاينة", display: "اعرض", show: "اظهر",
      support: "ادعم", update: "حدّث", upgrade: "رقِّ",
      release: "أطلق", sync: "زامن", backup: "انسخ احتياطيًا",
      check: "تحقق", change: "غيّر", choose: "اختر", select: "اختر",
      start: "ابدأ", stop: "أوقف", pause: "أوقف مؤقتًا", continue: "تابع",
      enable: "فعّل", disable: "عطّل", include: "أدرج",
      provide: "قدّم", allow: "اسمح", make: "اصنع", get: "احصل",
      find: "ابحث عن", need: "يحتاج", want: "يريد", help: "ساعد",
      call: "استدعِ", name: "سمِّ", look: "انظر", feel: "اشعر",
      work: "يعمل", try: "جرّب", learn: "تعلّم", read: "اقرأ",
      write: "اكتب", design: "صمّم", develop: "طوّر",
      host: "استضف", clone: "استنسخ", fork: "اشتقّ", customize: "خصّص",
      schedule: "جدول", generate: "ولّد", copy: "انسخ",

      // --- plurals, possessives and participles that stemming can't reach ---
      their: "خاصتهم", favorite: "المفضل",
      snippet: "مقتطف شيفرة", snippets: "مقتطفات شيفرة", creatives: "المبدعين",
      features: "الميزات", notes: "الملاحظات", files: "الملفات",
      tools: "الأدوات", examples: "الأمثلة", users: "المستخدمون",
      developers: "المطورون", libraries: "المكتبات", plugins: "الإضافات",
      services: "الخدمات", apps: "التطبيقات", servers: "الخوادم",
      designed: "مصمم", created: "منشأ", built: "مبني",
      used: "مستخدم", added: "مضاف", supported: "مدعوم",
      based: "قائم على", written: "مكتوب", called: "المسمى",
      named: "مسمى", configured: "مهيأ", developed: "مطور",
    },

    es: {
      // --- phrases ---
      "open source": "código abierto",
      "code snippet": "fragmento de código",
      "code snippets": "fragmentos de código",
      "live demo": "demo en vivo",
      "getting started": "Primeros pasos",
      "how to use": "cómo usarlo",
      "built with": "creado con",
      "written in": "escrito en",
      "powered by": "impulsado por",
      "works with": "funciona con",
      "cross platform": "multipataforma",
      "self hosted": "autoalojado",
      "command line": "línea de comandos",
      "dark mode": "modo oscuro",
      "real time": "en tiempo real",
      "drag and drop": "arrastrar y soltar",
      "out of the box": "listo para usar",
      "web application": "aplicación web",
      "source code": "código fuente",
      "unit tests": "pruebas unitarias",
      "easy to use": "fácil de usar",
      "ready to use": "listo para usar",

      // --- function words ---
      is: "es", are: "son", and: "y", or: "o", with: "con", for: "para",
      to: "a", of: "de", in: "en", on: "en", the: "", a: "", an: "",
      this: "este", your: "tu", we: "nosotros", you: "tú", it: "",
      can: "puede", will: "será", from: "desde", by: "por", as: "como",
      at: "en", not: "no", no: "no", all: "todo", any: "cualquier",
      also: "también", only: "solo", new: "nuevo", first: "primero",
      last: "último", more: "más", most: "más", less: "menos",
      that: "que", then: "entonces", so: "así", if: "si", than: "que",

      // --- nouns ---
      app: "aplicación", application: "aplicación", project: "proyecto", tool: "herramienta",
      library: "biblioteca", plugin: "complemento", framework: "marco",
      platform: "plataforma", service: "servicio", server: "servidor", client: "cliente",
      website: "sitio web", browser: "navegador", desktop: "escritorio",
      mobile: "móvil", developer: "desarrollador", user: "usuario",
      team: "equipo", community: "comunidad", contributor: "colaborador",
      code: "código", file: "archivo", folder: "carpeta", directory: "directorio",
      config: "configuración", configuration: "configuración",
      settings: "ajustes", setup: "instalación", usage: "uso",
      example: "ejemplo", template: "plantilla", script: "script",
      command: "comando", documentation: "documentación", guide: "guía",
      tutorial: "tutorial", reference: "referencia", changelog: "registro de cambios",
      roadmap: "hoja de ruta", feature: "funcionalidad", bug: "error", issue: "incidencia",
      problem: "problema", solution: "solución", note: "nota",
      editor: "editor", markdown: "markdown", text: "texto", demo: "demo",
      authentication: "autenticación", account: "cuenta", email: "correo electrónico",
      password: "contraseña", security: "seguridad", privacy: "privacidad",
      performance: "rendimiento", speed: "velocidad", memory: "memoria",
      version: "versión", installation: "instalación",
      dashboard: "panel", report: "informe",
      notification: "notificación", permission: "permiso", role: "rol",
      admin: "administrador", owner: "propietario", key: "clave", token: "token",
      cloud: "nube", local: "local", remote: "remoto", history: "historial",
      list: "lista", table: "tabla", form: "formulario", button: "botón",
      link: "enlace", page: "página", screen: "pantalla", window: "ventana",
      image: "imagen", video: "vídeo", audio: "audio", photo: "foto",
      chat: "chat", message: "mensaje", task: "tarea",
      license: "licencia", interface: "interfaz", support: "soporte",
      design: "diseño", screenshot: "captura de pantalla", product: "producto",

      // --- adjectives ---
      modern: "moderno", fast: "rápido", simple: "simple", easy: "fácil",
      powerful: "potente", secure: "seguro", clean: "limpio",
      lightweight: "ligero", flexible: "flexible", free: "gratis",
      open: "abierto", sleek: "elegante", creative: "creativo",
      available: "disponible", supported: "compatible", required: "obligatorio",
      optional: "opcional", recommended: "recomendado", stable: "estable",
      beta: "beta", alpha: "alfa", production: "producción",
      native: "nativo", offline: "sin conexión", online: "en línea",

      // --- verbs ---
      install: "instalar", use: "usar", build: "compilar", run: "ejecutar",
      execute: "ejecutar", test: "probar", deploy: "desplegar", download: "descargar",
      upload: "subir", import: "importar", export: "exportar",
      save: "guardar", store: "almacenar", search: "buscar", filter: "filtrar",
      manage: "gestionar", share: "compartir", create: "crear", add: "añadir",
      edit: "editar", delete: "eliminar", remove: "quitar", view: "ver",
      preview: "previsualizar", display: "mostrar", show: "mostrar",
      support: "soportar", update: "actualizar", upgrade: "mejorar",
      release: "publicar", sync: "sincronizar", backup: "copia de seguridad",
      check: "comprobar", change: "cambiar", choose: "elegir", select: "seleccionar",
      start: "iniciar", stop: "detener", pause: "pausar", continue: "continuar",
      enable: "activar", disable: "desactivar", include: "incluir",
      provide: "proporcionar", allow: "permitir", make: "hacer", get: "obtener",
      find: "encontrar", need: "necesitar", want: "querer", help: "ayudar",
      call: "llamar", name: "nombre", look: "mirar", feel: "sentir",
      work: "funcionar", try: "probar", learn: "aprender", read: "leer",
      write: "escribir", design: "diseñar", develop: "desarrollar",
      host: "alojar", clone: "clonar", fork: "bifurcar", customize: "personalizar",
      schedule: "programar", generate: "generar", copy: "copiar",

      // --- plurals, possessives and participles that stemming can't reach ---
      their: "sus", favorite: "favorito",
      snippet: "fragmento de código", snippets: "fragmentos de código", creatives: "creativos",
      features: "funcionalidades", notes: "notas", files: "archivos",
      tools: "herramientas", examples: "ejemplos", users: "usuarios",
      developers: "desarrolladores", libraries: "bibliotecas",
      plugins: "complementos", services: "servicios", apps: "aplicaciones",
      servers: "servidores", designed: "diseñado", created: "creado",
      built: "creado", used: "usado", added: "añadido",
      supported: "compatible", based: "basado", written: "escrito",
      called: "llamado", named: "llamado", configured: "configurado",
      developed: "desarrollado",
    },
  };

  /** Longest phrase we try, in tokens. */
  const MAX_PHRASE_TOKENS = 4;
  /** Collapse whitespace and trim (kept local so this file is standalone). */
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  /** Don't stem words shorter than this (avoids mangling short words). */
  const MIN_STEM = 3;

  const compiled = new Map();

  const getDictionary = (locale) => {
    if (compiled.has(locale)) return compiled.get(locale);
    const table = DICTIONARIES[locale];
    if (!table) return null;
    const map = new Map(Object.entries(table));
    compiled.set(locale, map);
    return map;
  };

  const isAllCaps = (s) => s.length > 1 && /[A-Z]/.test(s) && s === s.toUpperCase();
  const isCapitalized = (s) => /^[A-Z][a-z]/.test(s);

  /** Mirror the source word's capitalisation onto the translation. */
  const applyCase = (source, translation) => {
    if (isAllCaps(source)) return translation.toUpperCase();
    if (isCapitalized(source)) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    return translation;
  };

  /**
   * Candidate lookup forms for a word: itself, then common English
   * inflections stripped ("installing" → "install", "features" → "feature").
   */
  const stems = (token) => {
    const lower = token.toLowerCase();
    const out = [lower];
    const add = (s) => {
      if (s && s.length >= MIN_STEM && !out.includes(s)) out.push(s);
    };
    if (lower.length < MIN_STEM + 1) return out;
    if (lower.endsWith("ies") && lower.length > MIN_STEM + 2) add(lower.slice(0, -3) + "y");
    if (lower.endsWith("ing") && lower.length > MIN_STEM + 2) {
      add(lower.slice(0, -3));
      add(lower.slice(0, -4)); // "running" → "run"
    }
    if (lower.endsWith("ed") && lower.length > MIN_STEM + 1) {
      add(lower.slice(0, -2));
      add(lower.slice(0, -3)); // "created" → "create"
    }
    if (lower.endsWith("es") && lower.length > MIN_STEM + 1) add(lower.slice(0, -2));
    if (lower.endsWith("s") && lower.length > MIN_STEM) add(lower.slice(0, -1));
    return out;
  };

  /**
   * Split a token into surrounding punctuation + word core, so "sleek," and
   * "user's" still match their dictionary entries.
   */
  const WORD_CORE = /^([^\p{L}\p{N}]*)([\p{L}\p{N}][\p{L}\p{N}'’+-]*)([^\p{L}\p{N}]*)$/u;

  /** Translate a single word token, or null when nothing matched. */
  const translateWord = (token, dict) => {
    const match = WORD_CORE.exec(token);
    if (!match) return null; // pure punctuation

    const [, before, core, after] = match;
    // Drop a trailing possessive so "user's" looks up as "user".
    const lookup = core.replace(/[’']s$/i, "") || core;

    for (const stem of stems(lookup)) {
      const hit = dict.get(stem);
      if (hit !== undefined) {
        return before + applyCase(core, hit) + after;
      }
    }
    return null;
  };

  /**
   * Translate free text.
   * @param {string} text
   * @param {string} locale target language (English = pass-through)
   * @returns {{text: string, hits: number}}
   */
  const translate = (text, locale) => {
    const source = text || "";
    if (!source.trim()) return { text: source, hits: 0 };
    if (!locale || locale === "en") return { text: source, hits: 0 };

    const dict = getDictionary(locale);
    if (!dict) return { text: source, hits: 0 };

    // Split into words and separators, keeping the separators for rejoin.
    const tokens = source.split(/(\s+)/).filter((s) => s.length);
    const out = [];
    let hits = 0;
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      if (/^\s+$/.test(token)) {
        out.push(token);
        i += 1;
        continue;
      }

      // Greedy longest-phrase match (4 → 2 tokens). Edge punctuation is
      // ignored so "code snippets." still matches the "code snippets" entry.
      let phraseHit = null;
      for (let span = MAX_PHRASE_TOKENS; span >= 2; span -= 1) {
        const slice = tokens.slice(i, i + span * 2 - 1);
        if (slice.length < span * 2 - 1) continue;

        const cores = [];
        let trailing = "";
        let usable = true;
        for (const piece of slice) {
          if (/^\s+$/.test(piece)) continue;
          const parts = WORD_CORE.exec(piece);
          if (!parts || parts[1]) {
            usable = false; // punctuation inside or before the phrase
            break;
          }
          cores.push(parts[2]);
          trailing = parts[3];
        }
        if (!usable || cores.length !== span) continue;

        const hit = dict.get(cores.join(" ").toLowerCase());
        if (hit !== undefined) {
          phraseHit = { span, text: hit, trailing, first: cores[0] };
          break;
        }
      }

      if (phraseHit) {
        out.push(applyCase(phraseHit.first, phraseHit.text) + phraseHit.trailing);
        hits += 1;
        i += phraseHit.span * 2 - 1;
        continue;
      }

      const word = translateWord(token, dict);
      if (word !== null) {
        out.push(word);
        hits += 1;
      } else {
        out.push(token);
      }
      i += 1;
    }

    // Empty replacements (e.g. Swedish articles) can leave double spaces.
    let result = out.join("").replace(/[ \t]{2,}/g, " ").trim();

    // Arabic writes clitics tight: prepositions bind to the FOLLOWING word
    // (keep the space before them), conjunctions (و/أو) swallow both sides.
    if (locale === "ar") {
      result = result
        .replace(/(^|\s)(و|أو)\s+/g, "$2")
        .replace(/(لـ|في|من|على|إلى|مع|بـ|كـ)\s+/g, "$1")
        .replace(/\s{2,}/g, " ");
    }

    return { text: result, hits };
  };

  const hasLocale = (locale) => !!DICTIONARIES[locale];

  /**
   * Translate ONLY short keyword-style strings (titles, taglines, chips).
   *
   * Word-by-word substitution destroys running prose; it cannot fix word
   * order, verb forms or grammar; so it is applied strictly to short labels
   * where it genuinely works, and only when most words are known. A sentence
   * that would come out half-translated is returned untouched instead.
   *
   * @param {string} text
   * @param {string} locale
   * @param {{maxWords?: number, minCoverage?: number}} [options]
   * @returns {{text: string, applied: boolean, hits: number}}
   */
  const translateKeyword = (text, locale, options = {}) => {
    const { maxWords = 8, minCoverage = 0.7 } = options;
    const source = clean(text);
    const words = source.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
    if (!source || words.length === 0 || words.length > maxWords) {
      return { text: source, applied: false, hits: 0 };
    }
    const result = translate(source, locale);
    const coverage = result.hits / words.length;
    if (coverage < minCoverage) {
      return { text: source, applied: false, hits: result.hits };
    }
    return { text: result.text, applied: true, hits: result.hits };
  };

  window.RepoGlossary = { translate, translateKeyword, hasLocale };
})();