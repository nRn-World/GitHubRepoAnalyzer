/**
 * i18n.js: UI translations for the popup.
 *
 * English is the default and is always the first option in the list. The
 * user's choice is persisted in chrome.storage.local and restored every time
 * the popup opens; until they change it, the popup stays English.
 *
 * Exposed as window.RepoI18n; see applyTranslations() for how the DOM is
 * wired up via data-i18n attributes.
 */

(() => {
  /** Always ordered: English first, then the rest. Never re-sorted. */
  const LOCALES = [
    { code: "en", label: "English", dir: "ltr" },
    { code: "sv", label: "Svenska", dir: "ltr" },
    { code: "tr", label: "Türkçe", dir: "ltr" },
    { code: "ar", label: "العربية", dir: "rtl" },
    { code: "es", label: "Español", dir: "ltr" },
  ];

  const DEFAULT_LOCALE = "en";

  const STRINGS = {
    en: {
      badge: "local",
      langLabel: "Language",
      idleHint: "Get a quick, human-readable summary of this repository, in the author's own words.",
      analyzeBtn: "Analyze this project",
      loading: "Reading the page…",
      errorHeading: "This isn't a GitHub repository page.",
      errorDetailNotRepo: "Open a repository page (github.com/owner/repo) and click the extension icon again.",
      errorDetailUrl: "This GitHub URL doesn't look like a repository. Try a page like github.com/owner/repo.",
      errorGeneric: "Something went wrong while reading the page. Please try again.",
      errorInject: "Couldn't analyze this page: {message}",
      errorNoTab: "Could not access the current tab.",
      labelAbout: "About",
      labelTopics: "Topics",
      labelReadme: "What it is",
      labelPoints: "Key points",
      analyzeAgain: "Analyze again",
      labelInShort: "In short",
      copyAiBtn: "Need more? Ask your AI chat or google.com. Click to copy the question.",
      copyAiDone: "Copied! Paste it into your AI chat",
      copyAiFailed: "Copy failed. Select the text manually.",
      aiPrompt: "Can you analyse what this project is and explain it simply and clearly so I understand:\n\nLink: {url}\n\nInformation I have (In short):\n{short}\n\nWhat it is:\n{what}",
      deepBtn: "Deep analysis",
      deepHide: "Hide details",
      type_learning: "A learning project",
      purpose_learning: "for working through a topic step by step, day by day.",
      type_game: "A game",
      purpose_game: "for playing directly in the browser.",
      type_cli: "A command-line tool",
      purpose_cli: "for running tasks from the terminal.",
      type_ai_ml: "An AI / machine-learning project",
      purpose_ai_ml: "for training or using models on data.",
      type_library: "A code library",
      purpose_library: "for other developers to build on top of.",
      type_website: "A website / web app",
      purpose_website: "for using directly in the browser.",
      type_tool: "A tool or extension",
      purpose_tool: "for automating or extending something you already use.",
      cap_play: "playable in the browser",
      cap_learn: "a structured day-by-day curriculum",
      cap_install: "installation instructions",
      cap_customize: "customization options",
      cap_demo: "screenshots and a demo",
      cap_extend: "an API for extension",
      cap_selfhost: "self-hosting instructions",
      shortCapabilities: "The README documents: {list}.",
      shortLanguages: "Main languages: {list}.",
      emptyDescription: "No description provided.",
      emptyTopics: "No topics added.",
      emptyReadme: "No readable README text found on this page.",
      byOwner: "by {owner}",
      starsLabel: "{count} stars",
      translating: "Translating…",
      downloadingModel: "Downloading the language model. This only happens once…",
      statusNoApi: "This Chrome build has no on-device Translator, so the text stays in the author's language.",
      statusNoModel: "Chrome has no language model for {pair}, so the text stays in the author's language.",
      statusNeedsModel: "Chrome is still downloading the language model for {pair}. Click \"Analyze again\" in a minute.",
      statusDetectFailed: "Chrome could not identify the source language, so the text stays as written.",
      statusMetaFailed: "The key points are translated, but the About text and tagline are not.",
      statusPartial: "Most sentences were translated; a few stay in the author’s language.",
    },

    sv: {
      badge: "lokal",
      langLabel: "Språk",
      idleHint: "Få en snabb och lättläst sammanfattning av det här repot, på författarens egna ord.",
      analyzeBtn: "Analysera det här projektet",
      loading: "Läser sidan…",
      errorHeading: "Det här är inte en GitHub-repositorie.",
      errorDetailNotRepo: "Öppna en repositoriesida (github.com/owner/repo) och klicka på tillägget igen.",
      errorDetailUrl: "Den här GitHub-adressen ser inte ut att vara en repositorie. Prova en sida som github.com/owner/repo.",
      errorGeneric: "Något gick fel när sidan lästes. Försök igen.",
      errorInject: "Kunde inte analysera sidan: {message}",
      errorNoTab: "Kunde inte komma åt den aktuella fliken.",
      labelAbout: "Om",
      labelTopics: "Ämnen",
      labelReadme: "Vad det är",
      labelPoints: "Nyckelpunkter",
      analyzeAgain: "Analysera igen",
      labelInShort: "I korthet",
      copyAiBtn: "Behöver du ytterligare information? Fråga din AI-chat eller google.com. Klicka för att kopiera frågan.",
      copyAiDone: "Kopierat! Klistra in i din AI-chat",
      copyAiFailed: "Kunde inte kopiera. Markera texten manuellt.",
      aiPrompt: "Kan du ge mig analys om vad detta projekt är, förklara enkelt och tydligt så jag förstår:\n\nLänk: {url}\n\nInformation jag har (I korthet):\n{short}\n\nVad det är:\n{what}",
      deepBtn: "Djup analys",
      deepHide: "Dölj detaljer",
      type_learning: "Ett inlärningsprojekt",
      purpose_learning: "för att gå igenom ett ämne steg för steg, dag för dag.",
      type_game: "Ett spel",
      purpose_game: "för att spela direkt i webbläsaren.",
      type_cli: "Ett kommandoradsverktyg",
      purpose_cli: "för att köra uppgifter från terminalen.",
      type_ai_ml: "Ett AI-/maskininlärningsprojekt",
      purpose_ai_ml: "för att träna eller använda modeller på data.",
      type_library: "Ett kodbibliotek",
      purpose_library: "som andra utvecklare kan bygga vidare på.",
      type_website: "En webbplats/webbapp",
      purpose_website: "för att användas direkt i webbläsaren.",
      type_tool: "Ett verktyg eller tillägg",
      purpose_tool: "för att automatisera eller utöka något du redan använder.",
      cap_play: "spelbart i webbläsaren",
      cap_learn: "en strukturerad dag-för-dag-kurs",
      cap_install: "installationsinstruktioner",
      cap_customize: "anpassningsmöjligheter",
      cap_demo: "skärmbilder och demo",
      cap_extend: "ett API att bygga vidare på",
      cap_selfhost: "instruktioner för egen hosting",
      shortCapabilities: "README:n dokumenterar: {list}.",
      shortLanguages: "Huvudspråk: {list}.",
      emptyDescription: "Ingen beskrivning angiven.",
      emptyTopics: "Inga ämnen tillagda.",
      emptyReadme: "Ingen läsbar README-text hittades på sidan.",
      byOwner: "av {owner}",
      starsLabel: "{count} stjärnor",
      translating: "Översätter…",
      downloadingModel: "Hämtar språkmodellen. Det här sker bara en gång…",
      statusNoApi: "Den här Chrome-versionen saknar inbyggd översättare, så texten står kvar på författarens språk.",
      statusNoModel: "Chrome saknar språkmodell för {pair}, så texten står kvar på författarens språk.",
      statusNeedsModel: "Chrome hämtar fortfarande språkmodellen för {pair}. Klicka \"Analysera igen\" om en minut.",
      statusDetectFailed: "Chrome kunde inte identifiera källspråket, så texten står kvar som den är.",
      statusMetaFailed: "Nyckelpunkterna är översatta, men Om-texten och tagline står kvar på originalspråket.",
      statusPartial: "De flesta meningarna är översatta; några står kvar på författarens språk.",
    },

    tr: {
      badge: "yerel",
      langLabel: "Dil",
      idleHint: "Bu depoyu yazarın kendi ifadeleriyle hızlı ve anlaşılır biçimde özetleyin.",
      analyzeBtn: "Bu projeyi analiz et",
      loading: "Sayfa okunuyor…",
      errorHeading: "Bu bir GitHub depo sayfası değil.",
      errorDetailNotRepo: "Bir depo sayfası açın (github.com/owner/repo) ve eklentiye tekrar tıklayın.",
      errorDetailUrl: "Bu GitHub adresi bir depo gibi görünmüyor. github.com/owner/repo gibi bir sayfa deneyin.",
      errorGeneric: "Sayfa okunurken bir şeyler ters gitti. Lütfen tekrar deneyin.",
      errorInject: "Bu sayfa analiz edilemedi: {message}",
      errorNoTab: "Geçerli sekmeye erişilemedi.",
      labelAbout: "Hakkında",
      labelTopics: "Konular",
      labelReadme: "Ne olduğu",
      labelPoints: "Öne çıkanlar",
      analyzeAgain: "Tekrar analiz et",
      labelInShort: "Kısaca",
      copyAiBtn: "Daha fazlası mı gerekli? Yapay zekâ sohbetine veya google.com’a sorun. Kopyalamak için tıklayın.",
      copyAiDone: "Kopyalandı! Yapay zekâ sohbetinize yapıştırın",
      copyAiFailed: "Kopyalanamadı. Metni elle seçin.",
      aiPrompt: "Bu projenin ne olduğunu analiz edip basit ve net biçimde açıklar mısın:\n\nBağlantı: {url}\n\nElimdeki bilgiler (Kısaca):\n{short}\n\nNe olduğu:\n{what}",
      deepBtn: "Derin analiz",
      deepHide: "Ayrıntıları gizle",
      type_learning: "Bir öğrenme projesi",
      purpose_learning: "bir konuyu adım adım, gün gün ilerlemek için.",
      type_game: "Bir oyun",
      purpose_game: "tarayıcıda doğrudan oynamak için.",
      type_cli: "Bir komut satırı aracı",
      purpose_cli: "görevleri terminalden çalıştırmak için.",
      type_ai_ml: "Bir yapay zeka / makine öğrenmesi projesi",
      purpose_ai_ml: "veri üzerinde model eğitmek veya kullanmak için.",
      type_library: "Bir kod kütüphanesi",
      purpose_library: "başka geliştiricilerin üzerine inşa etmesi için.",
      type_website: "Bir web sitesi / web uygulaması",
      purpose_website: "tarayıcıda doğrudan kullanmak için.",
      type_tool: "Bir araç veya eklenti",
      purpose_tool: "kullandığınız bir şeyi otomatikleştirmek veya genişletmek için.",
      cap_play: "tarayıcıda oynanabilir",
      cap_learn: "yapılandırılmış gün gün müfredat",
      cap_install: "kurulum talimatları",
      cap_customize: "özelleştirme seçenekleri",
      cap_demo: "ekran görüntüleri ve demo",
      cap_extend: "genişletme için bir API",
      cap_selfhost: "kendi sunucunda barındırma talimatları",
      shortCapabilities: "README şunları belgeliyor: {list}.",
      shortLanguages: "Ana diller: {list}.",
      emptyDescription: "Açıklama belirtilmemiş.",
      emptyTopics: "Konu eklenmemiş.",
      emptyReadme: "Bu sayfada okunabilir bir README metni bulunamadı.",
      byOwner: "{owner} tarafından",
      starsLabel: "{count} yıldız",
      translating: "Çevriliyor…",
      downloadingModel: "Dil modeli indiriliyor, bu yalnızca bir kez olur…",
      statusNoApi: "Bu Chrome sürümünde cihaz içi çevirmen yok, bu yüzden metin yazarın dilinde kalıyor.",
      statusNoModel: "Chrome'da {pair} için dil modeli yok, bu yüzden metin yazarın dilinde kalıyor.",
      statusNeedsModel: "Chrome {pair} dil modelini indirmeye devam ediyor. Bir dakika sonra \"Analysera igen\"'e tıklayın.",
      statusDetectFailed: "Chrome kaynak dili tanıyamadı, bu yüzden metin olduğu gibi kalıyor.",
      statusMetaFailed: "Öne çıkanlar çevrildi, ancak açıklama ve tagline orijinal dilinde kaldı.",
      statusPartial: "Cümlelerin çoğu çevrildi; birkaçı yazarın dilinde kaldı.",
    },

    ar: {
      badge: "محلي",
      langLabel: "اللغة",
      idleHint: "احصل على ملخّص سريع وسهل القراءة لهذا المستودع، بكلمات صاحبه.",
      analyzeBtn: "حلّل هذا المشروع",
      loading: "جارٍ قراءة الصفحة…",
      errorHeading: "هذه ليست صفحة مستودع على GitHub.",
      errorDetailNotRepo: "افتح صفحة مستودع (github.com/owner/repo) ثم انقر على الإضافة مرة أخرى.",
      errorDetailUrl: "هذا الرابط على GitHub لا يبدو مستودعًا. جرّب صفحة مثل github.com/owner/repo.",
      errorGeneric: "حدث خطأ أثناء قراءة الصفحة. حاول مرة أخرى.",
      errorInject: "تعذّر تحليل هذه الصفحة: {message}",
      errorNoTab: "تعذّر الوصول إلى علامة التبويب الحالية.",
      labelAbout: "نبذة",
      labelTopics: "المواضيع",
      labelReadme: "ما هو",
      labelPoints: "أبرز النقاط",
      analyzeAgain: "حلّل مرة أخرى",
      labelInShort: "باختصار",
      copyAiBtn: "تريد المزيد؟ اسأل محادثة الذكاء الاصطناعي أو google.com. انقر لنسخ السؤال.",
      copyAiDone: "تم النسخ! الصقه في محادثة الذكاء الاصطناعي",
      copyAiFailed: "فشل النسخ. حدّد النص يدويًا.",
      aiPrompt: "هل يمكنك تحليل ما هو هذا المشروع وشرحه ببساطة ووضوح:\n\nالرابط: {url}\n\nالمعلومات المتوفرة (باختصار):\n{short}\n\nما هو:\n{what}",
      deepBtn: "تحليل معمّق",
      deepHide: "إخفاء التفاصيل",
      type_learning: "مشروع تعليمي",
      purpose_learning: "للتقدم في موضوع خطوة بخطوة، يومًا بيوم.",
      type_game: "لعبة",
      purpose_game: "للعب مباشرة في المتصفح.",
      type_cli: "أداة سطر أوامر",
      purpose_cli: "لتنفيذ المهام من الطرفية.",
      type_ai_ml: "مشروع ذكاء اصطناعي / تعلم آلي",
      purpose_ai_ml: "لتدريب النماذج أو استخدامها على البيانات.",
      type_library: "مكتبة برمجية",
      purpose_library: "ليبنى عليها مطورون آخرون.",
      type_website: "موقع ويب / تطبيق ويب",
      purpose_website: "للاستخدام مباشرة في المتصفح.",
      type_tool: "أداة أو إضافة",
      purpose_tool: "لأتمتة أو توسيع شيء تستخدمه بالفعل.",
      cap_play: "قابل للعب في المتصفح",
      cap_learn: "منهج يومي منظم",
      cap_install: "تعليمات التثبيت",
      cap_customize: "خيارات التخصيص",
      cap_demo: "لقطات شاشة وعرض توضيحي",
      cap_extend: "واجهة برمجية للتوسيع",
      cap_selfhost: "تعليمات الاستضافة الذاتية",
      shortCapabilities: "يوثّق ملف README: {list}.",
      shortLanguages: "اللغات الرئيسية: {list}.",
      emptyDescription: "لا يوجد وصف.",
      emptyTopics: "لا توجد مواضيع.",
      emptyReadme: "لم يُعثر على نص قابل للقراءة في ملف README على هذه الصفحة.",
      byOwner: "بواسطة {owner}",
      starsLabel: "{count} نجمة",
      translating: "جارٍ الترجمة…",
      downloadingModel: "جارٍ تنزيل نموذج اللغة، ويحدث هذا مرة واحدة فقط…",
      statusNoApi: "لا يحتوي هذا الإصدار من Chrome على مترجم مدمج، لذا يبقى النص بلغة المؤلف.",
      statusNoModel: "لا يحتوي Chrome على نموذج لغة لـ {pair}، لذا يبقى النص بلغة المؤلف.",
      statusNeedsModel: "لا يزال Chrome ينزّل نموذج اللغة لـ {pair}. انقر على \"حلل مرة أخرى\" بعد دقيقة.",
      statusDetectFailed: "لم يتمكّن Chrome من تحديد اللغة المصدرية، لذا يبقى النص كما هو.",
      statusMetaFailed: "النقاط الرئيسية مترجمة، لكن نص الوصف والشعار لم يُترجما.",
      statusPartial: "تُرجمت معظم الجمل، وبقيت بضعها بلغة المؤلف.",
    },

    es: {
      badge: "local",
      langLabel: "Idioma",
      idleHint: "Obtén un resumen rápido y legible de este repositorio, con las palabras del autor.",
      analyzeBtn: "Analizar este proyecto",
      loading: "Leyendo la página…",
      errorHeading: "Esta no es una página de repositorio de GitHub.",
      errorDetailNotRepo: "Abre una página de repositorio (github.com/owner/repo) y haz clic de nuevo en la extensión.",
      errorDetailUrl: "Esta URL de GitHub no parece un repositorio. Prueba una página como github.com/owner/repo.",
      errorGeneric: "Algo salió mal al leer la página. Inténtalo de nuevo.",
      errorInject: "No se pudo analizar esta página: {message}",
      errorNoTab: "No se pudo acceder a la pestaña actual.",
      labelAbout: "Acerca de",
      labelTopics: "Temas",
      labelReadme: "Qué es",
      labelPoints: "Puntos clave",
      analyzeAgain: "Analizar de nuevo",
      labelInShort: "En resumen",
      copyAiBtn: "¿Necesitas más? Pregunta a tu chat de IA o a google.com. Haz clic para copiar la pregunta.",
      copyAiDone: "¡Copiado! Pégalo en tu chat de IA",
      copyAiFailed: "No se pudo copiar. Selecciona el texto manualmente.",
      aiPrompt: "¿Puedes analizar qué es este proyecto y explicarlo de forma sencilla y clara:\n\nEnlace: {url}\n\nInformación que tengo (En resumen):\n{short}\n\nQué es:\n{what}",
      deepBtn: "Análisis profundo",
      deepHide: "Ocultar detalles",
      type_learning: "Un proyecto de aprendizaje",
      purpose_learning: "para avanzar en un tema paso a paso, día a día.",
      type_game: "Un juego",
      purpose_game: "para jugar directamente en el navegador.",
      type_cli: "Una herramienta de línea de comandos",
      purpose_cli: "para ejecutar tareas desde la terminal.",
      type_ai_ml: "Un proyecto de IA / aprendizaje automático",
      purpose_ai_ml: "para entrenar o usar modelos con datos.",
      type_library: "Una biblioteca de código",
      purpose_library: "para que otros desarrolladores construyan sobre ella.",
      type_website: "Un sitio web / aplicación web",
      purpose_website: "para usar directamente en el navegador.",
      type_tool: "Una herramienta o extensión",
      purpose_tool: "para automatizar o ampliar algo que ya usas.",
      cap_play: "jugable en el navegador",
      cap_learn: "un plan de estudios día a día",
      cap_install: "instrucciones de instalación",
      cap_customize: "opciones de personalización",
      cap_demo: "capturas de pantalla y demo",
      cap_extend: "una API para extenderlo",
      cap_selfhost: "instrucciones de autoalojamiento",
      shortCapabilities: "El README documenta: {list}.",
      shortLanguages: "Idiomas principales: {list}.",
      emptyDescription: "Sin descripción.",
      emptyTopics: "Sin temas añadidos.",
      emptyReadme: "No se encontró texto legible del README en esta página.",
      byOwner: "por {owner}",
      starsLabel: "{count} estrellas",
      translating: "Traduciendo…",
      downloadingModel: "Descargando el modelo de idioma, solo ocurre una vez…",
      statusNoApi: "Esta versión de Chrome no tiene traductor integrado, así que el texto sigue en el idioma del autor.",
      statusNoModel: "Chrome no tiene un modelo de idioma para {pair}, así que el texto sigue en el idioma del autor.",
      statusNeedsModel: "Chrome todavía está descargando el modelo de idioma para {pair}. Pulsa \"Analizar de nuevo\" en un minuto.",
      statusDetectFailed: "Chrome no pudo identificar el idioma de origen, así que el texto se queda tal cual.",
      statusMetaFailed: "Los puntos clave están traducidos, pero la descripción y el eslogan no.",
      statusPartial: "La mayoría de las frases se tradujeron; algunas siguen en el idioma del autor.",
    },
  };

  let current = DEFAULT_LOCALE;

  /* ------------------------------------------------------------------ *
   * Lookup
   * ------------------------------------------------------------------ */

  const isSupported = (code) => LOCALES.some((l) => l.code === code);

  /**
   * Translate a key, with optional {placeholder} substitution.
   * Falls back to English, then to the key itself.
   */
  const t = (key, vars) => {
    const table = STRINGS[current] || STRINGS[DEFAULT_LOCALE];
    let value = table[key];
    if (value === undefined) value = STRINGS[DEFAULT_LOCALE][key];
    if (value === undefined) return key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${name}\\}`, "g"), replacement);
      }
    }
    return value;
  };

  const getLocale = () => current;
  const getDir = () => LOCALES.find((l) => l.code === current)?.dir || "ltr";

  /** Persist the user's choice. Silently ignores storage failures. */
  const setLocale = async (code) => {
    if (!isSupported(code)) return;
    current = code;
    try {
      await chrome.storage.local.set({ locale: code });
    } catch {
      /* popup still works for this session, choice just won't persist */
    }
  };

  /** Restore the saved choice; stays English until the user picks one. */
  const loadLocale = async () => {
    try {
      const stored = await chrome.storage.local.get("locale");
      if (stored && isSupported(stored.locale)) current = stored.locale;
    } catch {
      /* keep the default */
    }
    return current;
  };

  /** Populate a <select> with the locale list (English always first). */
  const fillLanguageSelect = (select) => {
    if (!select) return;
    select.textContent = "";
    for (const locale of LOCALES) {
      const option = document.createElement("option");
      option.value = locale.code;
      option.textContent = locale.label;
      select.appendChild(option);
    }
    select.value = current;
  };

  /**
   * Translate the whole popup:
   *  - [data-i18n]        → textContent
   *  - [data-i18n-html]   → innerHTML (only for our own authored strings)
   *  - [data-i18n-aria]   → aria-label
   *  - sets <html lang> and dir (RTL for Arabic)
   */
  const applyTranslations = (root = document) => {
    document.documentElement.lang = current;
    document.documentElement.dir = getDir();

    root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria));
    });
  };

  window.RepoI18n = {
    LOCALES,
    DEFAULT_LOCALE,
    t,
    getLocale,
    getDir,
    setLocale,
    loadLocale,
    fillLanguageSelect,
    applyTranslations,
  };
})();