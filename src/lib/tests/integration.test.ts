
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import App from '../components/App.svelte';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;

describe('App Integration Tests', () => {
    it('should add a flow and update the chart', async () => {
        const { getByLabelText, getByText, container } = render(App);

        const sourceInput = getByLabelText('Source');
        const targetInput = getByLabelText('Target');
        const valueInput = getByLabelText('Value');
        const addButton = getByText('Add Flow');

        await fireEvent.input(sourceInput, { target: { value: 'A' } });
        await fireEvent.input(targetInput, { target: { value: 'B' } });
        await fireEvent.input(valueInput, { target: { value: '10' } });

        await fireEvent.click(addButton);

        // Check if the flow is added to the list
        expect(container.innerHTML).toContain('A');
        expect(container.innerHTML).toContain('B');
        expect(container.innerHTML).toContain('10');
    });
});
