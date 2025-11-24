import pytest
from playwright.sync_api import sync_playwright
@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        yield page
        browser.close()
def test_frontend_is_up(browser, servers):
    browser.goto("localhost:5173")
    assert browser.title() == ""

def test_backend_is_up(browser, servers):
    browser.goto("localhost:8000")
    assert browser.title() == ""
    
def test_go_to_login(browser, servers):
    browser.goto("localhost:5173")
    browser.get_by_role("link", name="Login").click()
    assert browser.url == "http://localhost:5173/login"

def test_login(browser, servers):
    browser.goto("localhost:5173")
    browser.get_by_role("link", name="Login").click()
    locator = browser.locator("#email")
    locator.fill("opettaja@test.fi")
    assert locator.input_value() == "opettaja@test.fi"