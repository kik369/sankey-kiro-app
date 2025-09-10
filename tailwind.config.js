/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
            },
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '1rem',
                    lg: '2rem',
                    xl: '2rem',
                },
            },
            borderRadius: {
                xl: '0.875rem',
            },
        },
    },
    plugins: [],
};
