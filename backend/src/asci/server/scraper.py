# https://realpython.com/beautiful-soup-web-scraper-python/
# https://www.jointaro.com/interviews/questions/web-crawler-multithreaded/
# https://mrzeynalli.medium.com/building-a-web-crawler-using-python-f01c09f48ead

import sys
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import urllib.robotparser
import time

# Store all visited URLs for crawling
visited_urls = set()

def scrape(url):
    # Sanitize URL
    url = url.replace("\\", "").strip()
    if not url.startswith("http"):
        url = "https://" + url

    # Fetch webpage
    page = requests.get(url, timeout=10)
    # Raise exception if unsuccessful request
    page.raise_for_status()
    
    try:
        # Parse HTML
        soup = BeautifulSoup(page.content, "html.parser")
        
        # Remove irrelevant elements
        for element in soup(["script", "style", "footer", "aside"]):
            element.decompose()
        
        # Remove advertisement elements (might not be relevant on course websites)
        for element in soup.find_all(class_=["sidebar", "ads", "promo"]):
            element.decompose()
        
        # Extract text
        content = []
        for element in soup.find_all(["h1", "h2", "h3", "p", "li", "td"]):
            text = element.get_text(strip=True)
            if text:
                content.append(text)
        text = "\n".join(content)
    except Exception as e:
        print(f"Error parsing HTML from {url}: {e}")

    return soup, text

def get_links(soup, base_url):
    links = set()
    try:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            absolute_url = urljoin(base_url, href)
            # Check if link is still from the same website
            if absolute_url and urlparse(absolute_url).netloc == urlparse(base_url).netloc:
                # Sanitize URL
                absolute_url = absolute_url.replace("\\", "").strip()
                if not absolute_url.startswith("http"):
                    absolute_url = "https://" + absolute_url
                links.add(absolute_url)
    except Exception as e:
        print(f"Error extracting links from {base_url}: {e}")
    return links

def crawl(url, depth=0, max_depth=2):
    # Avoid infinite crawl by defining a max depth
    # Ignore URL if already visited
    if depth > max_depth or url in visited_urls:
        return []

    print(f"Crawling: {url}")
    visited_urls.add(url)

    try:
        soup, text = scrape(url)
    except Exception as e:
        print(f"Failed: {url} ({e})")
        return []

    results = [(url, text)]

    links = get_links(soup, url)

    for link in links:
        # Wait between requests to avoid overwhelming servers
        # time.sleep(1)
        results.extend(crawl(link, depth + 1, max_depth))

    return results

if __name__ == "__main__":
    try:
        url = sys.argv[1]
        
        # Use headers to avoid bot detection
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0 Safari/537.36"
        }

        # Create session to avoid bot detection
        session = requests.Session()
        session.headers.update(headers)

        # Check robots.txt
        robot_parser = urllib.robotparser.RobotFileParser()
        robot_parser.set_url(url + '/robots.txt')
        try:
            robot_parser.read()
        except:
            print("robots.txt not found or unable to parse.")
        if not robot_parser.can_fetch("*", url):
            print(f"Blocked by robots.txt: {url}")
        else:
            output = crawl(url)
            for url, text in output:
                print(f"\n--- {url} ---\n")
                print(text)
    except IndexError:
        print("Error: Missing arguments")
    except Exception as e:
        print(f"An error occurred: {e}")
    if not output:
        print("No content scraped")