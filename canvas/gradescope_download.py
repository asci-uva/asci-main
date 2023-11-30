from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

# Configure Chrome options
chrome_options = Options()
chrome_options.add_experimental_option("prefs", {
    "download.default_directory": "/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope", 
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})

# Initialize WebDriver
driver = webdriver.Chrome(executable_path='/path/to/chromedriver', options=chrome_options)

# Open the login page
driver.get('https://www.gradescope.com/login')

# Fill in login details and submit (modify selectors as per the actual login form)
driver.find_element_by_id('email').send_keys('hz9xs@virginia.edu')
driver.find_element_by_id('password').send_keys('zhz20020325ZHZ!')
driver.find_element_by_name('commit').click()

time.sleep(5)  # Wait for the page to load

# Navigate to the page with the download link
driver.get('https://www.gradescope.com/courses/571397/assignments')

# Click the download button (modify the selector as per the actual button)
driver.find_element_by_css_selector('button.download-button').click()

# Wait for download to complete and close the browser
time.sleep(10)
driver.quit()
