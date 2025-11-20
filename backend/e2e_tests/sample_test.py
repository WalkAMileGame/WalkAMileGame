import pytest
from playwright.sync_api import sync_playwright
@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        yield page
        browser.close()
def test_site_is_up(browser, servers):
    browser.goto("localhost:5173")
    assert browser.title() == ""