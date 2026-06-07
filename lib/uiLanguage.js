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
  "सूचना सेटिंग्ज लोड होत आहेत...": "Loading notification settings...",
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
  "दूध स्लिप आणि १५ दिवसांची देयक स्लिप फोटोवरून वाचा, तपासा आणि मगच जतन करा.": "Read daily milk slips and 15-day payment slips from photos, verify them, and only then save.",
  "लिटर, दर, कपात आणि रक्कम वेगळी केली जाते.": "Liters, rate, deductions and amount are separated.",
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
  "लॉगिन आवश्यक आहे.": "Login required.",
  "कारण:": "Reason:",
  "कारण": "Reason"
};

Object.assign(MR_TO_EN, {
  "कुठल्या सूचना कशा मिळाव्यात ते ठरवा.": "Choose how you want to receive notifications.",
  "सूचना प्रकार": "Notification Types",
  "दैनंदिन आठवण": "Daily Reminder",
  "रोजच्या कामांसाठी सूचना": "Notifications for daily work",
  "दूध नोंद आठवण": "Milk Entry Reminder",
  "सकाळ/संध्याकाळ दूध नोंद": "Morning/evening milk entry",
  "स्लिप अपलोड आठवण": "Slip Upload Reminder",
  "15 दिवसांची देयक स्लिप बाकी": "15-day payment slip pending",
  "Subscription आठवण": "Subscription Reminder",
  "Plan expiry आणि payment सूचना": "Plan expiry and payment notifications",
  "App update, maintenance आणि महत्वाच्या सूचना": "App updates, maintenance and important notifications",
  "AI सहाय्यक Updates": "AI Assistant Updates",
  "AI सुविधा आणि सुधारणा": "AI features and improvements",
  "ऑफर्स": "Offers",
  "Marketing आणि promotional messages": "Marketing and promotional messages",
  "मदत, मार्गदर्शन आणि support": "Help, guidance and support",
  "सूचना कुठे याव्यात": "Where notifications should arrive",
  "Permission blocked आहे. Browser settings मधून allow करा.": "Permission is blocked. Allow it from browser settings.",
  "App मध्ये सूचना": "In-App Notifications",
  "Inbox आणि bell मध्ये दिसेल": "Visible in inbox and bell",
  "Push Notifications": "Push Notifications",
  "Phone notification panel मध्ये येतील": "Shown in the phone notification panel",
  "Email Notifications": "Email Notifications",
  "Email वर summary मिळेल": "Receive summary by email",
  "WhatsApp": "WhatsApp",
  "लवकरच उपलब्ध": "Coming soon",
  "SMS": "SMS",
  "शांत वेळ": "Quiet Hours",
  "या वेळेत notification येणार नाहीत.": "Notifications will not arrive during this time.",
  "सुरू वेळ": "Start Time",
  "शेवट वेळ": "End Time",
  "Notification Frequency": "Notification Frequency",
  "Instant": "Instant",
  "Daily Summary": "Daily Summary",
  "Weekly Summary": "Weekly Summary",
  "चाचणी सूचना पाठवा": "Send Test Notification",
  "सूचना इतिहास": "Notification History",

  "दुग्धमित्र AI सेटिंग्ज": "Dugdhamitra AI Settings",
  "AI सेटिंग्ज लोड होत आहेत...": "Loading AI settings...",
  "AI सहाय्यक कसा वागेल आणि कोणता data वापरेल ते ठरवा.": "Control how the AI assistant behaves and which data it can use.",
  "दुग्धमित्र AI सुरू ठेवा": "Keep Dugdhamitra AI Enabled",
  "बंद केल्यास app मध्ये AI bot दिसणार नाही आणि प्रश्न विचारता येणार नाहीत.": "If disabled, the AI bot will not appear and questions cannot be asked.",
  "उत्तर शैली": "Response Style",
  "थेट, एका वाक्यात उत्तर": "Direct, one-sentence answer",
  "निवडले": "Selected",
  "उदा. आज २८५ लिटर दूध जमा झाले.": "Example: Today 285 liters of milk was collected.",
  "सविस्तर": "Detailed",
  "सकाळ/संध्याकाळ split आणि संदर्भासह": "With morning/evening split and context",
  "उदा. सकाळी १४५ आणि संध्याकाळी १४० लिटर.": "Example: 145 liters in the morning and 140 liters in the evening.",
  "तज्ञ": "Expert",
  "आकडे, अर्थ आणि उपयोगी निरीक्षण": "Numbers, meaning and useful insight",
  "उदा. उत्पादन वाढले आहे; फॅट स्थिर ठेवण्यासाठी नोंदी तपासा.": "Example: Production has increased; check records to keep fat stable.",
  "झटपट प्रश्न": "Suggested Questions",
  "झटपट प्रश्न दाखवा": "Show suggested questions",
  "AI box मध्ये वापरायला सोपे प्रश्न chips म्हणून दिसतील.": "Easy-to-use question chips will appear in the AI box.",
  "सरासरी फॅट": "Average Fat",
  "सर्वाधिक दूध": "Highest Milk",
  "डेटा परवानग्या": "Data Permissions",
  "AI फक्त तुम्ही परवानगी दिलेला data वापरेल.": "AI will only use data you allow.",
  "दूध नोंदी वापरू द्या": "Allow milk records",
  "दूध, फॅट, SNF आणि सकाळ/संध्याकाळचे आकडे": "Milk, fat, SNF and morning/evening figures",
  "स्लिप इतिहास वापरू द्या": "Allow slip history",
  "दूध स्लिप, 15 दिवसांचे payment आणि उत्पन्न": "Milk slips, 15-day payments and income",
  "Analytics वापरू द्या": "Allow analytics",
  "नफा, खर्च, trend आणि मासिक सारांश": "Profit, expenses, trends and monthly summaries",
  "जनावरांची माहिती वापरू द्या": "Allow animal data",
  "गायी/वासरे माहितीवर future AI उत्तरांसाठी": "For future AI answers using cow/calf information",
  "AI सेटिंग्ज जतन करा": "Save AI Settings",
  "AI वापर आकडे": "AI Usage Statistics",
  "एकूण प्रश्न": "Total Questions",
  "या महिन्यात": "This Month",
  "सर्वाधिक विषय": "Most Asked Topic",
  "सरासरी वेळ": "Average Time",
  "AI Chat History": "AI Chat History",
  "शोधा": "Search",
  "सर्व काढा": "Delete All",

  "ट्रॅकिंग सुरू": "Tracking On",
  "दूध उत्पादनाचे लक्ष्य ठरवा": "Set milk production goals",
  "दैनिक, साप्ताहिक, मासिक आणि गुणवत्ता लक्ष्य ठेवून farm performance नियमित तपासा.": "Set daily, weekly, monthly and quality goals to track farm performance.",
  "सक्रिय लक्ष्य": "Active Goals",
  "सरासरी प्रगती": "Average Progress",
  "दैनिक दूध": "Daily Milk",
  "लक्ष्य सेट करा": "Set Goals",
  "दूध आणि गुणवत्ता लक्ष्य मोठ्या आकड्यांत भरा. नंतर progress automatic update होईल.": "Enter milk and quality goals. Progress will update automatically.",
  "लक्ष्य ट्रॅकिंग सुरू ठेवा": "Keep Goal Tracking On",
  "बंद केल्यास progress दिसेल, पण लक्ष्य पूर्ण झाल्याची सूचना पाठवणार नाही.": "If disabled, progress will show but achievement notifications will not be sent.",
  "दैनिक दूध लक्ष्य": "Daily Milk Goal",
  "आजचे उत्पादन": "Today's Production",
  "लिटर": "Liters",
  "साप्ताहिक दूध लक्ष्य": "Weekly Milk Goal",
  "७ दिवसांचे लक्ष्य": "7-day target",
  "मासिक दूध लक्ष्य": "Monthly Milk Goal",
  "फॅट लक्ष्य": "Fat Goal",
  "SNF लक्ष्य": "SNF Goal",
  "लक्ष्य जतन करा": "Save Goals",
  "ऐतिहासिक लक्ष्य": "Historical Goals",
  "AI सूचना": "AI Recommendation",

  "तुमच्या डेअरीचा data download आणि सुरक्षित backup करा.": "Download and safely back up your dairy data.",
  "निवडलेले विभाग": "Selected Sections",
  "काय download करायचे?": "What do you want to download?",
  "विभाग निवडले आहेत.": "sections selected.",
  "सगळे काढा": "Clear All",
  "दूध नोंदी": "Milk Records",
  "स्लिप इतिहास": "Slip History",
  "AI इतिहास": "AI History",
  "जनावरांची माहिती": "Animal Records",
  "Format आणि कालावधी": "Format and Date Range",
  "कालावधी": "Date Range",
  "आज": "Today",
  "हा आठवडा": "This Week",
  "हा महिना": "This Month",
  "स्वतःचा कालावधी": "Custom Range",
  "Export download करा": "Download Export",
  "Backup तयार करा": "Create Backup",
  "निवडलेल्या वेळापत्रकानुसार backup तयार करण्याची व्यवस्था.": "Create backups based on the selected schedule.",
  "दररोज": "Daily",
  "दर आठवड्याला": "Weekly",
  "दर महिन्याला": "Monthly",
  "Auto Backup": "Auto Backup",
  "Backup History": "Backup History",
  "Restore Backup": "Restore Backup",

  "PIN, password, sessions आणि login history तपासा.": "Check PIN, password, sessions and login history.",
  "तुमची सुरक्षा चांगली आहे.": "Your security is good.",
  "सध्याचा PIN": "Current PIN",
  "नवीन PIN": "New PIN",
  "नवीन PIN पुन्हा": "Confirm New PIN",
  "PIN जतन करा": "Save PIN",
  "Password बदला": "Change Password",
  "सध्याचा Password": "Current Password",
  "नवीन Password": "New Password",
  "Password strength: कमकुवत": "Password strength: Weak",
  "नवीन Password पुन्हा": "Confirm New Password",
  "Password जतन करा": "Save Password",
  "डिव्हाइस Sessions": "Device Sessions",
  "तुमचे खाते कोणत्या phone/browser मध्ये active आहे ते इथे दिसते.": "See which phones/browsers your account is active on.",
  "सर्व Logout": "Logout All",
  "Session माहिती उपलब्ध नाही.": "Session information is not available.",

  "पशुवैद्यक सेटिंग्ज": "Veterinarian Settings",
  "तुमच्या डेअरीसाठी पशुवैद्यकांची नावे जोडा. नोंदी करताना dropdown मधून निवडता येईल.": "Add veterinarians for your dairy. You can select them from dropdowns while making records.",
  "नवीन पशुवैद्यक जोडा": "Add New Veterinarian",
  "नाव आवश्यक आहे. मोबाईल, गाव आणि नोंद optional आहेत.": "Name is required. Mobile, village and note are optional.",
  "पशुवैद्यकाचे नाव": "Veterinarian Name",
  "मोबाईल नंबर": "Mobile Number",
  "गाव / ठिकाण": "Village / Location",
  "नोंद": "Note",
  "Dropdown मध्ये दाखवा": "Show in Dropdown",
  "पशुवैद्यक जोडा": "Add Veterinarian",
  "जोडलेले पशुवैद्यक": "Saved Veterinarians",
  "Active नावे लसीकरण, आरोग्य आणि रेतन forms मध्ये दिसतील.": "Active names appear in vaccination, health and breeding forms.",
  "अजून कोणतेही पशुवैद्यक जोडलेले नाहीत.": "No veterinarians added yet.",

  "वैयक्तिक माहिती, फोटो आणि खाते सेटिंग्ज": "Personal information, photo and account settings",
  "सदस्य": "Member",
  "Profile फोटो": "Profile Photo",
  "Camera किंवा gallery मधून फोटो निवडा. फोटो compress होऊन सुरक्षित जतन होईल.": "Choose a photo from camera or gallery. It will be compressed and saved securely.",
  "गॅलरी": "Gallery",
  "काढा": "Remove",
  "वैयक्तिक माहिती": "Personal Information",
  "नाव आणि गावाची माहिती इथे अपडेट करा.": "Update name and village information here.",
  "डेअरी / फार्मचे नाव": "Dairy / Farm Name",
  "फर्म": "Farm",
  "पूर्ण नाव": "Full Name",
  "मोबाइल नंबर": "Mobile Number",
  "ही माहिती बदलता येत नाही.": "This information cannot be changed.",
  "जिल्हा": "District",
  "गाव": "Village",
  "तालुका": "Taluka",
  "राज्य": "State",
  "माहिती जतन करा": "Save Information",
  "फार्म माहिती": "Farm Information",
  "आकडेवारी": "Statistics",

  "वैयक्तिक आकडेवारी": "Personal Statistics",
  "जनावरे": "Animals",
  "डेटा अपूर्ण": "Data Incomplete",
  "एकूण दूध": "Total Milk",
  "एकूण उत्पन्न": "Total Income",
  "सरासरी SNF": "Average SNF",
  "एकूण स्लिप": "Total Slips",
  "AI प्रश्न": "AI Questions",
  "या महिन्याची वाढ/घट तुलना": "This Month Growth Comparison",
  "घट": "decrease",
  "वाढ": "increase",
  "माझे Achievements": "My Achievements",
  "दूध, OCR, AI, सातत्य आणि farm growth साठी मिळालेले badges इथे बघा.": "View badges earned for milk, OCR, AI, consistency and farm growth.",
  "नवीन दूध उत्पादक शेतकरी": "New Milk Producer Farmer",
  "unlock": "unlocked",
  "एकूण BADGES": "Total Badges",
  "UNLOCK झाले": "Unlocked",
  "बाकी BADGES": "Locked Badges",
  "Score आणि rank details": "Score and rank details",
  "Farm ranking बघा": "View Farm Ranking",
  "पुढचे Reward": "Next Reward",
  "Slip/OCR वापर": "Slip/OCR Usage",
  "दूध उत्पादक स्कोअर": "Milk Producer Score",
  "तुमची दूध उत्पादक कामगिरी": "Your milk producer performance",
  "दूध नोंदी, सातत्य, स्लिप स्कॅन, AI वापर आणि data quality यावरून हा स्कोअर तयार होतो.": "This score is based on milk records, consistency, slip scans, AI usage and data quality.",
  "नोंद दिवस": "Record Days",
  "स्ट्रीक": "Streak",
  "दिवस": "days",
  "एकूण स्कोअर": "Total Score",
  "स्कोअर अपडेट करा": "Update Score",
  "पुढचा रँक": "Next Rank",
  "सक्रिय दूध उत्पादक शेतकरी": "Active Milk Producer Farmer",
  "बाकी": "remaining",
  "पुढच्या rank साठी सातत्याने दूध नोंद, स्लिप स्कॅन आणि data quality वाढवा.": "For the next rank, keep recording milk, scanning slips and improving data quality.",
  "सुरुवात चांगली करा: रोजची दूध नोंद आणि प्रोफाइल पूर्ण करा.": "Start well: record milk daily and complete your profile.",
  "हा score तुमच्या farm activity वरून automatic update होतो. कमी असलेला component सुधारला की rank वेगाने वाढेल.": "This score updates automatically from farm activity. Improve weak components to increase rank faster.",
  "Badges बघा": "View Badges",
  "दूध उत्पादन": "Milk Production",
  "एकूण दूध नोंदीवर आधारित": "Based on total milk records",

  "माझ्या गायी": "My Cows",
  "दाखवत आहे / एकूण": "showing / total",
  "जोडा": "Add",
  "गाभण": "Pregnant",
  "रिकामी": "Open",
  "व्याललेली": "Calved",
  "उपचार": "Treatment",
  "वाळलेली": "Dry",
  "गायीचे नाव शोधा": "Search cow name",
  "सर्व:": "All:",
  "माहिती नाही": "No information",
  "नवीन गाय जोडा": "Add New Cow",
  "गायीची माहिती भरा": "Fill cow information",
  "आवश्यक माहिती": "Required information",
  "गायीचे नाव": "Cow Name",
  "गायीचा फोटो": "Cow Photo",
  "स्पष्ट फोटो घेतला तर गायी/वासरू पटकन ओळखता येते.": "A clear photo helps identify the cow/calf quickly.",
  "फोटो जोडा": "Add Photo",
  "फोटो काढा": "Take Photo",
  "जात": "Breed",
  "जात निवडा": "Select Breed",
  "रंग": "Color",
  "जन्म तारीख": "Birth Date",
  "कान टॅग नंबर": "Ear Tag Number",
  "खरेदी तारीख": "Purchase Date",
  "वय": "Age",
  "सक्रिय": "Active",
  "दूध सुरू": "Milk On",
  "जन्म नोंदी": "Birth Records",
  "विकली": "Sold",
  "जुने / नवीन वासरू जोडा": "Add Old / New Calf",
  "फिल्टर": "Filter",
  "स्थिती आणि वयानुसार वासरे पटकन शोधा": "Find calves quickly by status and age",
  "जन्म नोंद": "Birth Record",
  "मृत": "Dead",
  "गाय झाली": "Became Cow",
  "सर्व वय": "All Ages",
  "महिने": "months",
  "या फिल्टरमध्ये वासरे नाहीत.": "No calves in this filter.",
  "आज नोंदी": "Today's Records",
  "दूध रेकॉर्ड": "Milk Record"
});

