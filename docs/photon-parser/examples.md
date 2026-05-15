# Usage Examples

## Parsing

### One-Shot

Ideal for simple scripts or low-traffic debugging. In this example, we assume `payload` is the byte slice extracted after `gopacket` strips the UDP headers.

```go
package main

import (
    "log"
    "[github.com/autodruid/photon-parser](https://github.com/autodruid/photon-parser)"
)

func main() {
    // Initialize parser with options
    p := photon.NewParser(
        photon.WithVerifyChecksum(true),
    )

    // Example payload (from gopacket UDP layer)
    var udpPayload []byte = getUDPPayloadFromNetwork()

    err := p.Parse(udpPayload)
    if err != nil {
    }
}
```

### Continuous

During sniffing network, you will be receiving thousands of packets. To maintain 0 allocations and avoid GC pressure, use the `ParsePacketInto` method.

## Hooks 

Once a command is successfully parsed (and reassembled, if necessary), the parser passes the data to registered callbacks known as Hooks. You can implement these synchronously or asynchronously.

### Synchronous

Synchronous hooks are executed sequentially inside the Parse() loop. Use for: Lightweight tasks like filtering event IDs, incrementing metrics, or updating a fast in-memory state.

> [!WARNING]
> Blocking here will block the network listener and cause packet drops.

### Asynchronous

Pushes the parsed command to a Go channel or a background worker pool. Use for: Heavy logic, such as passing the payload to deserializing complex JSON/Binary structures, or writing to a database. Keep the hot path clean!