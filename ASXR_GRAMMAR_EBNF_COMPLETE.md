# ASX-R Language Grammar — Complete Specification (v3.0)

**Document:** `ASXR_GRAMMAR_EBNF_COMPLETE.md`  
**Status:** 🔒 **CANONICAL / LOCKED**  
**Authority:** ASX-R Runtime Language

---

## 1. Document Structure with `---` Notation

### 1.1 Multi-Section Document
```ebnf
asxr_document    = { section } EOF ;
section          = section_separator, section_header, newline, section_body ;
section_separator= "---", newline ;
section_header   = "@", section_type, [ identifier ], [ attributes ] ;
section_type     = "schema" | "state" | "propose" | "tokenizer"
                 | "protocol" | "projection" | "config" ;
section_body     = { block | directive | data } ;
```

### 1.2 Binary Document Detection
```ebnf
binary_preamble  = utf8_bom, "@" ;
utf8_bom         = x'EF', x'BB', x'BF' ;  (* Optional UTF-8 BOM *)
```

---

## 2. Core Language Grammar

### 2.1 Atomic Block Definition
```ebnf
atomic_block     = "@", block_type, [ block_id ], block_body ;
block_type       = identifier ;
block_id         = "[", identifier, "]" ;
block_body       = "{", newline, { property_line }, "}", newline ;
property_line    = property_name, ":", value, [ ";" ], newline ;
property_name    = identifier | "@", identifier ;
```

### 2.2 Values and Expressions
```ebnf
value           = literal | reference | expression | embedded_json ;
literal         = string_literal | number_literal
                | boolean_literal | null_literal | unicode_literal ;

string_literal  = '"', { character - ('"' | '\\') | escape_sequence }, '"'
                | "'", { character - "'" }, "'" ;
escape_sequence = "\\", ( '"' | "'" | "\\" | "/" | "b" | "f" | "n" | "r" | "t"
                | "u", hex_digit, hex_digit, hex_digit, hex_digit ) ;

unicode_literal = "U+", hex_digit, hex_digit, hex_digit, hex_digit
                [ "-", hex_digit, hex_digit, hex_digit, hex_digit ] ;

reference       = "{{", path_expression, "}}" ;
path_expression = ( identifier | "@", identifier ),
                  { ".", ( identifier | "@", identifier ) } ;

expression      = arithmetic_expr | logical_expr | comparison_expr ;
```

---

## 3. Protocol and Serialization Grammar

### 3.1 Dual JSON/CBOR Support
```ebnf
serialization   = json_serialization | cbor_serialization ;

json_serialization = json_object | json_array ;
json_object     = "{", [ json_pair, { ",", json_pair } ], "}" ;
json_pair       = json_string, ":", json_value ;

cbor_serialization = cbor_header, cbor_data ;
cbor_header     = x'A2', x'63', x'40', x'41', x'42' ;  (* "@AB" map *)
cbor_data       = { cbor_item } ;
```

### 3.2 Message Framing
```ebnf
framed_message  = text_frame | binary_frame ;
text_frame      = stx, text_content, etx ;
binary_frame    = binary_header, length, body ;

stx             = x'02' ;  (* ASCII STX *)
etx             = x'03' ;  (* ASCII ETX *)

binary_header   = "ASXR", version_byte, type_byte ;
version_byte    = x'01' ;  (* Version 1 *)
type_byte       = x'01'    (* 0x01 = state *)
                | x'02'    (* 0x02 = proposal *)
                | x'03' ;  (* 0x03 = projection *)
length          = 2_bytes_big_endian ;  (* 0-65535 *)
body            = { byte } ;            (* CBOR encoded *)
```

---

## 4. State Transition Grammar

