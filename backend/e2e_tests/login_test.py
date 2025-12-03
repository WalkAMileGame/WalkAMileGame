import pytest
from playwright.sync_api import sync_playwright, expect
from time import sleep
@pytest.fixture
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        yield page
        browser.close()

def test_go_to_login(browser, servers):
    browser.goto("localhost:5173")
    browser.get_by_role("link", name="Login").click()
    assert browser.url == "http://localhost:5173/login"

def test_login(browser, servers):
    browser.goto("http://localhost:5173")
    browser.on("console", lambda msg: print("console:", msg.type, msg.text))
    browser.on("pageerror", lambda exc: print("pageerror:", exc))
    browser.get_by_role("link", name="Login").click()
    browser.fill("#email", "simkatti@test.fi")
    assert browser.input_value("#email") == "simkatti@test.fi"

    browser.fill("#password", "testi")
    assert browser.input_value("#password") == "testi"

    login_btn = browser.get_by_role("button", name="Login")
    expect(login_btn).to_be_visible()
    expect(login_btn).to_be_enabled()
    login_btn.click()
    browser.wait_for_url("**/landing", timeout=5000)
    expect(browser).to_have_url("http://localhost:5173/landing")

def test_landing_has_elements(browser, servers):
    #Login prepare
    browser.goto("http://localhost:5173")
    browser.get_by_role("link", name="Login").click()
    browser.fill("#email", "simkatti@test.fi")
    browser.fill("#password", "testi")
    login_btn = browser.get_by_role("button", name="Login")
    login_btn.click()
    sleep(1)
    #Test cases
    expect(browser.get_by_text("Logout")).to_be_visible()
    expect(browser.get_by_role("link", name= "simkatti@test.fi")).to_be_visible()
    expect(browser.get_by_text("EDIT GAMEBOARDS")).to_be_visible()
    expect(browser.get_by_text("HOST A GAME")).to_be_visible()
    expect(browser.get_by_text("EDIT CIRCUMSTANCES")).to_be_visible()
    expect(browser.get_by_text("MANAGE USERS")).to_be_visible()
    expect(browser.get_by_text("You are logged in as simkatti@test.fi")).to_be_visible()

def test_landing_links(browser, servers):
    #This test tests the 4 main links from the landing page. We also use 3 different ways to backtrack to /landing
    #login prepare
    browser.goto("http://localhost:5173")
    browser.get_by_role("link", name="Login").click()
    browser.fill("#email", "simkatti@test.fi")
    browser.fill("#password", "testi")
    login_btn = browser.get_by_role("button", name="Login")
    login_btn.click()
    #Edit gameboards
    card = browser.get_by_role("heading", name="EDIT GAMEBOARDS").locator("..")
    edit_button = card.get_by_role("button", name="Edit")
    edit_button.click()
    expect(browser).to_have_url("http://localhost:5173/gameboard")
    browser.go_back()
    expect(browser).to_have_url("http://localhost:5173/landing")
    #Edit circumstances
    card = browser.get_by_role("heading", name="EDIT CIRCUMSTANCES").locator("..")
    edit_button = card.get_by_role("button", name="Edit")
    edit_button.click()
    expect(browser).to_have_url("http://localhost:5173/circumstances")
    browser.go_back()
    expect(browser).to_have_url("http://localhost:5173/landing")
    #Host game
    host_button = browser.get_by_role("button", name="Host")
    host_button.click()
    expect(browser).to_have_url("http://localhost:5173/hostgame")
    browser.goto("http://localhost:5173/landing")
    expect(browser).to_have_url("http://localhost:5173/landing")
    #Manage users
    manage_button = browser.get_by_role("button", name="Manage")
    manage_button.click()
    expect(browser).to_have_url("http://localhost:5173/edit_users")
    locator = browser.get_by_role("link", name="simkatti@test.fi")
    locator.click()
    expect(browser).to_have_url("http://localhost:5173/landing")