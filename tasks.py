"""All invoke commands to be put here"""
from invoke import task
import threading

@task
def server(c, backend=False, frontend=False):
    """Run local server via vite using threading for parallel execution"""
    if not backend and not frontend:
        backend = frontend = True
    
    threads = []
    
    def run_backend():
        """Run the backend server"""
        print("Starting backend server...")
        try:
            c.run('uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000', echo=True)
        except Exception as e:
            print(f"Backend failed to start: {e}")
    
    def run_frontend():
        """Run the frontend development server"""
        print("Starting frontend server...")
        with c.cd('frontend'):
            c.run('npm install')
            c.run('npm run dev -- --open')
    
    # Start backend thread
    if backend:
        backend_thread = threading.Thread(target=run_backend, name="BackendThread")
        backend_thread.daemon = True  # Dies when main thread dies
        threads.append(backend_thread)
        backend_thread.start()
    
    # Start frontend thread
    if frontend:
        frontend_thread = threading.Thread(target=run_frontend, name="FrontendThread")
        frontend_thread.daemon = True  # Dies when main thread dies
        threads.append(frontend_thread)
        frontend_thread.start()
    
    # Wait for all threads to complete (or until interrupted)
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        # Threads will be terminated when main thread exits due to daemon=True

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

