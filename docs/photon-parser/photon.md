# Photons

This section outlines the internal structure of the Photon protocol, detailing the commands, reliable message events, and the specific parameter serialization types for both [Version 16](https://doc-api.photonengine.com/en/dotnet/current/class_exit_games_1_1_client_1_1_photon_1_1_protocol16.html) and [Version 18](https://doc-api.photonengine.com/en/dotnet/current/class_exit_games_1_1_client_1_1_photon_1_1_protocol18.html#aac8d65d0832aab45197cbb30300119c7).

## Commands Types

Commands are the fundamental building blocks of the Photon network layer, handling connection state and data delivery.

| Command Type  | Note |
| :--- | :--- |
| **AcknowledgeCommand** | Receipt of reliable commands. |
| **ConnectCommand** | Initiates a connection. |
| **VerifyConnectCommand** | Verifies connection establishment. |
| **DisconnectCommand** | Gracefully closes a connection. |
| **PingCommand** | Keep-alive ping message. |
| **SendReliableCommand** | Sends reliable data (guaranteed delivery). |
| **SendUnreliableCommand** | Sends unreliable data (best effort). |
| **SendReliableFragmentCommand** | Sends a fragment of a large reliable message. |

---

## Events Types

These define the different kinds of reliable messages that can be exchanged once a connection is established.

| Event Type |  Description |
| :--- | :--- |
| **OperationRequest** | Client requests an operation. |
| **OtherOperationResponse** | Alternative response format. |
| **EventDataType** | Server sends an event to the client. |
| **ExchangeKeys** | Key exchange for encryption. |
| **OperationResponse** | Server responds to an operation. |

---

## Supported Parameters Types

The Photon protocol serializes parameters using specific type bytes. While the core primitives are fully handled, some complex or nested data structures are still in development. The serialization format changed significantly between Version 16 and Version 18.

### Version 16

Version 16 uses a straightforward mapping of types to specific hexadecimal bytes.

| Type Name | Supported | Description |
| :--- | :---: | :--- |
| **UnknownType** | ✅ | Unknown or unsupported type. |
| **NilType** | ✅ | Null/nil value. |
| **DictionaryType** | ✅ | Dictionary with fixed key/value types. |
| **StringArrayType** | ✅ | Array of strings. |
| **Int8Type** | ✅ | 8-bit signed integer. |
| **Custom** | 🏗️ | Custom serialized object. |
| **DoubleType** | ✅ | Alias for Float64Type. |
| **EventDateType** | 🏗️ | Event date/time. |
| **Float32Type** | ✅ | 32-bit floating point. |
| **Float64Type** | ✅ | 64-bit floating point. |
| **HashTableType** | ✅ | Hashtable with mixed key/value types. |
| **Int32Type** | ✅ | 32-bit signed integer. |
| **Int16Type** | ✅ | 16-bit signed integer. |
| **Int64Type** | ✅ | 64-bit signed integer. |
| **Int32ArrayType** | ✅ | Array of 32-bit integers. |
| **BooleanType** | ✅ | Boolean (`0x00`=false, `0x01`=true). |
| **OperationResponseType** | 🏗️ | Operation response message. |
| **OperationRequestType** | 🏗️ | Operation request message. |
| **StringType** | ✅ | UTF-8 string with uint16 length prefix. |
| **Int8ArrayType** | ✅ | Array of 8-bit integers. |
| **ArrayType** | ✅ | Generic typed array. |
| **ObjectArrayType** | 🏗️ | Array of serialized objects. |

---

### Version 18

Version 18 introduces a more complex and optimized serialization format, including compressed types, cast types, and zero-shorthands (where the type code itself represents the entire value).

#### Core & Compressed Types
| Type Name | Supported | Description |
| :--- | :---: | :--- |
| **UnknownType** | ✅ | Unknown type. |
| **BooleanType** | ✅ | Standard boolean. |
| **Int8Type** | ✅ | 8-bit integer. |
| **Int16Type** | ✅ | 16-bit integer. |
| **Float32Type** | ✅ | 32-bit floating point. |
| **Float64Type** | ✅ | 64-bit floating point. |
| **StringType** | ✅ | UTF-8 String. |
| **NilType** | ✅ | Null/nil value. |
| **CompressedInt32Type** | ✅ | Zigzag compressed 32-bit integer. |
| **CompressedInt64Type** | ✅ | Zigzag compressed 64-bit integer. |

#### Cast Types (Optimized Numbers)
| Type Name | Supported | Description |
| :--- | :---: | :--- |
| **Int8Positive** | ✅ | 1 byte unsigned, cast to +int32. |
| **Int8Negative** | ✅ | 1 byte unsigned, cast to -int32. |
| **Int16Positive** | ✅ | 2 bytes unsigned, cast to +int32.|
| **Int16Negative** | ✅ | 2 bytes unsigned, cast to -int32.|
| **Long8Positive** | ✅ | 1 byte unsigned, cast to +int64. |
| **Long8Negative** | ✅ | 1 byte unsigned, cast to -int64. |
| **Long16Positive** | ✅ | 2 bytes unsigned, cast to +int64. |
| **Long16Negative** | ✅ | 2 bytes unsigned, cast to -int64. |

#### Complex & Custom Types
| Type Name | Supported | Description |
| :--- | :---: | :--- |
| **CustomType** | 🏗️ | Custom serialized object. |
| **CustomTypeSlim** | 🏗️ | Slim custom object. |
| **DictionaryType** | ✅ | Typed dictionary. |
| **HashtableType** | ✅ | Mixed type hashtable. |
| **ObjectArrayType** | 🏗️ | Array of objects. |
| **OperationRequestType** | 🏗️ | Request payload. |
| **OperationResponseType** | 🏗️ | Response payload. |
| **EventDataType** | 🏗️ | Event payload. |

#### Zero Shorthands
These types have no payload bytes; the type code itself dictates the value (e.g., `0`, `false`, `true`).

| Type Name | Supported | Note |
| :--- | :---: | :--- |
| **BooleanFalseType** | ✅ | Represents `false`. |
| **BooleanTrueType** | ✅ | Represents `true`. |
| **ShortZeroType** | ✅ | Represents `int16(0)`. |
| **IntZeroType** | ✅ | Represents `int32(0)`. |
| **LongZeroType** | ✅ | Represents `int64(0)`. |
| **FloatZeroType** | ✅ | Represents `float32(0)`. |
| **DoubleZeroType** | ✅ | Represents `float64(0)`. |
| **ByteZeroType** | ✅ | Represents `byte(0)`. |

#### Arrays
In Version 18, array elements are baked directly into the type code using a bitwise OR operation (`ElementType | ArrayType`).

| Type Name | Supported Version | Formula |
| :--- | :---: | :--- |
| **ArrayType** (Container) | v18 | Base Array Container |
| **BooleanArrayType** | v18 | `BooleanType \| ArrayType` |
| **ByteArrayType** | v18 | `Int8Type \| ArrayType` |
| **ShortArrayType** | v18 | `Int16Type \| ArrayType` |
| **Float32ArrayType** | v18 | `Float32Type \| ArrayType` |
| **Float64ArrayType** | v18 | `Float64Type \| ArrayType` |
| **StringArrayType** | v18 | `StringType \| ArrayType` |
| **CompressedIntArrayType** | v18 | `CompressedInt32Type \| ArrayType` |
| **CompressedLongArrayType** | v18 | `CompressedInt64Type \| ArrayType` |
| **CustomTypeArrayType** | v18 | `CustomType \| ArrayType` |
| **DictionaryArrayType** | v18 | `DictionaryType \| ArrayType` |
| **HashtableArrayType** | v18 | `HashtableType \| ArrayType` |
