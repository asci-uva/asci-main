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
                78: "312px",
                94: "376px",
                120: "480px",
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};
