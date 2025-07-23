// Debug validation issue
const input = { source: 'A', target: 'B', value: '1e-10' };

console.log('Input:', input);
console.log('Value string:', input.value);
console.log('Parsed value:', parseFloat(input.value));
console.log('Is NaN?', isNaN(parseFloat(input.value)));
console.log('Is finite?', isFinite(parseFloat(input.value)));
console.log('Is > 0?', parseFloat(input.value) > 0);
console.log('Is < 0.001?', parseFloat(input.value) < 0.001);

// Test the regex
const valueStr = input.value.trim();
const regex = /^-?\d*\.?\d+([eE][+-]?\d+)?$/;
console.log('Regex test:', regex.test(valueStr));