Object.assign(MR_TO_EN, {
  "Phone notification panel मध्ये येईल": "Shown in the phone notification panel",
  "लवकरच उपलब्ध होईल": "Coming soon",
  "Voice वाचून दाखवण्याऐवजी app मध्ये छोटा खास tone वाजेल.": "A short custom tone will play instead of reading notifications aloud.",
  "Notification tone चालू ठेवा": "Keep notification tone enabled",
  "नवीन सूचना आली की माझी डेअरीचा छोटा tone वाजेल": "When a new notification arrives, Majhi Dairy will play a short tone",
  "Tone आवाज": "Tone Volume",
  "Tone तपासा": "Test Tone",
  "या वेळेत साध्या सूचना थांबतील. खूप महत्वाच्या सूचना थांबणार नाहीत.": "Normal notifications pause during this time. Critical notifications will not be paused.",
  "शांत वेळ सुरू करा": "Enable Quiet Hours",
  "रात्री notification आवाज/alert कमी करण्यासाठी": "Reduce notification sound/alerts at night",
  "शेवट": "End",
  "वारंवारता": "Frequency",
  "हिशोब विश्लेषण वापरू द्या": "Allow accounting analytics",
  "गायी, गाभण स्थिती आणि वासरांची संख्या": "Cows, pregnancy status and calf count",
  "AI प्रश्न इतिहास": "AI Question History",
  "प्रश्न, उत्तर, feedback आणि delete control.": "Questions, answers, feedback and delete controls.",
  "सर्व delete": "Delete All",
  "AI history उपलब्ध नाही.": "AI history is not available.",
  "महिन्याचे उत्पादन": "Monthly Production",
  "दुधाची गुणवत्ता": "Milk Quality",
  "SNF गुणवत्ता": "SNF Quality",
  "AI शिफारस": "AI Recommendation",
  "प्रगती तपशील": "Progress Details",
  "चालू": "Active",
  "सध्या": "Current",
  "लक्ष्य": "Target",
  "टक्केवारी": "Percentage",
  "साप्ताहिक दूध": "Weekly Milk",
  "पुढील backup": "Next Backup",
  "Cloud backup: नंतर जोडण्यासाठी तयार": "Cloud backup: ready for future integration",
  "Backup इतिहास": "Backup History",
  "अजून backup तयार केलेला नाही.": "No backup has been created yet.",
  "कमकुवत": "Weak",
  "wrong_pin": "wrong PIN",

  "पुणे": "Pune",
  "मुंबई": "Mumbai",
  "नाशिक": "Nashik",
  "छत्रपती संभाजीनगर": "Chhatrapati Sambhajinagar",
  "नागपूर": "Nagpur",
  "अहिल्यानगर (नवीन नाव)": "Ahilyanagar (new name)",
  "अहमदनगर (जुने नाव)": "Ahmednagar (old name)",
  "सोलापूर": "Solapur",
  "सातारा": "Satara",
  "सांगली": "Sangli",
  "कोल्हापूर": "Kolhapur",
  "जळगाव": "Jalgaon",
  "धुळे": "Dhule",
  "नंदुरबार": "Nandurbar",

  "दूध, उत्पन्न आणि गुणवत्ता trend": "Milk, income and quality trend",
  "रोजचे दूध ट्रेंड": "Daily Milk Trend",
  "या महिन्यातील रोजचे दूध": "Daily milk for this month",
  "या कालावधीसाठी chart data उपलब्ध नाही.": "Chart data is not available for this period.",
  "बदल नाही": "No change",
  "फॅट": "Fat",
  "Achievements अपडेट करा": "Update Achievements",
  "एकूण BADGES": "Total Badges",
  "UNLOCK झाले": "Unlocked",
  "बाकी BADGES": "Locked Badges",
  "AI वापर": "AI Usage",
  "सातत्य": "Consistency",
  "सर्व Badges": "All Badges",
  "पहिली गाय app मध्ये जोडा.": "Add the first cow in the app.",
  "सामान्य": "Common",
  "सध्याचे": "Current",
  "एकूण 100 लिटर दूध नोंद पूर्ण करा.": "Complete 100 liters of milk records.",
  "App 30 दिवस active वापरा.": "Use the app actively for 30 days.",
  "सलग नोंदी आणि record discipline": "Consecutive records and record discipline",
  "OCR/AI स्लिप वापर": "OCR/AI slip usage",
  "दुग्धमित्र AI प्रश्न": "Dugdhamitra AI questions",
  "सक्रियता": "Activity",
  "मागील 30 दिवसांचा वापर": "Usage in the last 30 days",
  "प्रोफाइल पूर्णता": "Profile Completion",
  "डेटा गुणवत्ता": "Data Quality",
  "दूध data ची पूर्णता आणि quality": "Milk data completeness and quality",
  "स्कोअरला आधार देणारी माहिती": "Information supporting the score",
  "माहिती": "Information",
  "सध्याचा स्ट्रीक": "Current Streak",

  "महत्त्वाच्या तारखा": "Important Dates",
  "जन्म": "Birth",
  "नोंद नाही": "No record",
  "शेवटचे रेतन": "Last Breeding",
  "शेवटचे व्यायण": "Last Calving",
  "पुढील": "Next",
  "नाही": "None",
  "गर्भधारणा तपासणी": "Pregnancy Check",
  "एच एफ": "HF",
  "गीर": "Gir",
  "साहिवाल": "Sahiwal",
  "देशी": "Desi",
  "जर्सी": "Jersey",
  "इतर": "Other",
  "सद्यस्थिती": "Current Status",
  "उपचार सुरू": "Under Treatment",
  "इतर नोंद": "Other Note",
  "गाय जोडा": "Add Cow",
  "मागे जा": "Go Back",

  "प्रकार": "Type",
  "आजची दूध नोंद": "Today's Milk Entry",
  "आजचे दूध नोंदवा": "Record Today's Milk",
  "रोजचे दूध नोंदवा": "Record daily milk",
  "चारा खर्च": "Feed Expense",
  "खाद्य माहिती, मुरघास/भुसा वार्षिक": "Feed details, silage/hay yearly",
  "कृत्रिम रेतन": "Artificial Insemination",
  "रेतन तारीख आणि माहिती": "Breeding date and details",
  "आरोग्य नोंद": "Health Record",
  "आजारपण / उपचार नोंद": "Illness / treatment record",
  "लसीकरण": "Vaccination",
  "लस आणि जंतनाशक": "Vaccine and deworming",
  "जन्म, दूध आणि वाढ": "Birth, milk and growth",
  "अलीकडील नोंदी": "Recent Records",
  "अपडेट": "Update",
  "आठवडा": "Week",
  "मागील": "Previous",
  "आठवणी सारांश": "Reminder Summary",
  "काय बघायचे ते निवडा": "Choose what to view",
  "या आठवड्यात": "This Week",
  "मागील राहिलेल्या": "Past Pending",
  "या महिन्यात झालेल्या": "Done This Month",
  "आठवड्याचे दिवस": "Week Days",
  "दिवस निवडा आणि आठवणी बघा": "Select a day and view reminders",
  "सोम": "Mon",
  "मंगळ": "Tue",
  "बुध": "Wed",
  "गुरु": "Thu",
  "शुक्र": "Fri",
  "शनि": "Sat",
  "रवि": "Sun",

  "महिन्याची स्पष्ट माहिती": "clear monthly information",
  "छापा": "Print",
  "नफा": "Profit",
  "मागील": "Previous",
  "पुढील": "Next",
  "बघा": "View",
  "एकूण दूध उत्पादन": "Total Milk Production",
  "दररोज सरासरी": "Daily average",
  "दूध विक्री + इतर उत्पन्न": "Milk sales + other income",
  "खाद्य कपात + इतर खर्च": "Feed deduction + other expenses",
  "महिन्याचा अंतिम हिशोब": "Final monthly accounting",
  "सविस्तर अहवाल": "Detailed Reports",
  "शेतकऱ्याला पटकन समजेल अशा प्रकारे विभागलेले अहवाल": "Reports grouped so farmers can understand quickly",
  "Payment Slip स्थिती": "Payment Slip Status",
  "वर्षानुसार 15 दिवसांच्या slips upload झाल्या का": "Check whether 15-day slips were uploaded year-wise",
  "नफा/तोटा": "Profit/Loss",
  "महिन्याचा हिशोब आणि analysis": "Monthly accounting and analysis",
  "दैनिक दूध, सकाळ-संध्याकाळ आणि दर": "Daily milk, morning-evening and rates",
  "डेअरी स्लिपप्रमाणे सकाळ-संध्याकाळ नोंद": "Morning/evening records as per dairy slip",
  "नवीन": "New",
  "तारीख फिल्टर": "Date Filter",
  "सर्व दाखवा": "Show All",
  "सेटलमेंट स्लिपवरील final total": "Final total from settlement slip",
  "या महिन्याचे एकूण दूध": "This month's total milk",
  "दिवसांचा डेटा": "days of data",
  "या महिन्याचा उत्पन्न": "This month's income",
  "दूध विक्रीतून": "From milk sales",
  "सरासरी दर": "Average Rate",
  "या महिन्याचा": "This Month",

  "AI स्लिप वाचन": "AI Slip Reading",
  "दूध स्लिप आणि 15 दिवसांची देयक स्लिप फोटोवरून वाचा, तपासा आणि मगच जतन करा.": "Read milk slips and 15-day payment slips from photos, verify, then save.",
  "एकूण": "Total",
  "जतन": "Saved",
  "सर्वात जलद": "Fastest",
  "कॅमेरा वापरा": "Use Camera",
  "आता फोटो घ्या आणि AI ला वाचायला द्या": "Take a photo now and let AI read it",
  "फोटो तयार असेल तर": "If the photo is ready",
  "गॅलरी मधून निवडा": "Choose from Gallery",
  "फोनमध्ये असलेला स्पष्ट स्लिप फोटो निवडा": "Choose a clear slip photo from your phone",
  "हे कसे काम करते?": "How does it work?",
  "आर्थिक नोंद जतन करण्याआधी तुमची खात्री आवश्यक आहे.": "Your confirmation is required before saving financial records.",
  "सुरक्षित": "Safe",
  "फोटो निवडा": "Choose Photo",
  "कॅमेरा किंवा गॅलरी मधून स्लिप फोटो घ्या.": "Take a slip photo from camera or gallery.",

  "FAQ, ticket, tutorials, bug report आणि platform status एका ठिकाणी.": "FAQ, tickets, tutorials, bug reports and platform status in one place.",
  "Ticket तयार करा": "Create Ticket",
  "मदत शोधा": "Search Help",
  "किमान 2 अक्षरे टाका.": "Enter at least 2 characters.",
  "सामान्य प्रश्न": "FAQ",
  "समस्या नोंदवा": "Report Issue",
  "संपर्क": "Contact",
  "थेट मदत": "Direct Help",
  "मार्गदर्शक": "Tutorials",
  "Step-by-step मदत": "Step-by-step help",
  "स्थिती": "Status",
  "सेवा स्थिती": "Service Status",
  "माझी डेअरी पहिल्यांदा वापरणे": "Using Majhi Dairy for the first time",
  "Dashboard, गायी आणि नोंदी समजून घ्या.": "Understand Dashboard, Cows and Records.",
  "दूध नोंद योग्य पद्धत": "Correct Milk Entry Method",
  "सकाळ/संध्याकाळ दूध आणि दर भरा.": "Enter morning/evening milk and rate.",
  "एकूण tickets": "Total Tickets",
  "सोडवले": "Resolved",
  "सामान्य प्रश्नांची जलद उत्तरे.": "Quick answers to common questions.",
  "सुरुवात": "Getting Started",
  "सुरक्षा": "Security",
  "App सुरू कसे करायचे?": "How to start using the app?",
  "दूध नोंद कुठे करायची?": "Where to record milk?",
  "15 दिवसांची slip कशी upload करायची?": "How to upload a 15-day slip?",
  "दुग्धमित्र AI काय करतो?": "What does Dugdhamitra AI do?",
  "अहवालात आकडे कुठून येतात?": "Where do report figures come from?",
  "Mobile notification येत नसेल तर?": "What if mobile notifications do not arrive?",
  "PIN बदलायचा असेल तर?": "How to change PIN?",
  "समस्या नोंदवा, reply द्या आणि ticket status बघा.": "Report issues, reply and view ticket status.",
  "नवीन ticket तयार करा": "Create New Ticket",
  "तांत्रिक मदत": "Technical Support",
  "त्रुटी नोंदवा": "Report Bug",
  "Slip/OCR समस्या": "Slip/OCR Issue",
  "डेटा समस्या": "Data Issue",
  "Subscription समस्या": "Subscription Issue",
  "Payment समस्या": "Payment Issue",
  "खाते समस्या": "Account Issue",
  "नवीन सुविधा": "Feature Request",
  "कमी": "Low",
  "जास्त": "High",
  "तातडीचे": "Critical"
});

