---
outline: deep
---

# Usage Examples

## Installation

Before you start, you need to install the photon-parser library.

```bash
go get github.com/AutoDruid/photon-parser
```

If you need more details about the library, you can check the godoc TODO.

## Parsing

Here is a full example using [`gopacket`](https://github.com/google/gopacket) as network sniffer. Go packet might need to sudo to run.

```go{34,36,53}

package main

import (
	"encoding/json"
	"log"
	"os"

	photon "github.com/AutoDruid/photon-parser"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
)

const (
	device  = "your-network-interface"
	port    = 0000 // your game server port
	snaplen = 65535 // maximum packet size
	promisc = false
)

func main() {

	handle, err := pcap.OpenLive(device, snaplen, promisc, pcap.BlockForever)
	if err != nil {
		log.Fatal("error opening pcap: ", err)
	}
	defer handle.Close()

	if err := handle.SetBPFFilter("your network filter"); err != nil {
		log.Fatal("error setting bpf filter: ", err)
	}

	parser := photon.NewParserV18()

	var session photon.SessionV18

	src := gopacket.NewPacketSource(handle, handle.LinkType())

	log.Println("Listening for game server traffic...")

	for packet := range src.Packets() {
		udp, ok := packet.TransportLayer().(*layers.UDP)
		if !ok {
			continue
		}

		// only care about game server traffic, ignore client→server if needed
		if int(udp.SrcPort) != port && int(udp.DstPort) != port {
			continue
		}

		if err := parser.ParsePacketInto(udp.Payload, &session); err != nil {
			log.Printf("parse error: %v", err)
			continue
		}

		// do something with the session
        log.Printf("Session: %+v\n", session)
	}
}

```

::: info
For the following examples, we use the raw UDP payload instead of `gopacket` to improve comprehension and readability. Every method used with version 18 is the same as version 16.
:::

::: details Example payload

```go
payload := []byte{0x79, 0x9e, 0x0, 0x1, 0x0, 0x0, 0x15, 0x5c, 0x7c, 0x11, 0x66, 0xbd, 0x6, 0x0, 0x1, 0x4, 0x0, 0x0, 0x0, 0x41, 0x0, 0x0, 0x0, 0x1b, 0xf3, 0x2, 0x1, 0x6, 0x0, 0xa, 0xca, 0xd0, 0xa2, 0xb9, 0xa1, 0xf5, 0xce, 0xde, 0x11, 0x1, 0x45, 0x2, 0xbb, 0x8c, 0x7f, 0xc2, 0x60, 0xf3, 0xb6, 0xc3, 0x2, 0x5, 0xab, 0x77, 0xa2, 0x42, 0x3, 0x45, 0x2, 0x52, 0xfc, 0x70, 0xc2, 0x82, 0xab, 0xb6, 0xc3, 0x4, 0x5, 0xd7, 0xa3, 0x32, 0x41, 0xfd, 0x4, 0x16, 0x0}
```

:::

### One-Shot

`ParsePacketV18` is a one-shot method that parses the entire payload at once. It is ideal for simple scripts or low-traffic debugging.

```go
package main

func main() {

    payload := // your payload here

	session, err := photon.ParsePacketV18(payload)
	if err != nil {
		log.Fatal("error parsing packet: ", err)
	}
}
```

### Continuous

During sniffing network, you will be receiving thousands of packets. To maintain 0 allocations and avoid GC pressure, use the `ParsePacketInto` method.

```go
package main

func main() {

    parser := photon.NewParserV18()

    var session photon.SessionV18

    payload := // your payload here

	if err := parser.ParsePacketInto(payload, &session); err != nil {
		log.Fatal("error parsing packet: ", err)
	}
}
```

## The Data Model

When you parse a payload, the library constructs a hierarchical representation of the network data. Understanding this structure is key to extracting the information you need.

A UDP payload deserializes into a `Session`, which contains a list of `Commands`. If a command is reliable and contains game events, it will hold `Reliable` data, which in turn holds `Parameters`.

```markdown
SessionV18
 └── Commands ([]CommandV18)
      ├── CommandType (e.g., SendReliable, Ping)
      ├── ChannelID
      └── ReliableMessage (If applicable)
           ├── EventCode / OperationCode
           └── Parameters ([]Parameter)
                ├── Key   (byte)
                ├── Type  (Photon Type Enum)
                └── Value (Value struct)
```

### Extracting Parameter Data

Because the Photon protocol supports dynamic types, the `Value` field of a `ParameterV18` is stored as informational struct that help the lazy reading of the data without causing panics.

```go
type Value struct {
	Kind    ParameterType `json:"kind"`
	KeyType ParameterType `json:"key_type"`
	ValType ParameterType `json:"val_type"`
	_       [5]byte       `json:"-"`
	Num     uint64        `json:"num"`
	Blob    []byte        `json:"blob,omitempty"`
}
```

When handling an event hook, you look up the parameter by its byte key and use the appropriate accessor to read its value safely.

```go
parser.OnEventData(func(rel photon.ReliableV18) {

    // Example: Reading a Player ID (Integer) from parameter key 252
    param := rel.Parameters[252]
    if playerID, ok := param.IntValue(); ok {
        log.Printf("Received Player ID: %d", playerID)
    } else {
        log.Printf("Parameter 252 was not an integer type. Got kind: %d", param.Kind)
    }

    // Example: Reading a Player Name (String) from parameter key 253
    param = rel.Parameters[253]
    if playerName, ok := param.StringValue(); ok {
        log.Printf("Received Player Name: %s", playerName)
    }

})
```

## Hooks

Hooks let you react to parsed Photon data **during** `ParsePacket` / `ParsePacketInto`, without walking the full session tree yourself.

| Family               | Sync API                                                                               | Async API                                              |
| :------------------- | :------------------------------------------------------------------------------------- | :----------------------------------------------------- |
| **Global resources** | `OnSessionSync`, `OnCommandSync`, `OnParameterSync`                                    | `OnSessionAsync`, `OnCommandAsync`, `OnParameterAsync` |
| **Reliable events**  | `OnEventData`, `OnOperationRequest`, `OnOperationResponse`, `OnOtherOperationResponse` | 🏗️|

Reliable-event hooks fire when a **reliable message** of that type is decoded (after fragmentation reassembly, if applicable). Resource hooks fire as the parser builds the session: once per packet for the session, once per top-level command, and once per decoded parameter.

### Reliable event hooks (synchronous)

These callbacks run **inside** `ParsePacket` when the corresponding reliable message type is decoded. Use them to filter by event code, operation code, or to handle game events without scanning every command manually.

```go
parser := photon.NewParserV18()

parser.OnEventData(func(rel photon.ReliableV18) {
    // rel carries event/operation metadata and parsed parameters
    log.Printf("event code: %d", rel.EventCode)
})

parser.OnOperationResponse(func(rel photon.ReliableV18) {
    // handle operation responses
    log.Printf("event code: %d", rel.EventCode)
})

parser.OnOperationRequest(func(rel photon.ReliableV18) {
    // handle operation requests
    log.Printf("operation code: %d", rel.EventCode)
})

parser.OnOtherOperationResponse(func(rel photon.ReliableV18) {
	// handle other operation responses
	log.Printf("other code: %d", rel.EventCode)
})

var session photon.SessionV18
if err := parser.ParsePacketInto(payload, &session); err != nil {
	log.Fatal("error parsing packet: ", err)
}
```

> [!WARNING]
> Reliable-event callbacks run on the same goroutine as `ParsePacketInto`. Blocking work (DB, HTTP, heavy JSON) will stall the sniffer and can cause packet drops.

### Global resource hooks (synchronous)

These hooks expose the parsed session model as it is built:

- OnSessionSync called once per ParsePacket after the session for that UDP payload has been parsed.
- OnCommandSync called for each top-level command in that packet.
- OnParameterSync called for each decoded parameter (when parameter parsing is enabled).

```go
parser := photon.NewParserV18()

parser.OnSessionSync(func(s photon.SessionV18) {
    // full session snapshot for this packet
})

parser.OnCommandSync(func(cmd photon.CommandV18) {
    // each command (SendReliable, Ping, etc.)
})

parser.OnParameterSync(func(p photon.ParameterV18) {
    // each parameter on reliable payloads
})

var session photon.SessionV18
_ = parser.ParsePacketInto(payload, &session)

```

Use sync resource hooks for lightweight work: metrics, filtering command types, building a small in-memory index.

### Global resource hooks (asynchronous)

Async hooks push session, command, or parameter values to receive-only Go channels. The parser does not wait for your consumer; parsing continues and sends on the channel (blocking only if the buffer is full).

```go
parser := photon.NewParserV18()
defer parser.Close() // required: closes async hook channels

cmdCh := parser.OnCommandAsync(types.HookOptions{Size: 1024})

go func() {
    for cmd := range cmdCh {
        // heavy work: deserialize, DB, etc.
        process(cmd)
    }
}()

var session photon.SessionV18
for {
    payload := nextUDP()
    _ = parser.ParsePacketInto(payload, &session)
}
```

`HookOptions.Size` sets the channel buffer capacity. A larger buffer absorbs bursts, a full buffer blocks `ParsePacketInto` until something is received.

`Close()` shuts down channels created by OnSessionAsync, OnCommandAsync, and OnParameterAsync. Always call it when you are done (e.g. `defer parser.Close()` on shutdown) so goroutines reading from those channels can exit cleanly.

> [!INFO]
> Type names in examples use V18 (ReliableV18, SessionV18, …). For protocol 16, use NewParserV16 and the corresponding \*V16 types; hook registration is identical.

## Configuration (Functional Options)

The parser is initialized using the functional options pattern, allowing you to configure exactly what you need without breaking the API, to focus on the core parsing logic and improve performance.

- `SkipUnknownPayloads(bool)`: Some requests may contain unknown payload types. Set to `true` to skip payload extraction for these types.
- `SkipParameterParsing(bool)`: If you only need to parse the command type and not the payload, or doing network debugging, set to `true` to skip parameter parsing.
- `SkipCommands(...types.CommandType)`: If you're only interested in specific command types, use this to skip parsing of other commands.
- `SkipTargetEventCodes(...types.Type)`: If you're only interested in specific target event codes, use this to skip parsing of other event codes.

```go
parser := photon.NewParserV18(
	photon.SkipUnknownPayloads(true),
	photon.SkipParameterParsing(true),
	photon.SkipCommands(types.CommandTypePing),
	photon.SkipTargetEventCodes(types.EventTypeGameState),
)
```

> [!TIP]
> Combine async hooks with functional options such as SkipCommands or SkipParameterParsing to reduce channel traffic when you only care about a subset of the protocol.
