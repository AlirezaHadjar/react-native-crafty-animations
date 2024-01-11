function mix(a: number, b: number, v: number) {
  return (1 - v) * a + v * b;
}

export const hsbToRgb = (H: number, S: number, B: number) => {
  var V2 = B * (1 - S);
  var r =
    (H >= 0 && H <= 60) || (H >= 300 && H <= 360)
      ? B
      : H >= 120 && H <= 240
      ? V2
      : H >= 60 && H <= 120
      ? mix(B, V2, (H - 60) / 60)
      : H >= 240 && H <= 300
      ? mix(V2, B, (H - 240) / 60)
      : 0;
  var g =
    H >= 60 && H <= 180
      ? B
      : H >= 240 && H <= 360
      ? V2
      : H >= 0 && H <= 60
      ? mix(V2, B, H / 60)
      : H >= 180 && H <= 240
      ? mix(B, V2, (H - 180) / 60)
      : 0;
  var b =
    H >= 0 && H <= 120
      ? V2
      : H >= 180 && H <= 300
      ? B
      : H >= 120 && H <= 180
      ? mix(V2, B, (H - 120) / 60)
      : H >= 300 && H <= 360
      ? mix(B, V2, (H - 300) / 60)
      : 0;

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};
