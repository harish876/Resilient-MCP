## ResilientDB MCP Server
A Model Context Protocol (MCP) server for interacting with ResilientDB, a high-performance blockchain platform. This server allows Large Language Models (LLMs) to read from and write to ResilientDB via the Model Context Protocol.

## Installation
Docker Build
```
docker build -t mcp/resilientdb -f Dockerfile . 
```

Run using Claude Desktop. Add this to `claude_desktop.json` file.

```
{
  "mcpServers": {
    "resilientdb": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/resilientdb"]
    }
  }
}

```
## Functionality
This starts the MCP server listening on stdio, ready to communicate with an MCP client.

Tools
This server provides the following tools:

### set
Stores a key-value pair in ResilientDB.
Parameters:
- key (string): The key to store the value under
- value (string): The value to store

### get
Retrieves a value from ResilientDB by key.

Parameters:
- key (string): The key to retrieve