### 4.1 State Proposal
```ebnf
state_proposal  = "@propose", "{", newline,
                  "prior_hash:", hash_value, ",", newline,
                  "constraints:", "[", constraint_list, "]", ",", newline,
                  "next_state:", state_definition,
                  "}", newline ;

constraint_list = constraint, { ",", constraint } ;
constraint      = "@", identifier, [ "(", arguments, ")" ] ;

state_definition= "{", newline,
                  "phase:", phase_name, ",", newline,
                  "epoch:", integer, ",", newline,
                  "blocks:", "[", block_list, "]",
                  "}", newline ;

phase_name      = "genesis" | "initialization" | "execution"
                | "compression" | "projection" | "serving" ;
```

### 4.2 Hash and Identity
```ebnf
hash_value      = algorithm, ":", hex_string ;
algorithm       = "sha256" | "sha3-256" | "blake2s" ;
hex_string      = hex_digit, { hex_digit } ;
hex_digit       = digit | "A" | "B" | "C" | "D" | "E" | "F"
                | "a" | "b" | "c" | "d" | "e" | "f" ;
```

---

## 5. Projection and Display Grammar

### 5.1 ANSI Control Sequences (ECMA-48 subset)
```ebnf
ansi_sequence   = ansi_sgr | ansi_ed | ansi_cup | ansi_hide ;
ansi_sgr        = esc, "[", sgr_params, "m" ;
sgr_params      = sgr_param, { ";", sgr_param } ;
sgr_param       = "0" | "1" | "32" | "33" | "34" | "40" | "41" | "44" ;
ansi_ed         = esc, "[2J" ;      (* Clear screen *)
ansi_cup        = esc, "[H" ;       (* Cursor home *)
ansi_hide       = esc, "[?25l" ;    (* Hide cursor *)
ansi_show       = esc, "[?25h" ;    (* Show cursor *)
esc             = x'1B' ;           (* Escape character *)
```

### 5.2 Unicode Block Elements
```ebnf
box_drawing     = "┌" | "─" | "┬" | "┐" | "│" | "└" | "┴" | "┘"
                | "├" | "┼" | "┤" | "╭" | "╮" | "╰" | "╯" ;
shade_blocks    = "█" | "▓" | "▒" | "░" ;
arrows          = "◀" | "▶" | "▲" | "▼" | "⬅" | "➡" | "⬆" | "⬇" ;
color_squares   = "🟥" | "🟧" | "🟨" | "🟩" | "🟦" | "🟪" | "⬛" | "⬜" ;
```

### 5.3 Projection Definition
```ebnf
projection_def  = "@projection", identifier, "{", newline,
                  "target:", projection_target, ",", newline,
                  "content:", projection_content,
                  "}", newline ;

projection_target = "ansi" | "html" | "svg" | "dom" | "curses" | "tui" ;
projection_content= ansi_content | json_content | binary_content ;
```

---

## 6. Shell and Tokenizer Grammar

### 6.1 Shell Command Inference
```ebnf
shell_command   = shell_prefix, command_content ;
shell_prefix    = "bash:" | "dom:" | "quake:" | "sql:"
                | "python:" | "xjson:", newline ;
command_content = { character - newline }, newline ;

xjson_command   = "@", identifier, [ command_args ] ;
command_args    = "{", newline, { arg_line }, "}", newline ;
arg_line        = identifier, ":", value, [ ";" ], newline ;
```

### 6.2 Tokenizer Plugin Definition
```ebnf
tokenizer_def   = "@tokenizer", identifier, "{", newline,
                  "patterns:", "[", pattern_list, "]", ",", newline,
                  "priority:", integer, ",", newline,
                  "handler:", block_reference,
                  "}", newline ;

pattern_list    = pattern, { ",", pattern } ;
pattern         = "{", newline,
                  "match:", regex_literal, ",", newline,
                  "transform:", block_reference,
                  "}", newline ;
```

---

## 7. Server Call Functions and Binary Triggers

