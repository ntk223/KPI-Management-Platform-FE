/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Standard system palettes
        primary: '#0052CC',
        secondary: '#42526E',
        success: '#36B37E',
        warning: '#FFAB00',
        danger: '#FF5630',
        
        // Business role-based colors
        'role-admin': '#8777D9',     // Purple - System Administration
        'role-director': '#00B8D9',  // Teal - Executive leadership & Strategy
        'role-manager': '#FF8B00',   // Orange - Department Management
        'role-employee': '#0065FF',  // Blue - Staff & Operations
      },
    },
  },
  plugins: [],
}
