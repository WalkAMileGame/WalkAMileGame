import pytest
from playwright.sync_api import sync_playwright, expect


@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        yield page
        browser.close()


def test_frontend_is_up(browser, servers):
    browser.goto("http://localhost:5173")
    expect(browser.get_by_text("WALK A MILE:")).to_be_visible()


def test_backend_is_up(browser, servers):
    browser.goto("http://localhost:8000")
    # locator = browser.get_by_text("Welcome to your todo list.")
    expect(browser.get_by_text("Welcome to your todo list.")).to_be_visible()


def test_frontpage_has_expected_links(browser, servers):
    browser.goto("http://localhost:5173")
    expect(browser.get_by_text("Home")).to_be_visible()
    expect(browser.get_by_text("Login")).to_be_visible()
    expect(browser.get_by_text("ABOUT US")).to_be_visible()
    expect(browser.get_by_text("INSTRUCTIONS")).to_be_visible()
    expect(browser.get_by_text("ENTER GAME CODE:")).to_be_visible()


def test_frontpage_has_no_login_only_links(browser, servers):
    browser.goto("http://localhost:5173")
    expect(browser.get_by_text("simkatti@test.fi")).not_to_be_visible()
    expect(browser.get_by_text("Logout")).not_to_be_visible()
