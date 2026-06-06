export const SUPPORTED_UI_LANGUAGES = ["mr", "en"];

const MR_TO_EN = {
  "माझी डेअरी": "Majhi Dairy",
  "स्मार्ट डेअरी व्यवस्थापन": "Smart Dairy Management",
  "मुख्यपृष्ठ": "Home",
  "गायी": "Cows",
  "नोंदी": "Records",
  "आठवण": "Reminders",
  "आठवणी": "Reminders",
  "अहवाल": "Reports",
  "हिशोब": "Accounting",
  "वासरे": "Calves",
  "सूचना": "Notifications",
  "सेटिंग्ज": "Settings",
  "माझी माहिती": "My Profile",
  "PIN बदला": "Change PIN",
  "लॉगआउट": "Logout",
  "खाते": "Account",
  "मालक": "Owner",
  "कामगार": "Worker",
  "वापरकर्ता": "User",
  "लॉगआउट करायचे आहे का?": "Do you want to logout?",
  "मोबाइल notification चालू करा": "Turn on mobile notifications",
  "Admin कडून आलेल्या सूचना थेट phone notification panel मध्ये दिसतील.": "Admin notifications will appear directly in your phone notification panel.",
  "Mobile notification setup अपूर्ण आहे": "Mobile notification setup is incomplete",
  "Permission आहे, पण server वर push keys नीट configure नाहीत.": "Permission is allowed, but push keys are not configured correctly on the server.",
  "Mobile notification registration बाकी आहे": "Mobile notification registration is pending",
  "Permission दिली आहे, पण हा phone अजून server मध्ये जोडलेला नाही. पुन्हा चालू करा.": "Permission is allowed, but this phone is not connected to the server yet. Turn it on again.",
  "मोबाइल notification चालू झाले.": "Mobile notifications are enabled.",
  "Notification चालू करताना अडचण आली.": "There was a problem enabling notifications.",
  "चालू करत आहे...": "Turning on...",
  "चालू करा": "Turn On",
  "नको": "Not Now",

  "दिसणे आणि भाषा": "Appearance and Language",
  "App तुमच्या वापराप्रमाणे सोयीचे करा.": "Make the app comfortable for your use.",
  "Theme Mode": "Theme Mode",
  "Light, Dark किंवा phone च्या system प्रमाणे.": "Use Light, Dark, or your phone system setting.",
  "Font Size": "Font Size",
  "लहान": "Small",
  "मध्यम": "Medium",
  "मोठा": "Large",
  "Language": "Language",
  "मराठी": "Marathi",
  "Default Page": "Default Page",
  "Login नंतर कोणते page आधी उघडावे.": "Choose which page opens first after login.",
  "Accessibility": "Accessibility",
  "Compact Mode": "Compact Mode",
  "Spacing कमी करून जास्त माहिती दिसेल.": "Reduce spacing to show more information.",
  "High Contrast": "High Contrast",
  "Text आणि background अधिक स्पष्ट.": "Make text and background clearer.",
  "Large Touch Targets": "Large Touch Targets",
  "Buttons मोठे, phone वर tap करायला सोपे.": "Make buttons larger and easier to tap on phone.",
  "Reduce Animations": "Reduce Animations",
  "Animation कमी करून app शांत आणि जलद वाटेल.": "Reduce animations so the app feels calmer and faster.",
  "सुरू": "On",
  "बंद": "Off",
  "जतन करत आहे...": "Saving...",
  "✅ सेटिंग्ज जतन करा": "✅ Save Settings",
  "दिसणे आणि भाषा सेटिंग्ज जतन झाल्या.": "Appearance and language settings saved.",
  "Appearance settings मिळाल्या नाहीत.": "Appearance settings could not be loaded.",
  "Appearance settings जतन झाल्या नाहीत.": "Appearance settings could not be saved.",
  "दिसणे सेटिंग्ज लोड होत आहेत...": "Loading appearance settings...",

  "प्रोफाइल": "Profile",
  "नाव, फोटो, गाव आणि डेअरी माहिती": "Name, photo, village and dairy information",
  "सुरक्षा केंद्र": "Security Center",
  "PIN, password, login history आणि sessions": "PIN, password, login history and sessions",
  "सूचना सेटिंग्ज": "Notification Settings",
  "Mobile notification, शांत वेळ आणि श्रेणी": "Mobile notifications, quiet hours and categories",
  "पशुवैद्यक": "Veterinarians",
  "डॉक्टरांची नावे जोडा आणि नोंदीत dropdown मधून निवडा": "Add doctors and select them from dropdowns in records",
  "Theme, font size, language आणि accessibility": "Theme, font size, language and accessibility",
  "दुग्धमित्र AI": "Dugdhamitra AI",
  "AI सहाय्यक": "AI Assistant",
  "AI toggle, उत्तर शैली, data परवानगी आणि history": "AI toggle, response style, data permissions and history",
  "दूध लक्ष्य": "Milk Goals",
  "दूध अहवाल": "Milk Reports",
  "स्लिप स्कॅनर": "Slip Scanner",
  "दैनिक, साप्ताहिक, मासिक आणि गुणवत्ता लक्ष्य": "Daily, weekly, monthly and quality goals",
  "Export आणि Backup": "Export and Backup",
  "PDF, Excel, CSV, JSON download आणि backup": "PDF, Excel, CSV, JSON download and backup",
  "मदत आणि Support": "Help and Support",
  "FAQ, tickets, tutorials आणि contact support": "FAQ, tickets, tutorials and contact support",
  "तुमचे खाते, सुरक्षा, सूचना आणि app दिसणे एका ठिकाणी.": "Your account, security, notifications and app appearance in one place.",

  "दूध नोंद": "Milk Entry",
  "स्लिप स्कॅन": "Slip Scan",
  "स्लिप स्कॅन करा": "Scan Slip",
  "खर्च नोंद": "Expense Entry",
  "खर्च": "Expense",
  "स्कॅन": "Scan",
  "कॅमेरा": "Camera",
  "अहवाल छापा": "Print Report",
  "रोजचे दूध, आठवणी आणि हिशोब एकाच ठिकाणी": "Daily milk, reminders and accounting in one place",
  "आजचे दूध": "Today's Milk",
  "सकाळचे दूध": "Morning Milk",
  "संध्याकाळचे दूध": "Evening Milk",
  "आजचे उत्पन्न": "Today's Income",
  "आज दूध": "Today Milk",
  "बाकी स्लिप": "Pending Slips",
  "आजच्या आठवणी": "Today's Reminders",
  "पुढील आठवणी": "Upcoming Reminders",
  "मागील आठवणी": "Past Reminders",
  "मागील बाकी": "Past Pending",
  "सारांश": "Summary",
  "मासिक सारांश": "Monthly Summary",
  "आजची दूध नोंद अपडेट झाली": "Today's milk record was updated",
  "आजचे उत्पन्न तयार झाले": "Today's income is ready",
  "देयक स्लिप अपलोड बाकी": "Payment slip upload is pending",
  "आजच्या आठवणी तयार आहेत": "Today's reminders are ready",
  "मासिक दूध सारांश अपडेट": "Monthly milk summary updated",
  "स्लिप तयार करत आहे...": "Preparing slip...",
  "AI सहाय्यक उघडा": "Open AI Assistant",
  "AI उघडा →": "Open AI →",
  "आज मी तुमची कशी मदत करू?": "How can I help you today?",
  "आजचे दूध?": "Today's milk?",
  "या महिन्याचे उत्पन्न?": "This month's income?",
  "सरासरी फॅट?": "Average fat?",
  "आजच्या आठवणी?": "Today's reminders?",
  "फोनचा कॅमेरा थेट उघडून स्पष्ट फोटो घ्या": "Open the phone camera directly and take a clear photo",
  "AI वाचेल": "AI will read",
  "तुम्ही तपासा": "You verify",
  "कॅमेरा →": "Camera →",
  "कामाची यादी": "Work List",
  "सर्व": "All",
  "उघडा →": "Open →",
  "पहिले बाकी": "First pending",
  "कोणत्या महिन्याची १५ दिवसांची स्लिप राहिली आहे ते तपासा.": "Check which month's 15-day slip is still pending.",
  "आज कोणतीही आठवण नाही.": "No reminders today.",
  "मागील बाकी आठवण नाही.": "No past pending reminders.",
  "पुढील ७ दिवसांत आठवण नाही.": "No reminders in the next 7 days.",
  "आजचे लक्ष्य": "Today's Goal",
  "लक्ष्य बंद आहे": "Goal Off",
  "लक्ष्य पूर्ण": "Goal Completed",
  "काम सुरू": "In Progress",
  "लक्ष्य सुरू केल्यावर आजची प्रगती येथे दिसेल.": "When the goal is enabled, today's progress will appear here.",
  "अभिनंदन! आजचे दूध लक्ष्य पूर्ण झाले.": "Congratulations! Today's milk goal is completed.",
  "पूर्ण": "Complete",
  "या महिन्याची स्थिती": "This Month's Status",
  "शुद्ध नफा / तोटा": "Net Profit / Loss",
  "तपशील →": "Details →",
  "उत्पन्न": "Income",
  "उत्पन्न:": "Income:",
  "खर्च:": "Expense:",
  "खाद्य खर्च + इतर": "Feed expense + other",
  "आजचे अपडेट": "Today's Updates",
  "अलीकडील हालचाल": "Recent Activity",
  "आज नवीन हालचाल नाही.": "No new activity today.",
  "मागील महिन्याचा डेटा": "Previous Month Data",
  "दूध:": "Milk:",
  "नफा:": "Profit:",
  "पूर्ण अहवाल बघा →": "View Full Report →",
  "मासिक खर्च": "Monthly Expenses",
  "मासिक नफा": "Monthly Profit",
  "दूध": "Milk",
  "एकूण गायी": "Total Cows",
  "गाभण गायी": "Pregnant Cows",
  "दूध सविस्तर अहवाल": "Detailed Milk Report",
  "उत्पन्न सविस्तर": "Detailed Income",
  "खर्च सविस्तर": "Detailed Expenses",
  "नफा-तोटा विश्लेषण": "Profit-Loss Analysis",
  "पूर्ण हिशोब अहवाल": "Full Accounting Report",
  "वार्षिक अहवाल": "Annual Report",
  "गाय कामगिरी": "Cow Performance",
  "लसीकरण यादी": "Vaccination List",
  "मासिक अहवाल छापा": "Print Monthly Report",
  "माहिती बघा": "View Details",
  "नवीन गाय": "New Cow",
  "नवीन वासरू": "New Calf",
  "जतन करा": "Save",
  "रद्द करा": "Cancel",
  "पुन्हा प्रयत्न करा": "Retry",
  "लोड होत आहे...": "Loading...",
  "खाते तपासत आहे...": "Checking account...",
  "लॉगिन पान उघडत आहे...": "Opening login page...",
  "माहिती मिळवताना चूक झाली.": "Something went wrong while loading information.",
  "लॉगिन आवश्यक आहे.": "Login required."
};

