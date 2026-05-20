const STORAGE_KEY = "sme-accounts-notified-items";

function isLocalDevelopmentHost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export async function cleanupDevelopmentServiceWorkers() {
  if (!("serviceWorker" in navigator) || !isLocalDevelopmentHost()) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("support-hub-") || key.startsWith("sme-accounts-"))
          .map((key) => caches.delete(key))
      );
    }
  } catch (error) {
    console.warn("Development service worker cleanup failed", error);
  }
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  if (isLocalDevelopmentHost()) {
    await cleanupDevelopmentServiceWorkers();
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  return Notification.requestPermission();
}

function readNotifiedItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch (error) {
    return [];
  }
}

function writeNotifiedItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-100)));
}

function isDueSoon(isoDate) {
  const dueTime = new Date(isoDate).getTime();
  const now = Date.now();
  const delta = dueTime - now;

  return delta <= 5 * 60 * 1000 && delta >= -60 * 1000;
}

function playAlertTone() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.06;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.35);
}

export async function notifyDueItems(reminders = [], medications = [], adminReminders = []) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    const dueAudibleAdminReminders = adminReminders.filter(
      (item) =>
        isDueSoon(item.dueAt) &&
        !item.isCompleted &&
        (item.notificationMode === "audible" || item.notificationMode === "both")
    );

    if (dueAudibleAdminReminders.length > 0) {
      playAlertTone();
    }

    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const alreadyNotified = readNotifiedItems();
  const dueItems = [...reminders, ...medications, ...adminReminders].filter((item) => {
    const key = `${item.title}-${item.dueAt}`;
    const isAdminReminder = Object.prototype.hasOwnProperty.call(item, "notificationMode");
    const allowsNotification =
      !isAdminReminder || item.notificationMode === "notification" || item.notificationMode === "both";
    return isDueSoon(item.dueAt) && !alreadyNotified.includes(key) && allowsNotification;
  });

  const dueAudibleAdminReminders = adminReminders.filter((item) => {
    const key = `${item.title}-${item.dueAt}-audible`;
    return (
      isDueSoon(item.dueAt) &&
      !item.isCompleted &&
      (item.notificationMode === "audible" || item.notificationMode === "both") &&
      !alreadyNotified.includes(key)
    );
  });

  for (const item of dueItems) {
    const key = `${item.title}-${item.dueAt}`;
    const body = item.notes || item.dosage || "Support activity is coming up soon.";

    if (registration?.showNotification) {
      await registration.showNotification(item.title, {
        body,
        tag: key,
        icon: "/icons/icon.svg",
        badge: "/icons/icon.svg"
      });
    } else {
      new Notification(item.title, { body });
    }

    alreadyNotified.push(key);
  }

  if (dueAudibleAdminReminders.length > 0) {
    playAlertTone();
    dueAudibleAdminReminders.forEach((item) => {
      alreadyNotified.push(`${item.title}-${item.dueAt}-audible`);
    });
  }

  writeNotifiedItems(alreadyNotified);
}

export function getNotificationSupportMessage() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isiOS && !isStandalone) {
    return "On iPadOS or iPhone, install this app to the home screen before enabling notifications.";
  }

  return "Notifications can be used later for payment, GST lodgement, and invoice review reminders.";
}
