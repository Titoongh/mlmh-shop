import type { Config } from 'tailwindcss'
import containerQueries from '@tailwindcss/container-queries'

const shadowX = '4px'
const shadowY = '4px'
const smallShadowX = '2px'
const smallShadowY = '2px'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                base: `${shadowX} ${shadowY} 0px 0px`,
                small: `${smallShadowX} ${smallShadowY} 0px 0px`,
            },
            colors: {
                'white-oldlace': '#FEF2E8',
                orange: '#EF9D00',
                'orange-khaki': '#FFE18D',
                'blue-sky': '#8AE',
                'yellow-khaki': '#FFDC59',
                'red-salmon': '#FF6B6B',
                'green-darkcyan': '#0EB47C',
                'brown-sandy': '#F2B45C',
                'purple-medium': '#A388EE',
                'purple-light': '#E4DFF4',
                'purple-dark': '#4C00FF',
            },
            translate: {
                boxShadowX: shadowX,
                boxSmallShadowX: smallShadowX,
                boxShadowY: shadowY,
                boxSmallShadowY: smallShadowY,
                reverseBoxShadowX: `-${shadowX}`,
                reverseBoxShadowY: `-${shadowY}`,
                reverseBoxSmallShadowX: `-${smallShadowX}`,
                reverseBoxSmallShadowY: `-${smallShadowY}`,
            },
            screens: {
                xxs: '500px',
                xs: '600px',
                lg: '800px',
                xl: '1200px',
                xxl: '1800px',
            },
            containers: {
                scxs: '600px',
                sclg: '800px',
                xs: '200px',
                lg: '350px',
                xl: '450px',
                textxs: '350px',
                textlg: '450px',
                textxl: '550px',
            },
        },
    },
    plugins: [
        // @ts-ignore
        containerQueries,
        function (helpers: {
            addUtilities: (utilities: Record<string, any>) => void
        }) {
            const newUtilities = {
                '.bg-square-pattern': {
                    'background-image': `
                  linear-gradient(#E6E6E6 2px, transparent 1px),
                  linear-gradient(90deg, #E6E6E6 2px, transparent 1px)`,
                    'background-size': '75px 75px',
                    'background-color': 'white',
                },
            }
            helpers.addUtilities(newUtilities)
        },
    ],
}
export default config