Object.assign(MR_TO_EN, {
  "लवकरच": "Soon",
  "Email · लवकरच": "Email · Soon",
  "WhatsApp · लवकरच": "WhatsApp · Soon",
  "SMS · लवकरच": "SMS · Soon",
  "सध्या App आणि Mobile notification सुरक्षितपणे ताबडतोब पाठवले जातात. Daily/Weekly निवड भविष्यातील सारांशासाठी जतन केली जाते.": "Currently, app and mobile notifications are sent instantly. Daily/weekly choices are saved for future summaries.",
  "ताबडतोब": "Instant",
  "दैनिक सारांश": "Daily Summary",
  "साप्ताहिक सारांश": "Weekly Summary",
  "माझी डेअरी सूचना": "Majhi Dairy Notification",
  "ही चाचणी सूचना आहे. तुमच्या सूचना व्यवस्थित चालू आहेत.": "This is a test notification. Your notifications are working properly.",
  "नवीन AI सहाय्यक उपलब्ध": "New AI Assistant Available",
  "आता AI सहाय्यक वापरून तुमच्या डेअरीची माहिती सहज मिळवा.": "Now use the AI assistant to easily get your dairy information.",
  "Subscription नूतनीकरण": "Subscription Renewal",
  "तुमचे subscription renew करण्याची वेळ आली आहे.": "It is time to renew your subscription.",
  "सिस्टम देखभाल सूचना": "System Maintenance Notice",
  "निर्धारित वेळेत app मध्ये थोडा व्यत्यय येऊ शकतो.": "The app may be briefly interrupted during the scheduled time.",
  "मासिक दूध": "Monthly Milk",
  "Previous लक्ष्य": "Previous Target",
  "चुकले": "Missed",
  "साध्य": "Achieved",
  "Cloud backup: नंतर जोडण्यासाठी तयार": "Cloud backup: ready for future integration",
  "नंतर जोडण्यासाठी तयार": "ready for future integration",
  "तुम्ही मासिक लक्ष्याच्या 0% पूर्ण केले आहे. अजून 9000 liters बाकी आहे.": "You have completed 0% of the monthly goal. 9000 liters remaining.",
  "वैयक्तिक आकडेवारी लोड होत आहे...": "Loading personal statistics...",
  "दूध उत्पन्न ₹10,000 पूर्ण करा.": "Complete milk income of ₹10,000.",
  "दूध उत्पन्न ₹50,000 पूर्ण करा.": "Complete milk income of ₹50,000.",
  "दूध उत्पन्न ₹1 लाख पूर्ण करा.": "Complete milk income of ₹1 lakh.",
  "10 active गायींची नोंद ठेवा.": "Maintain records of 10 active cows.",
  "25 active गायींची नोंद ठेवा.": "Maintain records of 25 active cows.",
  "50 active गायींची नोंद ठेवा.": "Maintain records of 50 active cows.",
  "100 active गायींची नोंद ठेवा.": "Maintain records of 100 active cows.",
  "30 दूध नोंदी पूर्ण करा.": "Complete 30 milk records.",
  "100 दूध नोंदी पूर्ण करा.": "Complete 100 milk records.",
  "एकूण 1000 liters दूध नोंद पूर्ण करा.": "Complete 1000 liters of milk records.",
  "एकूण 5000 liters दूध नोंद पूर्ण करा.": "Complete 5000 liters of milk records.",
  "दुर्मिळ": "Rare",
  "विशेष": "Special",
  "नवीन नोंदी पटकन तपासा": "Quickly review new records",
  "रेतन": "Breeding",
  "आरोग्य": "Health",
  "दूध विक्री, पेमेंट आणि बाकी": "Milk sales, payments and pending amounts",
  "खाद्य, औषध, मजुरी आणि इतर": "Feed, medicine, labor and other expenses",
  "महिन्याचा नफा, खर्च आणि ट्रेंड": "Monthly profit, expenses and trends",
  "सर्व आर्थिक नोंदी एकत्र": "All financial records together",
  "वर्षभराचा दूध, खर्च आणि नफा": "Yearly milk, expenses and profit",
  "गायींची स्थिती आणि कामगिरी": "Cow status and performance",
  "लस, जंतनाशक आणि due dates": "Vaccines, deworming and due dates",
  "प्रिंटसाठी तयार अहवाल": "Print-ready report",
  "हिशोब कामे": "Accounting Tasks",
  "स्कॅन, हाताने नोंद आणि पेमेंट रेकॉर्ड्स इथून उघडा": "Open scans, manual entries and payment records from here",
  "AI स्कॅन": "AI Scan",
  "फोटोवरून दूध किंवा सेटलमेंट नोंद": "Milk or settlement entry from photo",
  "हाताने नोंद": "Manual Entry",
  "स्कॅन न करता स्वतः दूध भरा": "Enter milk manually without scanning",
  "15 दिवसांचे पेमेंट": "15-Day Payment",
  "स्कॅन न करता सेटलमेंट भरा": "Enter settlement manually without scanning",
  "दूध रेकॉर्ड्स": "Milk Records",
  "या महिन्याच्या सर्व दूध नोंदी": "All milk records for this month",
  "सेटलमेंट्स": "Settlements",
  "15 दिवसांचे पेमेंट रेकॉर्ड्स": "15-day payment records",
  "नोंदवलेले days": "Recorded days",
  "सकाळ + संध्याकाळ": "Morning + Evening",
  "या महिन्यात दूध नोंद नाही": "No milk record this month",
  "दूध नोंद जोडा": "Add Milk Entry",
  "AI वाचते": "AI Reads",
  "liters, दर, कपात आणि रक्कम वेगळी केली जाते.": "Liters, rate, deductions and amount are separated.",
  "सर्व आकडे editable असतात. चुकीचे दिसल्यास बदला.": "All figures are editable. Change anything that looks wrong.",
  "मग जतन": "Then Save",
  "तुम्ही मान्य केल्याशिवाय database मध्ये entry होत नाही.": "No database entry is created until you approve it.",
  "फोनवर साठवलेले फोटो": "Photos Saved on Phone",
  "Internet नसताना घेतलेले फोटो online झाल्यावर process करा.": "Process photos taken offline when internet returns.",
  "Process करा": "Process",
  "अलीकडील स्कॅन": "Recent Scans",
  "शेवटच्या 10 स्लिप्स आणि त्यांची स्थिती.": "Last 10 slips and their status.",
  "अजून स्लिप स्कॅन केलेली नाही": "No slip scanned yet",
  "पहिली दूध किंवा देयक स्लिप स्कॅन करा. जतन करण्याआधी सर्व आकडे तपासता येतील.": "Scan the first milk or payment slip. You can verify all figures before saving.",
  "कॅमेरा उघडा": "Open Camera",
  "गॅलरी निवडा": "Choose Gallery",
  "माझे अलीकडील tickets": "My Recent Tickets",
  "सर्व बघा": "View All",
  "अजून ticket नाही. काही अडचण असल्यास ticket तयार करा.": "No ticket yet. Create a ticket if you need help.",
  "System स्थिती": "System Status",
  "सुरळीत": "Operational",
  "API सेवा सुरळीत आहे.": "API service is operational.",
  "Database सेवा सुरळीत आहे.": "Database service is operational.",
  "OCR सेवा उपलब्ध आहे.": "OCR service is available.",
  "AI सहाय्यक उपलब्ध आहे.": "AI assistant is available.",
  "Notification सेवा सुरळीत आहे.": "Notification service is operational.",
  "लोकप्रिय FAQ": "Popular FAQ",
  "मुख्यपृष्ठावरून गायी, नोंदी, आठवणी, अहवाल आणि हिशोब वापरता येतात. रोज दूध नोंद किंवा स्लिप स्कॅन केल्यास अहवाल आपोआप तयार होतात.": "From the home page you can use cows, records, reminders, reports and accounting. Reports are created automatically when you record milk or scan slips.",
  "नोंदी > दूध नोंद किंवा हिशोबातील manually दूध नोंद वापरा. जर डेअरी slip असेल तर स्लिप स्कॅन वापरणे अधिक अचूक आहे.": "Use Records > Milk Entry or manual milk entry in Accounting. If you have a dairy slip, slip scan is more accurate.",
  "हिशोब > स्लिप स्कॅन मध्ये gallery किंवा camera मधून slip निवडा. AI ने वाचलेली माहिती तपासा आणि नंतरच जतन करा.": "In Accounting > Slip Scan, choose a slip from gallery or camera. Verify AI-read information before saving.",
  "दुग्धमित्र AI तुमच्या database मधील दूध, उत्पन्न, खर्च आणि अहवालांची माहिती मराठीत समजावतो.": "Dugdhamitra AI explains milk, income, expense and report information from your database.",
  "अहवाल दूध नोंदी, settlement slip, खर्च आणि उत्पन्न database मधून तयार होतात. 15 दिवसांच्या slip मधील final total ला priority दिली जाते.": "Reports are created from milk records, settlement slips, expenses and income in the database. Final totals from 15-day slips get priority.",
  "उपयुक्त Tutorials": "Useful Tutorials",
  "AI ला सोपे प्रश्न विचारा.": "Ask simple questions to AI.",
  "मासिक अहवाल समजून घेणे": "Understanding Monthly Reports",
  "दूध, खर्च आणि नफा reports वाचा.": "Read milk, expense and profit reports.",
  "App मध्ये reply": "Reply in App",
  "माझे tickets": "My Tickets",
  "अजून ticket नाही.": "No ticket yet."
});

