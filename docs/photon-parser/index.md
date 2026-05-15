# Photon Parser

The `photon-parser` is a high-performance, zero-allocation Go library designed to decode the Photon network protocol. It is built to handle heavy UDP traffic for multiplayer games with extreme efficiency, making it ideal network analysis.

> [!IMPORTANT]
> **Scope of this Library:** This parser focuses **strictly on the UDP payload**. It does not capture packets from your network interface. You must use a packet capture library (such as [`gopacket`](https://github.com/google/gopacket)) to listen to network traffic, strip the Ethernet, IP, and UDP headers, and pass *only* the raw UDP payload byte slice to this parser.

## Performance & Core Philosophy

This library is engineered for the hot path. Parsing thousands of UDP packets per second can quickly exhaust the Go Garbage Collector. By utilizing buffer recycling and careful pointer arithmetic, `photon-parser` achieves **0 allocations on the hot path**.

### Protocol Feature Matrix

| Feature | Support | Note |
| :--- | :---: | :--- |
| **Photon v16 & v18** | ✅ | Fully supported. |
| **Reliable/Unreliable Commands** | ✅ | Handled. |
| **Fragmentation (Assembler)** | ✅ | Reassembly handled automatically. |
| **Encrypted Packets** | 🏗️ | In Development. |

> [!WARNING]
> **Thread Safety:** The parser instance is **not thread-safe**. To process packets across multiple goroutines concurrently, you must instantiate a separate parser per worker.


## The Assembler (Fragmentation Handling)

Because intense multiplayer game events (like massive player state syncs or map loading) can exceed the network's Maximum Transmission Unit (MTU), the Photon protocol fragments large commands across multiple UDP packets. 

The `photon-parser` includes a built-in **Assembler**. When it detects a fragmented command, the Assembler caches the sequence bytes. It waits until all fragments of a specific sequence arrive, reconstructs the original contiguous payload, and then forwards the complete command to your hooks.


## Configuration (Functional Options)

The parser is initialized using the functional options pattern, allowing you to configure exactly what you need without breaking the API, to focus on the core parsing logic and improve performance.

*   `SkipUnknownPayloads(bool)`: Some requests may contain unknown payload types. Set to `true` to skip payload extraction for these types.
*   `SkipParameterParsing(bool)`: If you only need to parse the command type and not the payload, or doing network debugging, set to `true` to skip parameter parsing.
*   `SkipCommands(...types.CommandType)`: If you're only interested in specific command types, use this to skip parsing of other commands.
*   `SkipTargetEventCodes(...types.Type)`: If you're only interested in specific target event codes, use this to skip parsing of other event codes.