### 7.1 Explicit Server Call Function
```ebnf
server_call       = "@call", call_id, [ call_modifiers ], "(",
                    [ arguments ], ")", [ "->", return_handler ], ";" ;

call_id           = endpoint_url | function_reference ;
endpoint_url      = protocol, "://", host, [ path ] ;
function_reference = "#", identifier ;

call_modifiers    = "[", modifier, { ",", modifier }, "]" ;
modifier          = "async" | "stream" | "atomic" | "cache"
                  | "retry", [ ":", integer ]
                  | "background" | "batch", [ ":", string_literal ]
                  | "priority", [ ":", string_literal ]
                  | "timeout", [ ":", string_literal ]
                  | "pool", [ ":", string_literal ] ;

arguments         = named_arg, { ",", named_arg } ;
named_arg         = identifier, ":", value ;

return_handler    = block_reference | lambda_expr ;
lambda_expr       = "(", [ parameters ], ")", "=>", block_body ;
```

### 7.2 Binary Trigger Grammar
```ebnf
binary_trigger    = "@on", trigger_source, [ trigger_filter ],
                    "{", trigger_body, "}" ;
trigger_source    = "udp" | "dns" | "mqtt" | "raw-tcp" | "websocket-frame"
                  | "dom-event" | "intersection" | "raf" | "timer" ;
trigger_filter    = [ identifier, [ "=", string_literal ] ] ;
trigger_body      = { binary_pattern | server_call | statement } ;

binary_pattern    = "{",
                    "match:", match_spec, ",",
                    "action:", server_call,
                    "}" ;
match_spec        = hex_pattern | regex_binary | match_object ;
hex_pattern       = "hex:", hex_string ;
regex_binary      = "regex:", string_literal ;
match_object      = "{", [ match_pair, { ",", match_pair } ], "}" ;
match_pair        = identifier, ":", value ;
```

---

## 8. Reactor, Pooling, and Routing Constructs

```ebnf
reactor_block     = "@reactor", identifier, "{", reactor_body, "}" ;
reactor_body      = { binary_trigger | timer_block | statement } ;

timer_block       = "@every", string_literal, "{", block_body, "}" ;

call_pool         = "@call-pool", identifier, "{",
                    "endpoints:", "[", endpoint_url, { ",", endpoint_url }, "]", ",",
                    "strategy:", string_literal, ",",
                    "health-check:", string_literal, ",",
                    "failover:", string_literal, ",",
                    { server_call },
                    "}" ;

protocol_bridge   = "@protocol-bridge", identifier, "{",
                    "source:", endpoint_url, ",",
                    "protocol:", string_literal, ",",
                    { message_def },
                    "}" ;
message_def       = "@message", string_literal, "{",
                    "pattern:", match_spec, ",",
                    "parse:", block_reference, ",",
                    "action:", server_call,
                    "}" ;

websocket_router  = "@websocket-router", identifier, "{",
                    "endpoint:", endpoint_url, ",",
                    { route_def | timer_block },
                    "}" ;
route_def         = "@route", route_selector, "{",
                    "action:", server_call,
                    "}" ;
route_selector    = identifier, "=", ( integer | hex_string | string_literal ) ;

event_bus         = "@event-bus", identifier, "{",
                    { subscription_def | middleware_def },
                    "}" ;
subscription_def  = "@subscribe", string_literal, "{",
                    "action:", server_call,
                    "}" ;
middleware_def    = "@middleware", block_reference ;

state_machine     = "@state-machine", identifier, "{",
                    "initial:", string_literal, ",",
                    { state_def },
                    "}" ;
state_def         = "@state", string_literal, "{",
                    { state_event | timer_block },
                    "}" ;
state_event       = "@on", identifier, "{",
                    "action:", server_call,
                    "}" ;
```

---

## 9. Schema Definition Grammar

### 9.1 Type System
```ebnf
type_def        = "@type", identifier, "{", newline,
                  "base:", base_type, ",", newline,
                  "constraints:", "[", constraint_list, "]",
                  "}", newline ;

base_type       = "string" | "integer" | "float" | "boolean"
                | "block" | "array" | "map" | "any" ;
```

### 9.2 Property Schema
```ebnf
property_schema = identifier, ":", type_spec, [ constraints ] ;
type_spec       = base_type
                | "[", base_type, "]"                    (* Array *)
                | "{", string_type, ":", base_type, "}"  (* Map *)
                | identifier ;                           (* Custom type *)

constraints     = "@min", "(", integer, ")"
                | "@max", "(", integer, ")"
                | "@pattern", "(", regex_literal, ")"
                | "@enum", "(", value_list, ")" ;
```