Object.assign(MR_TO_EN, {
  "Email · लवकरच": "Email · Soon",
  "WhatsApp · लवकरच": "WhatsApp · Soon",
  "SMS · लवकरच": "SMS · Soon",
  "Cloud backup: नंतर जोडण्यासाठी तयार": "Cloud backup: ready for future integration",
  "तुम्ही मासिक लक्ष्याच्या 0% पूर्ण केले आहे. अजून 9000 liters बाकी आहे.": "You have completed 0% of the monthly goal. 9000 liters remaining.",
  "दूध उत्पन्न ₹10,000 पूर्ण करा.": "Complete milk income of ₹10,000.",
  "दूध उत्पन्न ₹50,000 पूर्ण करा.": "Complete milk income of ₹50,000.",
  "10 active गायींची नोंद ठेवा.": "Maintain records of 10 active cows.",
  "25 active गायींची नोंद ठेवा.": "Maintain records of 25 active cows.",
  "50 active गायींची नोंद ठेवा.": "Maintain records of 50 active cows.",
  "30 दूध नोंदी पूर्ण करा.": "Complete 30 milk records.",
  "एकूण 1000 liters दूध नोंद पूर्ण करा.": "Complete 1000 liters of milk records.",
  "बाकी": "Remaining",
  "एकूण 56 liters": "Total 56 liters",
  "एकूण 54 liters": "Total 54 liters",
  "पुढील ▶": "Next ▶",
  "दररोज सरासरी 0 liters": "Daily average 0 liters",
  "नोंदवलेले days": "Recorded days"
});


