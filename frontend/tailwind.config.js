/** @type {import('tailwindcss').Config} */
module.exports = {
    important: true,
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        fontFamily: {
            serif: ["DM Serif Text", "ui-serif", "Georgia"],
        },
        extend: {
            spacing: {
                15: "60px",
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};
