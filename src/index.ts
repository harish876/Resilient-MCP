import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";
import https from 'https';

// Configuration
const RESDB_URL = "https://www.memlensapi.run.place/api/v1/";
const resdbClient = axios.create({
    baseURL: RESDB_URL,
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This disables certificate verification - use only in development
    })
});


// Define Zod schemas for validation
const SetArgumentsSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const GetArgumentsSchema = z.object({
    key: z.string(),
});

// Create server instance
const server = new Server(
    {
        name: "resilientdb",
        version: "0.0.1"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "set",
                description: "Set a ResilientDB key-value pair",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: {
                            type: "string",
                            description: "ResilientDB key",
                        },
                        value: {
                            type: "string",
                            description: "Value to store",
                        },
                    },
                    required: ["id", "value"],
                },
            },
            {
                name: "get",
                description: "Get value by key from ResilientDB",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: {
                            type: "string",
                            description: "ResilientDB key to retrieve",
                        },
                    },
                    required: ["id"],
                },
            }
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "set") {
            const { key, value } = SetArgumentsSchema.parse(args);
            const response = await resdbClient.post("/transactions/set", {
                id: key,
                value,
            })
            if (response?.status != 200) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error setting key: ${response.statusText}`,
                        },
                    ],
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Successfully set key: ${key}`,
                    },
                ],
            };
        } else if (name === "get") {
            const { key } = GetArgumentsSchema.parse(args);
            const response = await resdbClient.get(`/transactions/get/${key}`);
            if (response.status != 200) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error setting key: ${response.statusText}`,
                        },
                    ],
                }
            }
            const value = response?.data?.value
            if (value === null) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Key not found: ${key}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `${value}`,
                    },
                ],
            };
        }
        else {
            throw new Error(`Unknown tool: ${name}`);
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Invalid arguments: ${error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ")}`
            );
        }
        throw error;
    }
});

// Start the server
async function main() {
    try {
        // Set up MCP server
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("ResilientDB MCP Server running on stdio");
    } catch (error) {
        console.error("Error during startup:", error);

    }
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
});