const EN_TO_MR = Object.fromEntries(
  Object.entries(MR_TO_EN).map(([marathi, english]) => [english, marathi])
);

EN_TO_MR.Reminders = "आठवण";

const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CANVAS", "SVG", "TEXTAREA"]);
const MARATHI_DIGIT_MAP = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9"
};
const ENGLISH_DIGIT_MAP = Object.fromEntries(Object.entries(MARATHI_DIGIT_MAP).map(([mr, en]) => [en, mr]));
const MARATHI_MONTHS_TO_EN = {
  "जानेवारी": "January",
  "फेब्रुवारी": "February",
  "मार्च": "March",
  "एप्रिल": "April",
  "एप्रि": "Apr",
  "मे": "May",
  "जून": "June",
  "जुलै": "July",
  "ऑगस्ट": "August",
  "सप्टेंबर": "September",
  "ऑक्टोबर": "October",
  "नोव्हेंबर": "November",
  "डिसेंबर": "December"
};
const ENGLISH_MONTHS_TO_MR = Object.fromEntries(Object.entries(MARATHI_MONTHS_TO_EN).map(([mr, en]) => [en, mr]));
const MARATHI_DYNAMIC_TERMS_TO_EN = {
  "लि.": "L",
  "लिटर": "liters",
  "दिवस": "days",
  "महिने": "months",
  "ते": "to",
  "मागील": "Previous",
  "सध्याचा": "Current",
  "सध्याचे": "Current",
  "घट": "decrease",
  "वाढ": "increase",
  "निवडले": "Selected",
  "आहे": "is",
  "आहेत": "are",
  "नाही": "no",
  "नाहीत": "none",
  "झाला": "done",
  "झाली": "done",
  "झाले": "done",
  "करा": "do",
  "पहा": "view",
  "इथे": "here",
  "का": "whether",
  "आणि": "and",
  "हा": "This",
  "ही": "This",
  "हे": "This"
};
const ENGLISH_DYNAMIC_TERMS_TO_MR = Object.fromEntries(Object.entries(MARATHI_DYNAMIC_TERMS_TO_EN).map(([mr, en]) => [en, mr]));

