C = 0; // Initial value for audio context is zero
stop = _ => C && C.close((C = 0)); // interrupt the playback, if any
c = (x = 0, a, b) => (x < a && (x = a), x > b ? b : x); // clamping function (a<=x<=b)
play = (s, bpm) => {
  // Create audio context, square oscillator and gain to mute/unmute it
  C = new AudioContext();
  (z = C.createOscillator())
    .connect((g = C.createGain()))
    .connect(C.destination);
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
};
