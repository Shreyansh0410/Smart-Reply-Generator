#!/usr/bin/env python3
import os
import sys
import subprocess
import platform

def run_cmd(args, cwd=None):
    """Utility to run commands and check output."""
    try:
        subprocess.check_call(args, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(args)}")
        print(f"Details: {str(e)}")
        return False

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(root_dir, ".venv")
    
    # Determine executables based on platform
    is_windows = platform.system() == "Windows"
    if is_windows:
        python_bin = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_bin = os.path.join(venv_dir, "Scripts", "pip.exe")
        uvicorn_bin = os.path.join(venv_dir, "Scripts", "uvicorn.exe")
    else:
        python_bin = os.path.join(venv_dir, "bin", "python")
        pip_bin = os.path.join(venv_dir, "bin", "pip")
        uvicorn_bin = os.path.join(venv_dir, "bin", "uvicorn")

    print("=" * 60)
    print("      🚀 Smart Reply Generator Bootstrapper 🚀")
    print("=" * 60)
    
    # Step 1: Create Virtual Environment if it doesn't exist
    if not os.path.exists(venv_dir):
        print("Creating virtual environment (.venv)...")
        if not run_cmd([sys.executable, "-m", "venv", ".venv"], cwd=root_dir):
            print("Failed to create virtual environment. Do you have python3-venv installed?")
            sys.exit(1)
        print("✓ Virtual environment created.")
    else:
        print("✓ Virtual environment already exists.")
        
    # Step 2: Install dependencies
    requirements_file = os.path.join(root_dir, "backend", "requirements.txt")
    print("\nInstalling/Updating Python dependencies from requirements.txt...")
    if not run_cmd([pip_bin, "install", "-r", requirements_file], cwd=root_dir):
        print("Failed to install dependencies.")
        sys.exit(1)
    print("✓ Dependencies installed successfully.")

    # Step 3: Run the server
    print("\n" + "=" * 60)
    print("  Starting FastAPI Server at: http://localhost:8000")
    print("  Open this URL in your web browser to use the application.")
    print("  To stop the server, press Ctrl+C.")
    print("=" * 60 + "\n")
    
    try:
        # Run FastAPI via uvicorn in the venv
        subprocess.run([uvicorn_bin, "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"], cwd=root_dir)
    except KeyboardInterrupt:
        print("\nStopping server...")
        print("Goodbye!")

if __name__ == "__main__":
    main()