const MARATHI_FALLBACK_PHRASES_TO_EN = {
  "खाते पान लोड होत आहे": "Loading account page",
  "मोबाइल नंबर आणि PIN टाका": "Enter mobile number and PIN",
  "१० अंकी मोबाइल नंबर": "10 digit mobile number",
  "४ अंकी PIN": "4 digit PIN",
  "खाते उघडा": "Open Account",
  "खाते उघडत आहे": "Opening account",
  "PIN विसरलात": "Forgot PIN",
  "नवीन डेअरी नोंदणी करायची आहे": "Want to register a new dairy",
  "नवीन नोंदणी करा": "New Signup",
  "समजले": "Understood",
  "लपवा": "Hide",
  "दाखवा": "Show",

  "माहिती मिळाली नाही": "information could not be loaded",
  "मिळाली नाही": "could not be loaded",
  "मिळाल्या नाहीत": "could not be loaded",
  "मिळाले नाही": "could not be loaded",
  "मिळाला नाही": "could not be loaded",
  "लोड होत आहे": "loading",
  "लोड होत आहेत": "loading",
  "कडे जात आहे": "opening",
  "तपासत आहे": "checking",
  "तपासत आहेत": "checking",
  "जतन होत आहे": "saving",
  "जतन झाला नाही": "could not be saved",
  "जतन झाली नाही": "could not be saved",
  "जतन झाले नाही": "could not be saved",
  "जतन झाला": "saved",
  "जतन झाली": "saved",
  "जतन झाले": "saved",
  "काढायचा का": "do you want to delete",
  "काढायचे का": "do you want to delete",
  "काढायची का": "do you want to delete",
  "काढायचा आहे का": "do you want to delete",
  "काढायची आहे का": "do you want to delete",
  "काढायचे आहे का": "do you want to delete",
  "काढला नाही": "was not deleted",
  "काढली नाही": "was not deleted",
  "काढले नाही": "was not deleted",
  "काढला गेला नाही": "was not deleted",
  "सापडली नाही": "not found",
  "सापडले नाही": "not found",
  "चूक झाली": "something went wrong",
  "चुकीचा आहे": "is invalid",
  "चुकीची आहे": "is invalid",
  "बदलली नाही": "was not changed",
  "बदलला नाही": "was not changed",
  "बदलले नाही": "was not changed",
  "आवश्यक आहे": "is required",
  "पुन्हा प्रयत्न करा": "try again",
  "उघडत आहे": "opening",
  "माहिती बघा": "View Details",
  "नवीन": "New",
  "बदला": "Edit",
  "संपादित करा": "Edit",
  "काढा": "Delete",
  "काढले": "Deleted",
  "जोडा": "Add",
  "बंद करा": "Close",
  "रद्द करा": "Cancel",
  "जतन करा": "Save",
  "प्राप्त": "Received",
  "लिहा": "Enter",
  "दिसेल": "will appear",
  "दिसली पाहिजे": "should be visible",
  "नसावा": "should not be present",
  "नसावी": "should not be present",
  "जवळून": "closely",
  "अर्धा": "half",
  "तिरका": "tilted",
  "सावली": "shadow",
  "प्रकाश": "light",
  "चांगला": "good",
  "अक्षरे": "letters",
  "स्पष्ट": "clear",
  "सरळ": "straight",
  "फोटो": "Photo",
  "स्लिप": "Slip",
  "अपलोड": "Upload",
  "तपासा": "Check",
  "तपासणी": "Checkup",
  "वाचत आहे": "reading",
  "वाचली": "read",
  "वाचता आली नाही": "could not be read",
  "तयार करताना": "while preparing",
  "तयार होत आहे": "preparing",
  "तयार करा": "Prepare",
  "तयार": "Ready",
  "डेटा": "Data",
  "विश्वास": "Confidence",
  "मजकूर": "Text",
  "मूळ": "Original",

  "दैनिक दूध नोंदी": "daily milk records",
  "दूध नोंदी": "milk records",
  "दूध नोंद": "milk record",
  "दूध सविस्तर अहवाल": "Detailed Milk Report",
  "दूध उत्पन्न": "Milk Income",
  "दूध विक्री": "Milk Sale",
  "दूध": "Milk",
  "सकाळचे एकूण दूध": "Morning Total Milk",
  "संध्याकाळचे एकूण दूध": "Evening Total Milk",
  "सकाळचे दूध": "Morning Milk",
  "संध्याकाळचे दूध": "Evening Milk",
  "सकाळ नोंदी": "morning records",
  "संध्याकाळ नोंदी": "evening records",
  "दैनिक रक्कम": "Daily Amount",
  "दैनिक फॅट": "Daily Fat",
  "दैनिक SNF": "Daily SNF",
  "दैनिक तक्ता": "Daily Table",
  "दैनिक": "Daily",
  "एकूण रक्कम": "Total Amount",
  "एकूण लिटर": "Total Liters",
  "सकाळ": "Morning",
  "संध्याकाळ": "Evening",
  "नोंदवलेले दिवस": "Recorded Days",
  "दिवसांचा डेटा": "days of data",
  "या तारखेचे दूध": "Milk on this date",
  "या तारखेचे उत्पन्न": "Income on this date",
  "या तारखेचा": "For this date",
  "निवडलेली तारीख": "Selected Date",
  "वाचता आले नाही": "Could not read",
  "या तारखेला दूध नोंद नाही": "No milk record on this date",

  "सेटलमेंट": "Settlement",
  "दुग्ध देयक": "Dairy Payment",
  "१५ दिवसांचे पेमेंट": "15-day Payment",
  "१५ दिवसांचे देयक": "15-day Payment",
  "१५ दिवसांचे पेमेंट रेकॉर्ड्स": "15-day Payment Records",
  "वर्षानुसार १५ दिवसांच्या slips upload झाल्या का": "Year-wise 15-day slip upload status",
  "रेकॉर्ड्स": "Records",
  "१५ दिवसांचे डेअरी पेमेंट": "15-day Dairy Payment",
  "१५ दिवसांच्या": "15-day",
  "15 दिवसांच्या": "15-day",
  "देयक स्लिप": "payment slip",
  "बाकी देयक स्लिप": "Pending Payment Slip",
  "पेमेंट स्थिती": "Payment Status",
  "देय रक्कम": "Payable Amount",
  "शुद्ध देय": "Net Payable",
  "कुल कपात": "Total Deduction",
  "एकूण कपात": "Total Deduction",
  "कपात": "Deduction",
  "डेअरी कपात": "Dairy Deduction",
  "देयक कपात": "payment deduction",
  "खाद्य कपात": "Feed Deduction",

  "खर्च नोंद": "expense record",
  "खर्च माहिती": "expense information",
  "खर्च अहवाल": "Expense Report",
  "खर्च लोड होत आहेत": "expenses are loading",
  "खर्च सविस्तर": "Detailed Expenses",
  "खर्च": "Expense",
  "खाद्य खर्च": "Feed Expense",
  "खाद्य": "Feed",
  "चारा": "Fodder",
  "भूसा": "Bhusa",
  "मुरघास": "Silage",
  "औषध": "Medicine",
  "मजुरी": "Labor",
  "परिवहन": "Transport",
  "वाहतूक": "Transport",
  "वीज": "Electricity",
  "पशुवैद्यक": "Veterinarian",
  "इतर खर्च": "Other Expenses",
  "इतर": "Other",
  "मासिक खर्च": "Monthly Expenses",
  "वार्षिक खर्च": "Annual Expenses",
  "फार्म खर्च": "Farm Expenses",
  "एकूण खर्च": "Total Expense",
  "सर्व वर्ग": "All Categories",
  "वर्ग": "Category",
  "रक्कम": "Amount",
  "तारीख": "Date",
  "तपशील": "Details",
  "दर": "Rate",
  "दररोज": "Daily",
  "फॅट": "Fat",
  "गुणवत्ता": "Quality",
  "डिग्री": "Degree",
  "सरासरी": "Average",
  "प्रति": "per",

  "नफा माहिती": "profit information",
  "मासिक नफा": "Monthly Profit",
  "नफा अहवाल": "Profit Report",
  "नफा-तोटा विश्लेषण": "Profit-Loss Analysis",
  "शुद्ध नफा": "Net Profit",
  "नफा": "Profit",
  "तोटा": "Loss",
  "उत्पन्न सविस्तर": "Detailed Income",
  "उत्पन्न": "Income",
  "इतर उत्पन्न": "Other Income",
  "व्यवहार": "Transactions",
  "सर्व व्यवहार यादी": "All Transactions List",
  "हिशोब अहवाल": "Accounting Report",
  "हिशोब सारांश": "Accounting Summary",
  "पूर्ण हिशोब अहवाल": "Full Accounting Report",
  "नवीन उत्पन्न": "New Income",
  "नवीन खर्च": "New Expense",
  "व्यवहार बदला": "Edit Transaction",
  "नवीन व्यवहार": "New Transaction",

  "गाय कामगिरी अहवाल": "Cow Performance Report",
  "गाय कामगिरी": "Cow Performance",
  "गायीचे नाव": "Cow Name",
  "गायी": "Cows",
  "गाय": "Cow",
  "वासरे": "Calves",
  "वासरू": "Calf",
  "वासरी": "Female Calf",
  "गाभण": "Pregnant",
  "दुधाळ": "Milking",
  "रिकामी": "Open",
  "व्याललेली": "Calved",
  "संबंधित गाय": "Related Cow",
  "सर्व गायी": "All Cows",
  "फक्त दुधाळ गायी": "Milking Cows Only",
  "कमी उत्पादन गायी": "Low Production Cows",
  "गायीचे नाव शोधा": "Search cow name",
  "आई": "Mother",
  "नर": "Male",
  "मादी": "Female",

  "आठवण": "Reminder",
  "आठवणी": "Reminders",
  "पुढील आठवणी": "Upcoming Reminders",
  "मागील आठवणी": "Past Reminders",
  "लसीकरण यादी": "Vaccination List",
  "लसीकरण": "Vaccination",
  "जंतनाशक": "Deworming",
  "रेतन खर्च": "Breeding Expense",
  "रेतन": "Breeding",
  "व्यायण": "Calving",
  "गर्भधारणा": "Pregnancy",
  "तपासणी": "Checkup",
  "दूध बंद": "Dry Off",
  "शिंग काढणे": "Dehorning",

  "सविस्तर अहवाल": "Detailed Reports",
  "वार्षिक अहवाल": "Annual Report",
  "मासिक अहवाल छापा": "Print Monthly Report",
  "अहवाल मिळवताना": "loading report",
  "अहवाल तयार करताना": "while preparing report",
  "अहवाल तयार होत आहे": "Report is being prepared",
  "अहवाल तयार करा": "Prepare Report",
  "अहवाल": "Report",
  "यादी": "List",
  "विभागवार": "by category",
  "या महिन्यातील नोंदी": "records for this month",
  "या महिन्यात": "This month",
  "या महिन्यातील": "this month's",
  "या वर्षात": "This year",
  "या वर्षातील": "this year's",
  "वर्षानुसार": "Year-wise",
  "महिन्याची": "month's",
  "महिन्याचा": "month's",
  "निवडलेल्या": "selected",
  "भाग": "section",
  "अंतिम": "final",
  "दाखवले आहे": "shown",
  "दाखवतो": "shows",
  "धरलेले नाहीत": "not included",
  "धरून": "including",
  "वेगळे": "separate",
  "मोजलेले": "calculated",
  "मधील": "in",
  "मोठे": "large",
  "अनियमित": "irregular",
  "उशीर": "late",
  "कामगिरी": "performance",
  "उत्पादन": "production",
  "सारांश": "summary",
  "मागील महिन्यापेक्षा": "compared to previous month",
  "मागील महिन्यासारखाच निकाल": "same result as previous month",
  "जास्त": "higher",
  "कमी": "lower",
  "मोठा खर्च": "Large Expense",
  "अंतिम खर्च": "final expense",
  "आपोआप": "automatic",
  "नोंदीवरून": "from records",
  "नोंदी": "records",
  "नोंद": "record",
  "मासिक": "Monthly",
  "वार्षिक": "Annual"
};
const ENGLISH_FALLBACK_PHRASES_TO_MR = Object.fromEntries(
  Object.entries(MARATHI_FALLBACK_PHRASES_TO_EN)
    .map(([mr, en]) => [en, mr])
    .filter(([en]) => String(en).length > 3)
);

