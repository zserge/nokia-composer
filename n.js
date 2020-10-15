C = 0; // Initial value for audio context is zero
stop = _ => C && C.close((C = 0)); // interrupt the playback, if any
c = (x = 0, a, b) => (x < a && (x = a), x > b ? b : x); // clamping function (a<=x<=b)
play = (s, bpm) => {
  C = new AudioContext();
  (z = C.createOscillator())
    .connect((g = C.createGain()))
    .connect(C.destination);
  z.type = 'square';
  z.start();
  t = 0;
  v = (x, v) => x.setValueAtTime(v, t); // setValueAtTime shorter alias
  for (m of s.matchAll(/(\d*)?(\.?)(#?)([a-g-])(\d*)/g)) {
    k = m[4].charCodeAt(); // note ASCII [0x41..0x47] or [0x61..0x67]
    n = 0 | ((((k & 7) * 1.6 + 8) % 12) + !!m[3] + 12 * c(m[5], 1, 3)); // note index [0..35]
    v(z.frequency, 65.4 * 2 ** (n / 12));
    v(g.gain, (~k & 8) / 8);
    t = t + (240 / bpm / c(m[1] || 4, 1, 64)) * (1 + !!m[2] / 2);
    v(g.gain, 0);
  }
};
