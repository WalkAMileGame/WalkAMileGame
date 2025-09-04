"""All invoke commands to be put here"""
from invoke import task

@task
def server(c):
    """Run local server via vite"""
    with c.cd('frontend'):
        c.run(f'npm install')
        c.run('npm run dev -- --open')

@task
def test(c):
    c.run("pytest", pty=False)

@task
def coverage(c):
    """tracks pytest tests"""
    c.run("coverage run --branch -m pytest; coverage html", pty=True)

@task
def lint(c):
    c.run("pylint frontend/src/ backend/ ", pty=False)

@task
def autopep(c):
    c.run("autopep8 --in-place --aggressive --recursive frontend/src/ backend/", pty=True)

