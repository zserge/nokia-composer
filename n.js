C = 0; // Initial value for audio context is zero
stop = _ => C && C.close((C = 0)); // interrupt the playback, if any
c = (x = 0, a, b) => (x < a && (x = a), x > b ? b : x); // clamping function (a<=x<=b)
// Schedule the song onto any context X (realtime or offline); returns end time
sched = (X, s, bpm) => {
  // Create square oscillator and gain to mute/unmute it
  (z = X.createOscillator())
    .connect((g = X.createGain()))
    .connect(X.destination);
  z.type = 'square';
  z.start();
  t = 0; // current time counter, in seconds
  v = (x, v) => x.setValueAtTime(v, t); // setValueAtTime shorter alias
  for (m of s.matchAll(/(\d*)?(\.?)(#?)([a-g-])(\d*)/g)) {
    k = m[4].charCodeAt(); // note ASCII [0x41..0x47] or [0x61..0x67]
    n = 0 | ((((k & 7) * 1.6 + 8) % 12) + !!m[3] + 12 * c(m[5], 1, 3)); // note index [0..35]
    v(z.frequency, 261.63 * 2 ** (n / 12));
    v(g.gain, (~k & 8) / 8);
    // note duration, measured in 1/10 seconds to simplify further ratios,
    // i.e. multiply by 7 instead of 0.7
    d = (24 / bpm / c(m[1] || 4, 1, 64)) * (1 + !!m[2] / 2);
    t = t + d*7;
    v(g.gain, 0);
    t = t + d*3;
  }
  return t;
};
// Play the song in real time through a live audio context
play = (s, bpm) => sched((C = new AudioContext()), s, bpm);
// Render the song offline to an AudioBuffer (returns a Promise)
render = (s, bpm) => {
  T = sched(new OfflineAudioContext(1, 1, 44100), s, bpm); // dry run for length
  O = new OfflineAudioContext(1, (44100 * T + 1) | 0, 44100);
  sched(O, s, bpm);
  return O.startRendering();
};
// Encode a mono AudioBuffer as a 16-bit PCM WAV Blob
wav = buf => {
  D = buf.getChannelData(0);
  N = D.length;
  A = new ArrayBuffer(44 + N * 2);
  V = new DataView(A);
  W = (o, s) => [...s].map((ch, i) => V.setUint8(o + i, ch.charCodeAt())); // write ASCII
  W(0, 'RIFF'); V.setUint32(4, 36 + N * 2, 1); W(8, 'WAVE');
  W(12, 'fmt '); V.setUint32(16, 16, 1); V.setUint16(20, 1, 1); V.setUint16(22, 1, 1);
  V.setUint32(24, 44100, 1); V.setUint32(28, 44100 * 2, 1); V.setUint16(32, 2, 1); V.setUint16(34, 16, 1);
  W(36, 'data'); V.setUint32(40, N * 2, 1);
  for (i = 0; i < N; i++) V.setInt16(44 + i * 2, c(D[i], -1, 1) * 32767, 1);
  return new Blob([A], { type: 'audio/wav' });
};
// Render and trigger a download of the song as song.wav
save = (s, bpm) =>
  render(s, bpm).then(b => {
    (a = document.createElement('a')).href = URL.createObjectURL(wav(b));
    a.download = 'tone.wav';
    a.click();
  });
