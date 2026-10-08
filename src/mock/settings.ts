export const currencyOptions = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
];

export const languageOptions = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "sw", name: "Swahili" },
  { code: "zh", name: "Chinese" },
];

export const defaultSettings = {
  appearance: {
    theme: "dark" as "dark" | "light",
    compactMode: false,
    showSparklines: true,
  },
  notifications: {
    priceAlerts: true,
    newsUpdates: true,
    weeklyReport: false,
    marketingEmails: false,
    pushNotifications: true,
  },
  currency: "USD",
  language: "en",
  profile: {
    name: "Jeremiah Ogingo",
    email: "jeremiah@example.com",
    username: "jeremiah",
  },
  security: {
    twoFactor: false,
    sessionTimeout: "30",
  },
};