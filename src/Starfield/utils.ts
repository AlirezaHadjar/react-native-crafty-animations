export function generateRandomStarColor() {
  // Generate random values for RGB components with a yellowish-white tint
  const red = 255; // Maximum value for red component
  const componentValue = Math.floor(Math.random() * 51); // Random value for green and blue components (between 0 and 50)
  const green = 255 - componentValue; // Adjusted green component value
  const blue = 255 - componentValue; // Adjusted blue component value

  // Convert RGB values to hexadecimal format
  const hexColor = `#${red.toString(16)}${green.toString(16)}${blue.toString(
    16,
  )}`;

  return hexColor;
}
