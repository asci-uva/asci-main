# import time
# from selenium import webdriver
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC

# # Function to automate login and file download
# def download_gradescope_assignment(email, password, download_path, chromedriver_path, course_number):
#     # Configure Chrome options
#     chrome_options = Options()
#     chrome_options.add_experimental_option("prefs", {
#         "download.default_directory": download_path,
#         "download.prompt_for_download": False,
#         "safebrowsing.enabled": True
#     })
    
#     # Initialize WebDriver
#     s = Service(chromedriver_path)
#     driver = webdriver.Chrome(service=s, options=chrome_options)
    
#     try:
#         # Open the login page
#         driver.get('https://www.gradescope.com/login')
        
#         # Wait for the email field to be present
#         WebDriverWait(driver, 10).until(
#             EC.presence_of_element_located((By.ID, "session_email"))
#         )
        
#         # Fill in login details and submit
#         driver.find_element(By.ID, 'session_email').send_keys(email)
#         driver.find_element(By.ID, 'session_password').send_keys(password)
#         driver.find_element(By.NAME, 'commit').click()
        
#         # Wait for navigation and page load
#         WebDriverWait(driver, 10).until(
#             EC.presence_of_element_located((By.CLASS_NAME, "courseBox"))
#         )
        
#         # Navigate to the specific page with the download link
#         # TODO adjust the course number later
#         driver.get('https://www.gradescope.com/courses/{course_number}/assignments')
        

#         # Click the button to show the tooltip
#         tooltip_button = WebDriverWait(driver, 10).until(
#             EC.element_to_be_clickable((By.CLASS_NAME, 'js-downloadGradesTooltipLink'))
#         )
#         tooltip_button.click()

#         # Then click the "Download CSV" link
#         download_link = WebDriverWait(driver, 10).until(
#             EC.element_to_be_clickable((By.XPATH, '//a[contains(text(), "Download CSV")]'))
#         )
#         download_link.click()

        
#         # Wait for download to complete (adjust time as needed)
#         time.sleep(1.5)
        
#     finally:
#         # Close the browser
#         driver.quit()

# # Example usage
# email = 'hz9xs@virginia.edu'
# password = 'zhz20020325ZHZ!'
# download_path = '/Users/zhaohanzhang/Desktop/research_docs/asci-main/gradescope'
# chromedriver_path = '/Users/zhaohanzhang/Desktop/chromedriver'
# download_gradescope_assignment(email, password, download_path, chromedriver_path)




import argparse
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService


def download_gradescope_assignment(email, password, download_path, chromedriver_path, course_number):
    try:
        print("Success: Downloaded assignments from Gradescope.")
        print(email, password, download_path, chromedriver_path, course_number)
    except Exception as e:
        print(f"Error: {str(e)}")

    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": download_path,
        "download.prompt_for_download": False,
        "safebrowsing.enabled": True
    })
    # chrome_options.add_argument("--headless")
    # chrome_options.add_argument("--no-sandbox")
    # chrome_options.add_argument("--disable-dev-shm-usage")
    # chrome_options.add_argument("--disable-gpu")  # This is important for some versions of Chrome
    # chrome_options.add_argument("--remote-debugging-port=9222") 
    
    # Initialize WebDriver
    s = Service(chromedriver_path)
    driver = webdriver.Chrome(service=s, options=chrome_options)
    
    try:
        # Open the login page
        driver.get('https://www.gradescope.com/login')
        
        # Wait for the email field to be present
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "session_email"))
        )
        
        # Fill in login details and submit
        driver.find_element(By.ID, 'session_email').send_keys(email)
        driver.find_element(By.ID, 'session_password').send_keys(password)
        driver.find_element(By.NAME, 'commit').click()
        
        # Wait for navigation and page load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "courseBox"))
        )
        
        # Navigate to the specific course page with the download link
        driver.get('https://www.gradescope.com/courses/'+str(course_number)+'/assignments')
        

        # Click the button to show the tooltip
        tooltip_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, 'js-downloadGradesTooltipLink'))
        )
        tooltip_button.click()

        # Then click the "Download CSV" link
        download_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//a[contains(text(), "Download CSV")]'))
        )
        download_link.click()

        
        # Wait for download to complete (adjust time as needed)
        time.sleep(5)
        
    finally:
        # Close the browser
        driver.quit()

    
# Parse command-line arguments
parser = argparse.ArgumentParser(description='Automate Gradescope assignments download.')
parser.add_argument('email', help='Gradescope account email')
parser.add_argument('password', help='Gradescope account password')
parser.add_argument('download_path', help='Path to save the downloaded file')
parser.add_argument('chromedriver_path', help='Path to the ChromeDriver executable')
parser.add_argument('course_number', help='Gradescope course number')

args = parser.parse_args()

# Call the function with arguments from the command line
download_gradescope_assignment(args.email, args.password, args.download_path, args.chromedriver_path, args.course_number)


