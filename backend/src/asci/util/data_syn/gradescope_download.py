import os
import sys
import argparse
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

def download_gradescope_assignment(email, password, download_path, chromedriver_path, chromium_path, course_number):
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": download_path,
        "download.prompt_for_download": False,
        "safebrowsing.enabled": True
    })
    chrome_options.binary_location = chromium_path
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")

    # Initialize WebDriver
    s = Service(chromedriver_path)
    driver = webdriver.Chrome(service=s, options=chrome_options)

    # indicate if the data is successfully downloaded
    success = True

    try:
        # Output initial info
        print("Successfully entered the gradescope_download python script")
        print(email, password, download_path, chromedriver_path, course_number)

        # Open the login page and log in
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

        # Navigate to the course assignments page
        driver.get(f'https://www.gradescope.com/courses/{course_number}/assignments')

        # Wait and click the tooltip button using JavaScript
        elements = driver.find_elements(By.CLASS_NAME, 'js-downloadGradesTooltipLink')
        if elements:
            tooltip_button = elements[0]
            driver.execute_script("arguments[0].click();", tooltip_button)
            print("Download grade button clicked via JavaScript!")

            # Wait for the "Download CSV" link to be clickable and click it
            download_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//a[contains(text(), "Download CSV")]'))
            )
            download_link.click()
            print("Clicked on 'Download CSV' link.")

            # Wait for download to complete
            time.sleep(5)
            print("Assignments grade download should be complete.")

            # retrieve the name of the file we just downloaded
            downloaded_files = os.listdir(download_path)
            if downloaded_files:
                # Sort files by modification time and get the last one
                latest_file = max([os.path.join(download_path, f) for f in downloaded_files], key=os.path.getmtime)
                print("Latest downloaded file:", os.path.basename(latest_file))
            else:
                print("Couldn't find the file just downloaded.")
                success = False
        else:
            print("Download grade button not found.")
            success = False
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        success = False
    finally:
        # Close the browser
        driver.quit()

        # Exit with 0 if successful, 1 otherwise
        sys.exit(0 if success else 1)

# Parse command-line arguments
parser = argparse.ArgumentParser(description='Automate Gradescope assignments download.')
parser.add_argument('email', help='Gradescope account email')
parser.add_argument('password', help='Gradescope account password')
parser.add_argument('download_path', help='Path to save the downloaded file')
parser.add_argument('chromedriver_path', help='Path to the ChromeDriver executable')
parser.add_argument('chromium_path', help='Path to the Chromium executable')
parser.add_argument('course_number', help='Gradescope course number')

args = parser.parse_args()

# Call the function with arguments from the command line
download_gradescope_assignment(args.email, args.password, args.download_path, args.chromedriver_path, args.chromium_path, args.course_number)
