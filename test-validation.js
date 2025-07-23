import { validateFlowInput } from './src/lib/validation.js';

const testCases = [
    { source: 'A', target: 'B', value: '1e-10' },
    { source: 'A', target: 'B', value: '1e10' },
    { source: 'A', target: 'B', value: '1e100' },
];

testCases.forEach(input => {
    const result = validateFlowInput(input);
    console.log(`Input: ${input.value}`);
    console.log(`Valid: ${result.isValid}`);
    console.log(`Errors: ${result.errors.join(', ')}`);
    console.log(`Warnings: ${result.warnings?.join(', ') || 'none'}`);
    console.log('---');
});
