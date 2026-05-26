/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/bootstrap-auto-dark-mode
 * License: MIT, see file 'LICENSE'
 */

;(function () {
    const htmlElement = document.querySelector("html")
    
    function updateTheme() {
        // Use user preference or auto
        const theme = localStorage.getItem("theme") || window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        htmlElement.setAttribute("data-bs-theme", theme)
    }

    // Listen for system preference changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        // Only update if user hasn’t manually chosen
        if (!localStorage.getItem("theme")) {
            updateTheme()
        }
    })
    
    updateTheme()
})()
