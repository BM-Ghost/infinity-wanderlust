import requests
from bs4 import BeautifulSoup
import sys
import json

def get_travel_articles(location):
    search_url = f"https://www.nationalgeographic.com/search?q={location.replace(' ', '+')}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    response = requests.get(search_url, headers=headers)

    if response.status_code != 200:
        return json.dumps({"error": f"Failed to fetch data (Status Code {response.status_code})"})

    soup = BeautifulSoup(response.text, 'html.parser')

    articles = []
    
    for article in soup.find_all('article'):
        title_element = article.find('h2')
        link_element = article.find('a')

        if title_element and link_element:
            title = title_element.get_text(strip=True)
            link = link_element['href']

            if not link.startswith('http'):
                link = f"https://www.nationalgeographic.com{link}"

            articles.append({"title": title, "link": link})

    return json.dumps(articles if articles else {"message": "No articles found for this location."})

if __name__ == "__main__":
    location = sys.argv[1]
    print(get_travel_articles(location))