const EN_TO_MR = Object.fromEntries(
  Object.entries(MR_TO_EN).map(([marathi, english]) => [english, marathi])
);

EN_TO_MR.Reminders = "आठवण";

const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CANVAS", "SVG", "TEXTAREA"]);

export function normalizeUiLanguage(language) {
  return language === "en" ? "en" : "mr";
}

function preserveWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export function translateUiText(text, language) {
  if (!text || typeof text !== "string") return text;

  const targetLanguage = normalizeUiLanguage(language);
  const dictionary = targetLanguage === "en" ? MR_TO_EN : EN_TO_MR;
  const trimmed = text.trim();

  if (!trimmed) return text;
  if (dictionary[trimmed]) {
    return preserveWhitespace(text, dictionary[trimmed]);
  }

  const prefixedMatch = trimmed.match(/^([^A-Za-z0-9\u0900-\u097F]+)\s+(.+)$/u);
  if (prefixedMatch && dictionary[prefixedMatch[2]]) {
    return preserveWhitespace(text, `${prefixedMatch[1]} ${dictionary[prefixedMatch[2]]}`);
  }

  if (targetLanguage === "en") {
    const trialOkMatch = trimmed.match(/^🎉 आपल्याकडे\s+(.+?)\s+दिवसांचा चाचणी कालावधी आहे\.$/u);
    if (trialOkMatch) return preserveWhitespace(text, `🎉 You have ${trialOkMatch[1]} days of trial remaining.`);

    const trialWarningMatch = trimmed.match(/^⚠️ आपला चाचणी कालावधी\s+(.+?)\s+दिवसांत संपणार आहे\.$/u);
    if (trialWarningMatch) return preserveWhitespace(text, `⚠️ Your trial will end in ${trialWarningMatch[1]} days.`);

    if (trimmed === "🔒 आपला चाचणी कालावधी संपला आहे.") {
      return preserveWhitespace(text, "🔒 Your trial has expired.");
    }

    const pendingSlipMatch = trimmed.match(/^(.+?)\s+देयक स्लिप अपलोड बाकी$/u);
    if (pendingSlipMatch) return preserveWhitespace(text, `${pendingSlipMatch[1]} payment slips pending`);

    const firstPendingMatch = trimmed.match(/^पहिले बाकी:\s*(.+)$/u);
    if (firstPendingMatch) return preserveWhitespace(text, `First pending: ${firstPendingMatch[1]}`);

    const goalTargetMatch = trimmed.match(/^लक्ष्य:\s*(.+)$/u);
    if (goalTargetMatch) return preserveWhitespace(text, `Target: ${goalTargetMatch[1]}`);

    const remainingLitersMatch = trimmed.match(/^(.+?)\s+लिटर बाकी$/u);
    if (remainingLitersMatch) return preserveWhitespace(text, `${remainingLitersMatch[1]} liters remaining`);

    const completedPercentMatch = trimmed.match(/^(.+?)\s+पूर्ण$/u);
    if (completedPercentMatch) return preserveWhitespace(text, `${completedPercentMatch[1]} complete`);

    const greetingMatch = trimmed.match(/^नमस्कार,\s*(.+)$/);
    if (greetingMatch) return preserveWhitespace(text, `Hello, ${greetingMatch[1]}`);

    const lastUpdateMatch = trimmed.match(/^शेवटचे अपडेट:\s*(.+)$/);
    if (lastUpdateMatch) return preserveWhitespace(text, `Last update: ${lastUpdateMatch[1]}`);
  } else {
    const trialOkMatch = trimmed.match(/^🎉 You have\s+(.+?)\s+days of trial remaining\.$/u);
    if (trialOkMatch) return preserveWhitespace(text, `🎉 आपल्याकडे ${trialOkMatch[1]} दिवसांचा चाचणी कालावधी आहे.`);

    const trialWarningMatch = trimmed.match(/^⚠️ Your trial will end in\s+(.+?)\s+days\.$/u);
    if (trialWarningMatch) return preserveWhitespace(text, `⚠️ आपला चाचणी कालावधी ${trialWarningMatch[1]} दिवसांत संपणार आहे.`);

    if (trimmed === "🔒 Your trial has expired.") {
      return preserveWhitespace(text, "🔒 आपला चाचणी कालावधी संपला आहे.");
    }

    const pendingSlipMatch = trimmed.match(/^(.+?)\s+payment slips pending$/u);
    if (pendingSlipMatch) return preserveWhitespace(text, `${pendingSlipMatch[1]} देयक स्लिप अपलोड बाकी`);

    const firstPendingMatch = trimmed.match(/^First pending:\s*(.+)$/u);
    if (firstPendingMatch) return preserveWhitespace(text, `पहिले बाकी: ${firstPendingMatch[1]}`);

    const goalTargetMatch = trimmed.match(/^Target:\s*(.+)$/u);
    if (goalTargetMatch) return preserveWhitespace(text, `लक्ष्य: ${goalTargetMatch[1]}`);

    const remainingLitersMatch = trimmed.match(/^(.+?)\s+liters remaining$/u);
    if (remainingLitersMatch) return preserveWhitespace(text, `${remainingLitersMatch[1]} लिटर बाकी`);

    const completedPercentMatch = trimmed.match(/^(.+?)\s+complete$/u);
    if (completedPercentMatch) return preserveWhitespace(text, `${completedPercentMatch[1]} पूर्ण`);

    const greetingMatch = trimmed.match(/^Hello,\s*(.+)$/);
    if (greetingMatch) return preserveWhitespace(text, `नमस्कार, ${greetingMatch[1]}`);

    const lastUpdateMatch = trimmed.match(/^Last update:\s*(.+)$/);
    if (lastUpdateMatch) return preserveWhitespace(text, `शेवटचे अपडेट: ${lastUpdateMatch[1]}`);
  }

  return text;
}