---

## 10. Protocol Configuration

### 10.1 Transport Protocol
```ebnf
protocol_def    = "@protocol", identifier, "{", newline,
                  "transport:", transport_type, ",", newline,
                  "framing:", framing_type, ",", newline,
                  "serialization:", "[", serialization_list, "]",
                  "}", newline ;

transport_type  = "http" | "websocket" | "tcp" | "udp" | "serial" ;
framing_type    = "http" | "stxetx" | "binary" | "newline" ;
serialization_list = serialization_type, { ",", serialization_type } ;
serialization_type = "json" | "cbor" | "messagepack" ;
```

### 10.2 MIME Type Declarations
```ebnf
mime_declaration = "@mime", "{", newline,
                   "type:", mime_type, ",", newline,
                   "subtype:", mime_subtype, ",", newline,
                   "parameters:", mime_params,
                   "}", newline ;

mime_type       = "application" | "text" ;
mime_subtype    = "asxr" | "asxr+json" | "asxr+cbor" ;
mime_params     = "{", newline,
                  "version:", string_literal, ",", newline,
                  "profile:", [ "tiny" | "full" ], newline,
                  "}", newline ;
```

---

## 11. Microcontroller Optimized Variants

### 11.1 ASX-R Tiny Dialect (for <2KB RAM)
```ebnf
tiny_document   = { tiny_line } ;
tiny_line       = tiny_directive | tiny_block ;

tiny_directive  = "@", tiny_cmd, ":", tiny_value, newline ;
tiny_cmd        = "B" | "S" | "P" ;  (* Block, State, Proposal *)
tiny_value      = identifier, [ "=", tiny_atom ] ;

tiny_block      = "@", identifier, "{", { tiny_prop }, "}", newline ;
tiny_prop       = identifier, "=", tiny_atom, newline ;
tiny_atom       = integer | string_simple | "true" | "false" | "null" ;
string_simple   = '"', { character - '"' }, '"' ;
```

### 11.2 Binary Tiny Protocol
```ebnf
binary_tiny     = header_tiny, { block_tiny } ;
header_tiny     = x'41', x'54' ;  (* "AT" = ASX-R Tiny *)
block_tiny      = type_byte_tiny, length_byte_tiny, { data_byte } ;

type_byte_tiny  = x'42'  (* 0x42 = Block *)
                | x'53'  (* 0x53 = State *)
                | x'50' ; (* 0x50 = Proposal *)

length_byte_tiny= byte ;  (* 0-255 bytes *)
```

---

## 12. Complete Example Document

```yaml
---
@protocol main
transport: http
framing: http
serialization: [json, cbor]
---
@schema atomic_block
type: object
properties:
  id: string @pattern("^block_[a-z0-9_]+$")
  type: string @enum([container, region, entity, system])
  role: string @nullable
required: [id, type]
---
@state runtime_active
phase: serving
epoch: 42
blocks:
  - @block system_core
    id: block_system_1
    type: system
    role: runtime
    version: "3.0"
---
@propose
prior_hash: sha256:abc123...
constraints: [@law_invariant, @phase_rule(serving)]
next_state:
  phase: serving
  epoch: 43
  blocks:
    - @block user_session
      id: block_session_alice
      type: entity
      properties:
        user: "alice"
        active: true
---
@projection status_ansi
target: ansi
content: "\033[1;32m✓ State transition accepted\033[0m
Epoch: 43"
```

---

## 13. Terminal Symbols (Complete Set)

