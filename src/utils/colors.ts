/** Color helpers (temporary) --> where can we get netlogo colors to rgb? */
/** netlogoColorToHex: Converts NetLogo color to its hex string. */
var colorTimesTen: number;
var baseIndex: number;
var r, g, b: number;
var step: number;

const baseColorsToRGB: {[key:string]: string}= {
  gray: 'rgb(140, 140, 140)',
  red: 'rgb(215, 48, 39)',
  orange: 'rgb(241, 105, 19)',
  brown: 'rgb(156, 109, 70)',
  yellow: 'rgb(237, 237, 47)',
  green: 'rgb(87, 176, 58)',
  lime: 'rgb(42, 209, 57)',
  turquoise: 'rgb(27, 158, 119)',
  cyan: 'rgb(82, 196, 196)',
  sky: 'rgb(43, 140, 190)',
  blue: 'rgb(50, 92, 168)',
  violet: 'rgb(123, 78, 163)',
  magenta: 'rgb(166, 25, 105)',
  pink: 'rgb(224, 126, 149)',
  black: 'rgb(0, 0, 0)',
  white: 'rgb(255, 255, 255)',
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

function netlogoToRGB(netlogoColor: number): string {
  let temp: number[] = cached[Math.floor(netlogoColor * 10)];
  return `rgb(${temp[0]}, ${temp[1]}, ${temp[2]})`;
}

/* return the compound string (red + 5) to a regular number */
function compoundToRGB(content: string): string {
  let stringSplit = content.split(" ");
  try {
    if(stringSplit[1] == '+') {
      return netlogoToRGB(colorToNumberMapping[stringSplit[0]] + Number(stringSplit[2]));
    } else if (stringSplit[1] == '-') {
      return netlogoToRGB(colorToNumberMapping[stringSplit[0]] - Number(stringSplit[2]));
    }
  } catch {
    return '';
  }
  return '';
}

/** netlogoArrToRGB: returns the rgb string from a netlogo color array */
function netlogoArrToRGB(inputString: string) {
  // Check for valid opening and closing brackets
  if (!inputString.startsWith('[') || !inputString.endsWith(']')) {
    return '';
  }
  const numbers = inputString.slice(1, -1).split(/\s+/).filter(n => n);
  if (numbers.length === 3 || numbers.length === 4) {
    const validNumbers = numbers.map(Number).every(num => !isNaN(num) && num >= 0 && num <= 255);

    if (validNumbers) {
      if (numbers.length === 3) {
        return `rgb(${numbers.join(', ')})`;
      } else {
        return `rgba(${numbers.join(', ')})`;
      }
    }
  }
  return '';
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

/**  extractRGBValues: takes an rgb string andr returns an rgba array*/
function extractRGBValues(rgbString: string) {
  const regex = /rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d{1,3}|\d\.\d+))?\)/;

  const match = rgbString.match(regex);
  if (match) {
    const values = match.slice(1).filter(n => n !== undefined).map(Number);
    return values;
  }
  return [];
}

export {netlogoToText, netlogoBaseColors, netlogoToRGB, cachedNetlogoColors, colorToNumberMapping, baseColorsToRGB, compoundToRGB, netlogoArrToRGB, extractRGBValues}