function shouldSkipElement(element) {
  if (!element) return false;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.closest?.("[data-i18n-skip]")) return true;
  if (element.isContentEditable) return true;
  return false;
}

function translateElementAttributes(element, language) {
  for (const attribute of ATTRIBUTE_NAMES) {
    const value = element.getAttribute?.(attribute);
    if (!value) continue;
    const translated = translateUiText(value, language);
    if (translated !== value) {
      element.setAttribute(attribute, translated);
    }
  }
}

function translateTextNode(node, language) {
  const parent = node.parentElement;
  if (!parent || shouldSkipElement(parent)) return;

  const translated = translateUiText(node.nodeValue || "", language);
  if (translated !== node.nodeValue) {
    node.nodeValue = translated;
  }
}

export function applyUiLanguage(language, root = null) {
  if (typeof document === "undefined") return;

  const targetLanguage = normalizeUiLanguage(language);
  const rootElement = root || document.body;
  const html = document.documentElement;
  html.lang = targetLanguage === "en" ? "en-IN" : "mr-IN";
  html.dataset.language = targetLanguage;
  document.body?.setAttribute("data-language", targetLanguage);

  if (!rootElement) return;

  if (rootElement.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(rootElement, targetLanguage);
  }

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }

        if (shouldSkipElement(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node, targetLanguage);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(node, targetLanguage);
    }
    node = walker.nextNode();
  }
}

export function createUiLanguageObserver(getLanguage) {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
    return { disconnect() {} };
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyUiLanguage(getLanguage());
    });
  };

  const observer = new MutationObserver(schedule);
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES
    });
  }

  return observer;
}
