"""Coding tool definitions for tool-calling benchmarks."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_code",
            "description": "Execute a code snippet in the specified programming language and return the output.",
            "parameters": {
                "type": "object",
                "properties": {
                    "language": {
                        "type": "string",
                        "enum": ["python", "javascript", "bash", "sql"],
                        "description": "The programming language to run",
                    },
                    "code": {
                        "type": "string",
                        "description": "The code snippet to execute",
                    },
                },
                "required": ["language", "code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read and return the contents of a file at the given path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The file path to read, e.g. 'src/main.py' or 'config.json'",
                    }
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file at the specified path, creating it if it doesn't exist.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The file path to write to",
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write into the file",
                    },
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_documentation",
            "description": "Search official documentation for a library or framework.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query, e.g. 'array slicing' or 'async await syntax'",
                    },
                    "library": {
                        "type": "string",
                        "description": "The library or framework to search, e.g. 'numpy', 'react', 'fastapi'",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "install_package",
            "description": "Install a software package using a package manager.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The package name to install, e.g. 'requests' or 'express'",
                    },
                    "manager": {
                        "type": "string",
                        "enum": ["pip", "npm", "yarn", "cargo"],
                        "description": "The package manager to use (default: pip)",
                    },
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "execute_shell_command",
            "description": "Execute a shell command on the system.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute",
                    }
                },
                "required": ["command"],
            },
        },
    },
]

TOOL_NAMES = {t["function"]["name"] for t in TOOLS}
