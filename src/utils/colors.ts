/** Color helpers (temporary) --> where can we get netlogo colors to rgb? */
/** netlogoColorToHex: Converts NetLogo color to its hex string. */
var colorTimesTen: number;
var baseIndex: number;
var r, g, b: number;
var step: number;

const baseColorsToRGB: { [key: string]: number[] } = {
  gray: [140, 140, 140],
  red: [215, 48, 39],
  orange: [241, 105, 19],
  brown: [156, 109, 70],
  yellow: [237, 237, 47],
  green: [87, 176, 58],
  lime: [42, 209, 57],
  turquoise: [27, 158, 119],
  cyan: [82, 196, 196],
  sky: [43, 140, 190],
  blue: [50, 92, 168],
  violet: [123, 78, 163],
  magenta: [166, 25, 105],
  pink: [224, 126, 149],
  black: [0, 0, 0],
  white: [255, 255, 255],
};

const colorToNumberMapping: {[key:string]: number} = {
  'gray': 5,
  'red': 15,
  'orange': 25,
  'brown': 35,
  'yellow': 45,
  'green': 55,
  'lime': 65,
  'turquoise': 75,
  'cyan': 85,
  'sky': 95,
  'blue': 105,
  'violet': 115,
  'magenta': 125,
  'pink': 135,
  'black': 145,
  'white': 155,
};

const netlogoBaseColors: [number, number, number][] = [
  [140, 140, 140], // gray       (5)
  [215, 48, 39], // red       (15)
  [241, 105, 19], // orange    (25)
  [156, 109, 70], // brown     (35)
  [237, 237, 47], // yellow    (45)
  [87, 176, 58], // green     (55)
  [42, 209, 57], // lime      (65)
  [27, 158, 119], // turquoise (75)
  [82, 196, 196], // cyan      (85)
  [43, 140, 190], // sky       (95)
  [50, 92, 168], // blue     (105)
  [123, 78, 163], // violet   (115)
  [166, 25, 105], // magenta  (125)
  [224, 126, 149], // pink     (135)
  [0, 0, 0], // black
  [255, 255, 255], // white
];
let cachedNetlogoColors = (function () {
  var k, results;
  results = [];
  for (colorTimesTen = k = 0; k <= 1400; colorTimesTen = ++k) {
    baseIndex = Math.floor(colorTimesTen / 100);
    [r, g, b] = netlogoBaseColors[baseIndex];
    step = ((colorTimesTen % 100) - 50) / 50.48 + 0.012;
    if (step < 0) {
      r += Math.floor(r * step);
      g += Math.floor(g * step);
      b += Math.floor(b * step);
    } else {
      r += Math.floor((0xff - r) * step);
      g += Math.floor((0xff - g) * step);
      b += Math.floor((0xff - b) * step);
    }
    results.push([r, g, b]);
  }
  return results;
})();
let cached: number[][] = cachedNetlogoColors;

function netlogoToRGB(netlogoColor: number): number[] {
  let temp: number[] = cached[Math.floor(netlogoColor * 10)];
  return [temp[0], temp[1], temp[2]];
}

function netlogoToText(netlogoColor: number): string {
  let baseColorIndex = Math.floor(netlogoColor / 10);
  let baseColorName = Object.keys(baseColorsToRGB)[baseColorIndex];
  let offset = (netlogoColor % 10) - 5;

  if (offset === 0) {
    // If the color is a base color, return only the base color name
    return baseColorName;
  } else if (offset > 0) {
    // For positive offset, include a space before the offset
    return `${baseColorName} + ${offset}`;
  } else {
    // For negative offset, include a space before the negative offset
    return `${baseColorName} - ${Math.abs(offset)}`;
  }
}

export {netlogoToText, netlogoBaseColors, netlogoToRGB, cachedNetlogoColors, colorToNumberMapping}