export function normalizeUiLanguage(language) {
  return language === "en" ? "en" : "mr";
}

function preserveWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function replaceMapWords(text, map) {
  let next = text;
  for (const [from, to] of Object.entries(map).sort((a, b) => b[0].length - a[0].length)) {
    next = next.replaceAll(from, to);
  }
  return next;
}

function replaceMonthWords(text, map) {
  let next = text;
  for (const [from, to] of Object.entries(map).sort((a, b) => b[0].length - a[0].length)) {
    next = next.replace(new RegExp(`(^|[^A-Za-z\\u0900-\\u097F])${from}($|[^A-Za-z\\u0900-\\u097F])`, "g"), (_, before, after) => `${before}${to}${after}`);
  }
  return next;
}

function replaceStandaloneTerms(text, map) {
  let next = text;
  for (const [from, to] of Object.entries(map).sort((a, b) => b[0].length - a[0].length)) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`(^|[^A-Za-z\\u0900-\\u097F])${escaped}($|[^A-Za-z\\u0900-\\u097F])`, "g"), (_, before, after) => `${before}${to}${after}`);
  }
  return next;
}

function translateFormatting(text, language) {
  if (!text) return text;
  if (language === "en") {
    return replaceStandaloneTerms(
      replaceMapWords(replaceMonthWords(text, MARATHI_MONTHS_TO_EN), MARATHI_FALLBACK_PHRASES_TO_EN),
      MARATHI_DYNAMIC_TERMS_TO_EN
    ).replace(/[०-९]/g, (digit) => MARATHI_DIGIT_MAP[digit] || digit);
  }

  return replaceStandaloneTerms(
    replaceMapWords(replaceMonthWords(text, ENGLISH_MONTHS_TO_MR), ENGLISH_FALLBACK_PHRASES_TO_MR),
    ENGLISH_DYNAMIC_TERMS_TO_MR
  ).replace(/\d/g, (digit) => ENGLISH_DIGIT_MAP[digit] || digit);
}

