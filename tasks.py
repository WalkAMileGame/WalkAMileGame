"""All invoke commands to be put here"""
from invoke import task

@task
def server(c):
    """Run local server via vite"""
    with c.cd('frontend'):
        c.run(f'npm install')
        c.run('npm run dev -- --open')
