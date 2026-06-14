let audioContext: AudioContext | null = null;

export function unlockNotificationSound() {
  if (typeof window === "undefined") return;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
}

/** Two-tone chime for new order alerts. */
export function playNewOrderNotificationSound() {
  unlockNotificationSound();
  if (!audioContext) return;

  const playTone = (frequency: number, startAt: number, duration: number) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.28, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  };

  const now = audioContext.currentTime;
  playTone(880, now, 0.16);
  playTone(1175, now + 0.2, 0.22);
}
