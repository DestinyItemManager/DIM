interface ColorHex {
  red: number;
  green: number;
  blue: number;
}

export function generateGradient(start: string, end: string, steps: number) {
  // parse RGB values to each {Red, Green, Blue} keys
  const startRGB = hexToRgb(start);
  const endRGB = hexToRgb(end);
  const gradients = [];

  // generate color for each steps provided then push the value to gradients array
  for (let step = 1; step <= steps; step++) {
    const colors = {};
    for (const color of ['red', 'green', 'blue']) {
      if (startRGB !== null && endRGB !== null) {
        colors[color] = colorMaker(startRGB[color], endRGB[color], steps, step);
      }
    }
    const rgb = `rgb(${colors['red']}, ${colors['green']}, ${colors['blue']})`;

    gradients.push(rgb);
  }

  return gradients;
}

function colorMaker(start: number, end: number, steps: number, step: number) {
  // let redDiff = (start.red > end.red) ? start.red - end.red : end.red - start.red;

  let val;
  if (start > end) {
    const singleStep = (start - end) / steps;
    val = start - singleStep * step;
  } else if (end > start) {
    const singleStep = (end - start) / steps;
    val = start + singleStep * step;
  } else {
    val = start | end;
  }

  return ~~val;
}

function hexToRgb(hex: string): ColorHex | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  let color: ColorHex;
  if (result !== null) {
    color = {
      red: parseInt(result[1], 16),
      green: parseInt(result[2], 16),
      blue: parseInt(result[3], 16),
    };
    return color;
  }
  return null;
}
