from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
import json
import sys
import time

BASE_URL = "https://www.nationalgeographic.com/search?q="

def scrape_articles(location):
    search_url = f"{BASE_URL}{location.replace(' ', '%20')}"
    
    options = Options()
    options.add_argument("--headless")  # Run in headless mode (no browser UI)
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920x1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    try:
        driver.get(search_url)
        time.sleep(5)  # Allow time for JavaScript to load

        # Locate article elements
        articles = driver.find_elements(By.CSS_SELECTOR, "a.AnchorLink.ResultCard__Link")

        results = []
        for article in articles:
            link = article.get_attribute("href")
            
            # Find the actual title element inside the anchor tag
            try:
                title_element = article.find_element(By.XPATH, ".//span[@class='sr-only']")
                title = title_element.text.strip()
            except:
                title = "Title Not Found"

            results.append({"title": title, "link": link})

        return results if results else {"message": "No articles found for this location."}

    except Exception as e:
        return {"error": str(e)}

    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a location."}))
        sys.exit(1)

    location = sys.argv[1]
    data = scrape_articles(location)
    print(json.dumps(data, indent=4))