function formattedPreserveWhitespace(original, translated, language) {
  return preserveWhitespace(original, translateFormatting(translated, language));
}

const TRANSLATION_CACHE = new Map();
const TRANSLATION_CACHE_LIMIT = 3000;

export function translateUiText(text, language) {
  if (!text || typeof text !== "string") return text;

  const targetLanguage = normalizeUiLanguage(language);
  const cacheKey = `${targetLanguage}:${text}`;
  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey);
  }

  const translated = translateUiTextUncached(text, targetLanguage);
  if (TRANSLATION_CACHE.size > TRANSLATION_CACHE_LIMIT) {
    TRANSLATION_CACHE.clear();
  }
  TRANSLATION_CACHE.set(cacheKey, translated);
  return translated;
}

function translateUiTextUncached(text, targetLanguage) {
  const dictionary = targetLanguage === "en" ? MR_TO_EN : EN_TO_MR;
  const trimmed = text.trim();

  if (!trimmed) return text;
  if (dictionary[trimmed]) {
    return formattedPreserveWhitespace(text, dictionary[trimmed], targetLanguage);
  }

  const prefixedMatch = trimmed.match(/^([^A-Za-z0-9\u0900-\u097F]+)\s+(.+)$/u);
  if (prefixedMatch && dictionary[prefixedMatch[2]]) {
    return formattedPreserveWhitespace(text, `${prefixedMatch[1]} ${dictionary[prefixedMatch[2]]}`, targetLanguage);
  }

  const requiredMatch = trimmed.match(/^(.+?)\s+\*$/u);
  if (requiredMatch && dictionary[requiredMatch[1]]) {
    return formattedPreserveWhitespace(text, `${dictionary[requiredMatch[1]]} *`, targetLanguage);
  }

  const suffixedMatch = trimmed.match(/^(.+?)\s+([^A-Za-z0-9\u0900-\u097F]+)$/u);
  if (suffixedMatch && dictionary[suffixedMatch[1]]) {
    return formattedPreserveWhitespace(text, `${dictionary[suffixedMatch[1]]} ${suffixedMatch[2]}`, targetLanguage);
  }

  if (targetLanguage === "en") {
    const trialOkMatch = trimmed.match(/^🎉 आपल्याकडे\s+(.+?)\s+दिवसांचा चाचणी कालावधी आहे\.$/u);
    if (trialOkMatch) return formattedPreserveWhitespace(text, `🎉 You have ${trialOkMatch[1]} days of trial remaining.`, targetLanguage);

    const trialWarningMatch = trimmed.match(/^⚠️ आपला चाचणी कालावधी\s+(.+?)\s+दिवसांत संपणार आहे\.$/u);
    if (trialWarningMatch) return formattedPreserveWhitespace(text, `⚠️ Your trial will end in ${trialWarningMatch[1]} days.`, targetLanguage);

    if (trimmed === "🔒 आपला चाचणी कालावधी संपला आहे.") {
      return formattedPreserveWhitespace(text, "🔒 Your trial has expired.", targetLanguage);
    }

    const pendingSlipMatch = trimmed.match(/^(.+?)\s+देयक स्लिप अपलोड बाकी$/u);
    if (pendingSlipMatch) return formattedPreserveWhitespace(text, `${pendingSlipMatch[1]} payment slips pending`, targetLanguage);

    const remainingMatch = trimmed.match(/^बाकी:\s*(.+)$/u);
    if (remainingMatch) return formattedPreserveWhitespace(text, `Remaining: ${remainingMatch[1]}`, targetLanguage);

    const firstPendingMatch = trimmed.match(/^पहिले बाकी:\s*(.+)$/u);
    if (firstPendingMatch) return formattedPreserveWhitespace(text, `First pending: ${firstPendingMatch[1]}`, targetLanguage);

    const goalTargetMatch = trimmed.match(/^लक्ष्य:\s*(.+)$/u);
    if (goalTargetMatch) return formattedPreserveWhitespace(text, `Target: ${goalTargetMatch[1]}`, targetLanguage);

    const remainingLitersMatch = trimmed.match(/^(.+?)\s+लिटर बाकी$/u);
    if (remainingLitersMatch) return formattedPreserveWhitespace(text, `${remainingLitersMatch[1]} liters remaining`, targetLanguage);

    const completedPercentMatch = trimmed.match(/^(.+?)\s+पूर्ण$/u);
    if (completedPercentMatch) return formattedPreserveWhitespace(text, `${completedPercentMatch[1]} complete`, targetLanguage);

    const greetingMatch = trimmed.match(/^नमस्कार,\s*(.+)$/);
    if (greetingMatch) return formattedPreserveWhitespace(text, `Hello, ${greetingMatch[1]}`, targetLanguage);

    const lastUpdateMatch = trimmed.match(/^शेवटचे अपडेट:\s*(.+)$/);
    if (lastUpdateMatch) return formattedPreserveWhitespace(text, `Last update: ${lastUpdateMatch[1]}`, targetLanguage);

    const reasonMatch = trimmed.match(/^कारण:\s*(.+)$/u);
    if (reasonMatch) return formattedPreserveWhitespace(text, `Reason: ${reasonMatch[1]}`, targetLanguage);
  } else {
    const trialOkMatch = trimmed.match(/^🎉 You have\s+(.+?)\s+days of trial remaining\.$/u);
    if (trialOkMatch) return formattedPreserveWhitespace(text, `🎉 आपल्याकडे ${trialOkMatch[1]} दिवसांचा चाचणी कालावधी आहे.`, targetLanguage);

    const trialWarningMatch = trimmed.match(/^⚠️ Your trial will end in\s+(.+?)\s+days\.$/u);
    if (trialWarningMatch) return formattedPreserveWhitespace(text, `⚠️ आपला चाचणी कालावधी ${trialWarningMatch[1]} दिवसांत संपणार आहे.`, targetLanguage);

    if (trimmed === "🔒 Your trial has expired.") {
      return formattedPreserveWhitespace(text, "🔒 आपला चाचणी कालावधी संपला आहे.", targetLanguage);
    }

    const pendingSlipMatch = trimmed.match(/^(.+?)\s+payment slips pending$/u);
    if (pendingSlipMatch) return formattedPreserveWhitespace(text, `${pendingSlipMatch[1]} देयक स्लिप अपलोड बाकी`, targetLanguage);

    const remainingMatch = trimmed.match(/^Remaining:\s*(.+)$/u);
    if (remainingMatch) return formattedPreserveWhitespace(text, `बाकी: ${remainingMatch[1]}`, targetLanguage);

    const firstPendingMatch = trimmed.match(/^First pending:\s*(.+)$/u);
    if (firstPendingMatch) return formattedPreserveWhitespace(text, `पहिले बाकी: ${firstPendingMatch[1]}`, targetLanguage);

    const goalTargetMatch = trimmed.match(/^Target:\s*(.+)$/u);
    if (goalTargetMatch) return formattedPreserveWhitespace(text, `लक्ष्य: ${goalTargetMatch[1]}`, targetLanguage);

    const remainingLitersMatch = trimmed.match(/^(.+?)\s+liters remaining$/u);
    if (remainingLitersMatch) return formattedPreserveWhitespace(text, `${remainingLitersMatch[1]} लिटर बाकी`, targetLanguage);

    const completedPercentMatch = trimmed.match(/^(.+?)\s+complete$/u);
    if (completedPercentMatch) return formattedPreserveWhitespace(text, `${completedPercentMatch[1]} पूर्ण`, targetLanguage);

    const greetingMatch = trimmed.match(/^Hello,\s*(.+)$/);
    if (greetingMatch) return formattedPreserveWhitespace(text, `नमस्कार, ${greetingMatch[1]}`, targetLanguage);

    const lastUpdateMatch = trimmed.match(/^Last update:\s*(.+)$/);
    if (lastUpdateMatch) return formattedPreserveWhitespace(text, `शेवटचे अपडेट: ${lastUpdateMatch[1]}`, targetLanguage);

    const reasonMatch = trimmed.match(/^Reason:\s*(.+)$/u);
    if (reasonMatch) return formattedPreserveWhitespace(text, `कारण: ${reasonMatch[1]}`, targetLanguage);
  }

  const formatted = translateFormatting(text, targetLanguage);
  return formatted !== text ? formatted : text;
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
