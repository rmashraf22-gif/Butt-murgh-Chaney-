// Web Audio API & Speech Synthesis Order Alert Utility
// Provides both crystal bell chime and vocal Urdu/Hindi announcement: "Order aya hai sahab!"
// Also manages browser system notification (lockscreen / background mobile push alert).

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays restaurant service bell chime notes
 */
export function playOrderNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell chime notes (A5, C#6, E6)
    const tones = [
      { freq: 880, start: 0, duration: 0.8, gain: 0.25 },
      { freq: 1108.73, start: 0.12, duration: 0.9, gain: 0.28 },
      { freq: 1318.51, start: 0.24, duration: 1.1, gain: 0.3 },
    ];

    tones.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Bell strike attack and exponential decay
      gainNode.gain.setValueAtTime(0.001, now + start);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio chime play notice:', err);
  }
}

/**
 * Vocal Announcement: "Order aya hai sahab!"
 * Uses Web Speech Synthesis with voice pitch, rate, and South Asian language fallback
 */
export function playOrderVoiceAnnouncement(phrase = 'Order aya hai sahab!') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    // Cancel any stuck speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.95; // Clear and deliberate speed
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Try finding an Urdu, Hindi, or Punjabi voice, otherwise fallback to system voice
    const voices = window.speechSynthesis.getVoices();
    const urduOrHindiVoice = voices.find(
      (v) =>
        v.lang.startsWith('ur') ||
        v.lang.startsWith('hi') ||
        v.lang.startsWith('pa') ||
        v.lang.includes('IN')
    );

    if (urduOrHindiVoice) {
      utterance.voice = urduOrHindiVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Voice announcement notice:', e);
  }
}

/**
 * Complete Order Alert: Plays bell strike, then speaks "Order aya hai sahab!"
 */
export function playFullOrderAlert(phrase = 'Order aya hai sahab!') {
  playOrderNotificationChime();
  // Speak after a subtle 300ms delay so chime and voice blend smoothly
  setTimeout(() => {
    playOrderVoiceAnnouncement(phrase);
  }, 350);
}

/**
 * Mobile & Desktop System Notification (shows on lockscreen / background tab)
 */
export async function requestSystemNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res;
  }
  return Notification.permission;
}

export function showSystemOrderNotification(orderNumber: string, customerName: string, amount: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification('🔔 Order aya hai sahab!', {
        body: `Order #${orderNumber} (${customerName}) - Rs. ${amount.toLocaleString()}`,
        icon: '/favicon.ico',
        tag: `order-${orderNumber}`,
        silent: false,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('System notification error:', e);
    }
  }
}