```ebnf
newline         = CR LF | LF | CR ;
character       = ? any Unicode code point except control characters ? ;
control_char    = ? C0 control codes (0x00-0x1F) except TAB, LF, CR ? ;
digit           = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
letter          = "A" | "B" | ... | "Z" | "a" | "b" | ... | "z" ;
identifier      = letter, { letter | digit | "_" | "-" } ;
integer         = [ "-" ], digit, { digit } ;
float           = integer, ".", digit, { digit }
                | integer, ( "e" | "E" ), [ "+" | "-" ], digit, { digit } ;
boolean_literal = "true" | "false" ;
null_literal    = "null" ;
byte            = ? any 8-bit value (0x00-0xFF) ? ;
protocol        = identifier ;
host            = identifier, { ".", identifier } ;
path            = "/", { character - " " } ;
```

---

## 14. Grammar Consistency Rules

1. **Closed World Parsing**: All identifiers must be resolvable within the document or built-in set
2. **Deterministic Phases**: Sections must appear in logical order (schema → state → propose)
3. **Frame Safety**: Binary frames must declare length before content
4. **Encoding Consistency**: Unicode text must be valid UTF-8
5. **Micro Compatibility**: Tiny dialect must be convertible to full dialect without data loss

---

## 15. Compliance Levels

| Level | Required Features | Target Platform |
| --- | --- | --- |
| **Full** | All grammar features | Servers, Browsers |
| **Lite** | JSON only, no CBOR | Mobile, Embedded Linux |
| **Tiny** | Tiny dialect only | Microcontrollers (<64KB RAM) |
| **Gateway** | Full + Tiny translation | Protocol converters |

---

## 16. Control Plane ASCII (Pre-Semantic Layer)

### 16.1 Control Operators
```ebnf
control_operator  = ascii_control | unicode_control | whitespace_semantic ;
ascii_control     = x'00'..x'1F' | x'7F' ;
unicode_control   = u200B..u206F ;
whitespace_semantic = space_tab_newline | zero_width ;

space_tab_newline = " " | "\t" | "\n" | "\r" ;
zero_width        = u200B | u200C | u200D | uFEFF ;
```

### 16.2 Control Plane Assignments
```ebnf
control_plane_block = "@control-plane", "{", { control_operator_def }, "}" ;
control_operator_def = "@operator", control_name, "(", control_literal, ")",
                       "=", control_semantics, ";" ;
control_name      = identifier ;
control_literal   = string_literal ;
control_semantics = identifier | control_semantics, "|", identifier ;
```

### 16.3 Pre-Semantic Control Layer
```ebnf
pre_semantic_layer = "raw_bytes", "→", "control_parsing", "→", "interpretation" ;

control_parsing    = "{",
                     "phase:", phase_operator, ",",
                     "context:", context_stack, ",",
                     "mode:", grammar_mode, ",",
                     "flow:", flow_directives,
                     "}" ;

phase_operator     = "NUL" | "SOH" | "STX" | "ETX" | "EOT" ;
context_stack      = "[", context, { ",", context }, "]" ;
context            = identifier ;
grammar_mode       = "text" | "binary" | "escape" | "literal" ;
flow_directives    = "{",
                     "can-collapse:", boolean_literal, ",",
                     "can-escape:", boolean_literal, ",",
                     "can-nest:", boolean_literal,
                     "}" ;
```

### 16.4 Control Scan Pipeline
```ebnf
control_scan_block = "@control-scan", "{",
                     "extract:", control_ranges, ",",
                     "graph:", control_graph,
                     "}" ;
control_ranges     = string_literal ;
control_graph      = "{",
                     "nodes:", identifier, ",",
                     "edges:", identifier, ",",
                     "metadata:", identifier,
                     "}" ;
```

---

### ✅ ASXR_GRAMMAR_EBNF_COMPLETE.md — UPDATED & LOCKED

This grammar now includes:
1. **`---` section notation** for clear separation
2. **Dual JSON/CBOR serialization** with STX/ETX framing
3. **ANSI/Unicode controls** for projections
4. **Microcontroller-optimized "Tiny" dialect**
5. **Complete protocol definitions** with MIME types
6. **Shell command syntax** for inference layer
7. **Server call functions and binary triggers** for real-time routing

The grammar maintains backward compatibility while enabling everything from 8-bit microcontrollers to cloud servers.
