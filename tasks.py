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
def lint(c, backend=False, frontend=False):
    if not backend and not frontend: # NOR gate
        backend = frontend = True
    
    if backend:
        print("Linting backend code...")
        try:
            c.run("pylint backend/ --fail-under=9.0", pty=False, warn=True)
            print("Backend linting completed.")
        except Exception as e:
            print(f"Backend linting failed: {e}")

    if frontend:
        print("")
        print("Linting frontend code...")
        with c.cd('frontend'):
            c.run('npm run lint')
        print("Frontend linting completed.")


@task
def autopep(c):
    c.run("autopep8 --in-place --aggressive --recursive backend/", pty=True)

