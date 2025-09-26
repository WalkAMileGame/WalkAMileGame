"""All invoke commands to be put here"""
from invoke import task
import threading
import subprocess
import signal
import sys
import os
import atexit

_processes = []

def cleanup_processes():
    """Clean up all spawned processes"""
    print(f"Cleaning up {len(_processes)} processes...")
    for proc in _processes:
        try:
            if proc.poll() is None:  # Process still running
                process_name = proc.args[0] if proc.args else "unknown"
                print(f"(⌐■_■)╤─ Terminating process '{process_name}' (PID: {proc.pid})")
                if hasattr(proc, 'pgid'):
                    os.killpg(proc.pgid, signal.SIGTERM)
                else:
                    proc.terminate()
                
                # Wait a moment for graceful shutdown
                try:
                    proc.wait(timeout=3)
                    print(f"(─▽─)b Process {process_name} terminated gracefully (PID: {proc.pid})")
                except subprocess.TimeoutExpired:
                    print(f"╯‵Д′)╯彡┻━┻ Process {process_name} didn't respond, force killing... (PID: {proc.pid})")
                    if hasattr(proc, 'pgid'):
                        os.killpg(proc.pgid, signal.SIGKILL) # Force kill
                    else:
                        proc.kill()
        except:
            pass

# Register cleanup function
atexit.register(cleanup_processes)

@task
def server(c, backend=False, frontend=False):
    """Run local server via vite using threading for parallel execution"""
    if not backend and not frontend:
        backend = frontend = True
    
    def signal_handler(signum, frame):
        """Handle interrupt signals gracefully"""
        print("\n(-.-)Zzz... Shutting down servers...")
        cleanup_processes()
        # Restore terminal state
        os.system('stty sane')
        sys.exit(0)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    threads = []
    
    def run_backend():
        """Run the backend server using subprocess"""
        print("Starting backend server...")
        try:
            # Create new process group to manage child processes
            proc = subprocess.Popen(
                ['uvicorn', 'backend.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1,
                preexec_fn=os.setsid
            )
            proc.pgid = proc.pid  # process group ID
            _processes.append(proc)
            
            print("✧(˶^ᗜ ^˶) Backend server started")
            
            # Stream output
            for line in proc.stdout:
                print(f"[BACKEND] {line.rstrip()}")
                
        except FileNotFoundError:
            print("Σ (ﾟДﾟ;)  uvicorn not found.")
        except Exception as e:
            print(f"˙◠˙ Backend error: {e}")
    
    def run_frontend():
        """Run the frontend development server using subprocess"""
        print("Starting frontend server...")
        try:
            print("(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ Installing npm dependencies...")
            install_proc = subprocess.run(
                ['npm', 'install'],
                cwd='frontend',
                capture_output=True,
                text=True
            )
            
            if install_proc.returncode != 0:
                print(f"˙◠˙ npm install failed: {install_proc.stderr}")
                return
            
            # dev server
            proc = subprocess.Popen(
                ['npm', 'run', 'dev', '--', '--open'],
                cwd='frontend',
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1,
                preexec_fn=os.setsid
            )
            proc.pgid = proc.pid  # group ID
            _processes.append(proc)
            
            print("✧(˶^ᗜ ^˶) Frontend server started")
            
            # Stream output
            for line in proc.stdout:
                print(f"[FRONTEND] {line.rstrip()}")
                
        except Exception as e:
            print(f"˙◠˙ Frontend error: {e}")
    
    # Start backend thread
    if backend:
        backend_thread = threading.Thread(target=run_backend, name="BackendThread")
        threads.append(backend_thread)
        backend_thread.start()
    
    # Start frontend thread
    if frontend:
        frontend_thread = threading.Thread(target=run_frontend, name="FrontendThread")
        threads.append(frontend_thread)
        frontend_thread.start()
    
    try:
        while True:
            # Check if any threads are still alive
            alive_threads = [t for t in threads if t.is_alive()]
            if not alive_threads:
                break
            
            # Wait a bit before checking again
            for thread in alive_threads:
                thread.join(timeout=0.1)
                
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

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

