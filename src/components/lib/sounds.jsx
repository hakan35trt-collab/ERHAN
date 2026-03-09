let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();

    const playBeep = (freq, startTime, duration, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playBeep(880,  now,         0.12, 0.3);
    playBeep(1100, now + 0.13,  0.12, 0.25);
    playBeep(1320, now + 0.26,  0.18, 0.2);
  } catch (e) {
    console.warn('Bildirim sesi çalınamadı:', e);
  }
};
