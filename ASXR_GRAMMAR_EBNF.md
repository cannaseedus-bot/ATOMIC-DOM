# ASX-R Language Grammar — Formal Specification (v2.0)

**Document:** `ASXR_GRAMMAR_EBNF.md`
**Status:** 🔒 **CANONICAL / LOCKED**
**Authority:** ASX-R Runtime Language
**Scope:** Formal syntactic and structural definition

## 1. Core Runtime Language EBNF

### 1.1 Atomic Block Structure

```ebnf
atomic_block         = "@atomic", [ block_id ], "{", block_body, "}"
                     | "@", block_type, [ block_id ], "{", block_body, "}" ;
block_type           = qualified_identifier | quoted_string ;
block_id             = "[", identifier, "]" ;
block_body           = { property_assignment | statement | expression | nested_block } ;
property_assignment  = property_name, ":", value, ";" ;
property_name        = qualified_identifier | "@", qualified_identifier ;
value                = literal | reference | expression ;
nested_block         = atomic_block ;
```

### 1.2 State Transition Grammar

```ebnf
state_proposal   = "@propose", "{", "prior:", state_hash, ",",
                   "next:", state_definition, ",",
                   "constraints:", "[", constraint, { ",", constraint }, "]",
                   "}" ;
state_definition = "{", "blocks:", "[", atomic_block, { ",", atomic_block }, "]",
                   ",", "phase:", phase_name, ",",
                   "epoch:", integer, "}" ;
constraint       = law_constraint | phase_constraint | schema_constraint ;
```

### 1.3 Shell Inference Grammar

```ebnf
shell_command    = command_type, [ command_target ], [ command_args ] ;
command_type     = "@", identifier ;
command_target   = path_expression | block_reference ;
command_args     = "{", [ named_arg, { ",", named_arg } ], "}" ;
named_arg        = identifier, ":", value ;

path_expression  = ( identifier | "@", identifier ),
                   { ".", ( identifier | "@", identifier ) } ;
block_reference  = "#", identifier ;
```

## 2. Plugin-Based Syntax Extensions

### 2.1 Core Program Shape (Minimal)

```ebnf
program              = { block | statement | plugin_directive
                       | plugin_section | conflict_resolution
                       | transform_directive } ;
block                = atomic_block | dom_block | component_def ;
dom_block            = dom_atomic_block ;
component_def        = "@component", identifier, "{", component_body, "}" ;
component_body       = block_body ;
```

### 2.2 Plugin Directives and Declarations

```ebnf
plugin_directive     = "@use", "plugin", plugin_name,
                       [ "from", string_literal ],
                       [ "with", plugin_config ], ";" ;
plugin_name          = identifier | namespace_path ;
namespace_path       = identifier, { "/", identifier } ;
plugin_config        = "{", [ config_pair, { ",", config_pair } ], "}" ;
config_pair          = identifier, ":", value ;

plugin_decl          = "@plugin", plugin_name, "{",
                       "version:", string_literal, ",",
                       "syntax:", "[", syntax_rule, { ",", syntax_rule }, "]",
                       "handlers:", "[", handler_ref, { ",", handler_ref }, "]",
                       [ "conflicts:", "[", plugin_name, { ",", plugin_name }, "]" ],
                       "}" ;
syntax_rule          = "{",
                       "pattern:", regex_literal, ",",
                       "ast_node:", identifier, ",",
                       "priority:", integer,
                       "}" ;
```

### 2.3 Plugin Loading, Resolution, and Conflicts

```ebnf
plugin_section       = "@plugins", "{", plugin_load, { ",", plugin_load }, "}" ;
plugin_load          = plugin_name, [ "as", identifier ], [ "version", version_spec ] ;
version_spec         = string_literal | version_range ;
version_range        = "[", version, ",", version, "]" ;

conflict_resolution  = "@resolve", "conflicts", "{",
                       conflict_rule, { ",", conflict_rule },
                       "}" ;
conflict_rule        = conflict_pair, ":", resolution ;
conflict_pair        = "(", plugin_name, ",", plugin_name, ")" ;
resolution           = "prefer", plugin_name
                     | "merge", "{", merge_strategy, "}"
                     | "error" ;
```

### 2.4 Transformation Pipeline

```ebnf
transform_directive  = "@transform", "using", plugin_name, "{",
                       "input:", block_reference, ",",
                       "output:", "[", output_spec, { ",", output_spec }, "]",
                       "}" ;

output_spec          = "{",
                       "language:", ( "js" | "wasm" | "dom" | "ir" ), ",",
                       "format:", ( "esm" | "cjs" | "iife" ),
                       [ ",", "optimize:", boolean ],
                       "}" ;
```

### 2.5 Control Flow as Plugin Statements

```ebnf
plugin_statement     = if_statement | while_statement | for_statement
                     | switch_statement | do_while_statement ;

if_statement         = "@if", "(", condition, ")", then_block,
                       [ else_block ] ;
then_block           = "{", block_body, "}" | atomic_block ;
else_block           = "@else", ( "{", block_body, "}"
                               | atomic_block
                               | if_statement ) ;

while_statement      = "@while", "(", condition, ")", loop_block ;
loop_block           = "{", loop_body, "}" | atomic_block ;

for_statement        = "@for", "(", for_spec, ")", loop_block ;
for_spec             = identifier, "in", expression
                     | for_init, ";", condition, ";", for_update ;
for_init             = [ assignment_expr | expression ] ;
for_update           = [ expression ] ;

switch_statement     = "@switch", "(", expression, ")", "{",
                       { case_clause }, [ default_clause ], "}" ;
case_clause          = "@case", expression, ":", switch_body ;
default_clause       = "@default", ":", switch_body ;
switch_body          = "{", block_body, "}" | atomic_block ;

do_while_statement   = "@do", loop_block, "@while", "(", condition, ")" ;
```

### 2.6 Statement Forms

```ebnf
statement            = assignment | function_call | plugin_statement ;
assignment           = "@set", identifier, "=", expression, ";" ;
assignment_expr      = identifier, "=", expression ;
function_call        = "@call", identifier, "(", [ expression, { ",", expression } ], ")", ";" ;
```

## 3. Extended Grammar for Runtime Server API

### 3.1 HTTP API Grammar

```ebnf
api_request      = http_method, sp, api_endpoint, [ "?", query_params ],
                   crlf, headers, crlf, [ request_body ] ;
api_endpoint     = "/api/asc-r/", ( "runtime" | "state" | "projection" ) ;
query_params     = query_param, { "&", query_param } ;
query_param      = identifier, "=", ( identifier | literal ) ;
request_body     = state_proposal | shell_command | block_operation ;

api_response     = status_line, crlf, headers, crlf, response_body ;
status_line      = "ASXR/1.0", sp, status_code, sp, reason_phrase ;
status_code      = "200" | "400" | "404" | "422" ;
reason_phrase    = "STATE_ACCEPTED" | "PROPOSAL_REJECTED" |
                   "SCHEMA_VIOLATION" | "LAW_INFRACTION" ;
response_body    = state_acknowledgment | error_projection ;
```

### 3.2 State Acknowledgment Grammar

```ebnf
state_acknowledgment = "@ack", "{",
                       "status:", ( "accepted" | "rejected" | "compressed" ), ",",
                       "selected_hash:", hash_value, ",",
                       "projections:", "[", projection, { ",", projection }, "]",
                       "}" ;
projection        = "{", "target:", identifier, ",",
                    "content:", quoted_string, "}" ;
```

## 4. Shell Subsystem Grammar

### 4.1 Tokenizer Plugin Grammar

```ebnf
tokenizer_def    = "@tokenizer", identifier, "{",
                   "patterns:", "[", pattern, { ",", pattern }, "]", ",",
                   "priority:", integer, ",",
                   "handler:", block_reference,
                   "}" ;
pattern          = "{", "match:", regex_literal, ",",
                   "transform:", block_reference, "}" ;
```

### 4.2 Multi-Shell Grammar

```ebnf
multi_shell_cmd  = shell_type, ":", shell_command ;
shell_type       = "bash" | "dom" | "quake" | "sql" | "python" | "xjson" ;
bash_command     = command_string ;
dom_command      = javascript_expression ;
quake_command    = console_command ;
sql_command      = sql_statement ;
python_command   = python_expression ;
xjson_command    = extended_json_block ;
```

## 5. Type and Value Grammar

### 5.1 Primitive Types

```ebnf
literal          = string_literal | number_literal |
                   boolean_literal | null_literal | block_string ;
string_literal   = '"', { character - '"' }, '"' ;
number_literal   = integer | float ;
integer          = [ "-" ], digit, { digit } ;
float            = integer, ".", digit, { digit } ;
boolean_literal  = "true" | "false" ;
null_literal     = "null" ;

reference        = "{{", path_expression, "}}" ;
expression       = arithmetic_expr | logical_expr | comparison_expr ;
arithmetic_expr  = arithmetic_term, { ( "+" | "-" ), arithmetic_term } ;
arithmetic_term  = arithmetic_factor, { ( "*" | "/" | "%" ), arithmetic_factor } ;
arithmetic_factor = number_literal | reference | "(", arithmetic_expr, ")" ;
comparison_expr  = arithmetic_expr, comparison_operator, arithmetic_expr ;
logical_expr     = logical_term, { "OR", logical_term } ;
logical_term     = logical_factor, { "AND", logical_factor } ;
logical_factor   = [ "NOT" ], ( comparison_expr | "(", logical_expr, ")" ) ;
comparison_operator = "=" | "!=" | "<>" | "<" | "<=" | ">" | ">="
                    | "LIKE" | "NOT LIKE" | "ILIKE" | "IN" | "NOT IN"
                    | "BETWEEN" | "IS NULL" | "IS NOT NULL" ;
```

### 5.2 Special Runtime Types

```ebnf
hash_value       = "sha256:", hex_string ;
hex_string       = hex_digit, { hex_digit } ;
phase_name       = "genesis" | "execution" | "compression" | "projection" ;
epoch_value      = integer ;
```

## 6. Complete Program Structure

### 6.1 ASX-R Program

```ebnf
asxr_program     = { directive | definition } ;
directive        = "@use", identifier, ";"
                | plugin_directive
                | plugin_section
                | conflict_resolution
                | transform_directive ;
definition       = block_definition | tokenizer_def |
                   endpoint_def | projection_def ;

block_definition = "@block", identifier, "{",
                   "schema:", block_schema, ",",
                   "constraints:", "[", constraint, { ",", constraint }, "]",
                   "}" ;
block_schema     = "{", "properties:", property_defs,
                   [ ",", "required:", "[", identifier, { ",", identifier }, "]" ],
                   "}" ;
```

### 6.2 Endpoint Definition

```ebnf
endpoint_def     = "@endpoint", identifier, "{",
                   "path:", string_literal, ",",
                   "method:", ( "GET" | "POST" | "PUT" | "DELETE" ), ",",
                   "handler:", block_reference, ",",
                   "projections:", "[", identifier, { ",", identifier }, "]",
                   "}" ;
```

## 7. Terminal Symbols

```ebnf
identifier       = letter, { letter | digit | "_" } ;
qualified_identifier = identifier, { ".", ( identifier | integer ) } ;
quoted_string    = string_literal ;
regex_literal    = "/", { character - "/" }, "/" ;
handler_ref      = block_reference ;
version          = integer, { ".", integer } ;
merge_strategy   = identifier | "union" | "priority" | "override" ;
block_string     = "|", nl, indent, { text_line }, dedent ;
letter           = "A" | "B" | ... | "Z" | "a" | "b" | ... | "z" ;
digit            = "0" | "1" | ... | "9" ;
hex_digit        = digit | "A" | "B" | "C" | "D" | "E" | "F" |
                           "a" | "b" | "c" | "d" | "e" | "f" ;
character        = ? any Unicode character ? ;
sp               = ? whitespace character ? ;
crlf             = "\r\n" ;
nl               = "\n" ;
indent           = ? indentation increase ? ;
dedent           = ? indentation decrease ? ;
```

## 8. Key Grammar Updates from Our Discussion

### 8.1 Explicit State Transition Grammar

Added `@propose` construct to formally represent state proposals to the runtime server.

### 8.2 Shell Inference Integration

Added `shell_command` grammar to support the "shell = inference" model, with specific syntax for different shell types.

### 8.3 API-First Design

Formalized HTTP API grammar showing how runtime interactions occur via structured endpoints.

### 8.4 Tokenizer Plugin System

Added `@tokenizer` definition for creating syntax interpreters, enabling multiple "computer tongues."

### 8.5 Projection Response Grammar

Added `@ack` response structure showing how the runtime returns state acknowledgments with projections.

## 9. Example Valid Programs

### 9.1 Genesis Block Definition

```asxr
@block system {
  schema: {
    properties: {
      name: string,
      version: string,
      laws: [string]
    },
    required: [name, version]
  }
}

@propose {
  prior: null,
  next: {
    blocks: [@system[genesis] {
      name: "ASX-R Runtime Server",
      version: "1.0.0",
      laws: ["existence_is_explicit", "closed_world"]
    }],
    phase: genesis,
    epoch: 0
  },
  constraints: [@law_invariant, @phase_rule]
}
```

### 9.2 Shell Command via API

```text
POST /api/asc-r/runtime
Content-Type: application/asxr

bash: ls -la /var/www
```

### 9.3 Tokenizer Plugin Definition

```asxr
@tokenizer xjson {
  patterns: [
    {match: "@if\\s+condition=\"\\{\\{(.+?)\\}\\}\"",
     transform: #conditional_transform}
  ],
  priority: 100,
  handler: #xjson_handler
}
```

## 10. Grammar Consistency Rules

1. **Closed World**: All identifiers must be declared before use (except built-in types)
2. **Explicit State**: All state transitions must use `@propose` with explicit prior hash
3. **Lawful Projection**: All API responses must include projection declarations
4. **Deterministic Parsing**: Grammar is LL(1) for deterministic parsing
5. **Replay Sufficiency**: Parse tree contains all information needed for execution replay

## 11. Implementation Notes

This grammar can be implemented with:

- **Recursive descent parser** for interpreter implementations
- **ANTLR/Lex/Yacc** for generated parsers
- **Parser combinator** libraries in functional languages
- **Direct AST construction** for meta-circular implementations

The grammar maintains **backward compatibility** with previous atomic block syntax while extending it with server and shell constructs.

## 12. Validation

This grammar defines the **syntactic structure** of ASX-R. Semantic validation (laws, schemas, constraints) occurs after parsing, during the state admission process.

## 13. Atomic DOM Unified Grammar (Extension)

This section merges the ASX-R EBNF with Atomic DOM concepts to define a unified grammar for declarative, transactional DOM updates.

### 13.1 Atomic DOM Block Grammar

```ebnf
dom_atomic_block = "@dom", dom_block_type, dom_block_id, "{", dom_operations, "}" ;
dom_block_type   = "frame" | "mutation" | "style" | "layout" | "component" | "element"
                 | identifier ;
dom_block_id     = "[", element_selector, "]" ;
element_selector = selector | string_literal | identifier | id | class ;
dom_operations   = { dom_operation } ;
dom_operation    = property_op | child_op | attribute_op | class_op ;
property_op      = "prop", ":", identifier, "=", value, ";" ;
child_op         = "children", ":", "[", element_def, { ",", element_def }, "]", ";" ;
element_def      = dom_atomic_block | block_reference | element_selector ;
attribute_op     = "attr", ":", identifier, "=", string_literal, ";" ;
class_op         = "class", ":", class_list, ";" ;
```

```asxr
@dom frame[#app] {
  prop: opacity = 1;
  prop: transform = "translateY(0)";
  children: [
    @dom component[header] {
      class: ["sticky", "primary"];
      children: [
        @dom element[h1] { text: "Atomic DOM" }
      ]
    }
  ]
}
```

### 13.2 DOM State Proposals (Virtual DOM Alternative)

```ebnf
dom_proposal     = "@propose_dom", "{",
                   "prior:", dom_hash, ",",
                   "next:", dom_snapshot, ",",
                   "patch:", patch_operations,
                   "}" ;

dom_snapshot     = "{",
                   "root:", element_selector, ",",
                   "tree:", dom_tree,
                   "}" ;

patch_operations = "[", patch_op, { ",", patch_op }, "]" ;
patch_op         = "{",
                   "type:", patch_type, ",",
                   "target:", element_path, ",",
                   "data:", patch_data,
                   "}" ;

patch_type       = "CREATE" | "UPDATE" | "MOVE" | "DELETE" ;
element_path     = integer, { ".", integer } ;
```

```asxr
@propose_dom {
  prior: "sha256:abc123",
  next: {
    root: "#app",
    tree: @dom frame[#app] {
      children: [
        @dom element[.item] { text: "Item 1" },
        @dom element[.item] { text: "Item 2" },
        @dom element[.item] { text: "Item 3" }
      ]
    }
  },
  patch: [
    {
      type: "CREATE",
      target: "2",
      data: { element: ".item", text: "Item 3" }
    }
  ]
}
```

### 13.3 Render Shell Grammar (JSX/Templates)

```ebnf
render_shell      = shell_type, ":", render_expression ;
shell_type        = "jsx" | "vue" | "svelte" | "lit" | "vanilla" ;
render_expression = template_literal | jsx_element ;

jsx_element       = "<", element_name, [ props ], ">",
                    [ children ], "</", element_name, ">" ;
props             = prop_assignment, { prop_assignment } ;
prop_assignment   = prop_name, "=", ( string_literal | "{", expression, "}" ) ;
children          = ( text_content | jsx_element | "{", expression, "}" ), { children } ;
```

```asxr
jsx: <Button primary onClick={handleClick}>Submit</Button>
vue: <button @click="handleClick" :class="{primary: true}">Submit</button>
svelte: <button on:click={handleClick} class:primary>Submit</button>
vanilla: @dom element[button] {
  class: ["primary"];
  events: [{type: "click", handler: #handleClick}];
  text: "Submit";
}
```

### 13.4 Browser Runtime API Grammar

```ebnf
browser_api      = method, ":", api_call ;
method           = "raf" | "microwave" | "observer" | "intersection" ;

raf_call         = "raf", ":", "[", dom_operation, { ",", dom_operation }, "]" ;

observer_call    = "observer", ":", "{",
                   "target:", element_selector, ",",
                   "callback:", block_reference, ",",
                   "options:", observer_options,
                   "}" ;

microwave_call   = "microwave", ":", "{",
                   "priority:", ("low" | "normal" | "high"), ",",
                   "task:", block_reference,
                   "}" ;
```

```asxr
observer: {
  target: "#scrollable",
  callback: #measureLayout,
  options: {attributes: true, childList: true}
}

raf: [
  @dom style[.moving] { prop: transform = "translateX(100px)" },
  @dom style[.fading] { prop: opacity = 0 }
]

microwave: {
  priority: low,
  task: #prefetchImages
}
```

### 13.5 CSS Atomic Grammar

```ebnf
css_document      = { directive } ;
directive         = css_atomic | css_advanced | css_in_js | css_module
                  | css_inference | css_dataset | css_query | css_classes ;

css_atomic        = "@css", scope, "{", css_rules, "}" ;
scope             = "global" | "scoped" | "shadow" | "tensor" | "compute" ;
css_rules         = { css_rule | sql_binding_rule } ;
css_rule          = selector, "{", declarations, "}" ;
selector          = (class | id | element | pseudo | attribute | combinator)+ ;
declarations      = { declaration } ;
rules_section     = "rules:", "{", css_rules, "}" ;

declaration       = css_declaration | tensor_declaration | binary_declaration
                  | svg_declaration | layer_declaration | weight_declaration
                  | compute_declaration | sql_declaration ;

css_declaration   = property, ":", css_value, ";" ;
tensor_declaration = "tensor-", property, ":", tensor_value, ";" ;
binary_declaration = "binary-", property, ":", binary_data, ";" ;
svg_declaration   = "svg-", property, ":", svg_spec, ";" ;
layer_declaration = "layer-", property, ":", layer_spec, ";" ;
weight_declaration = "weight-", property, ":", weight_spec, ";" ;
compute_declaration = "compute-", property, ":", compute_spec, ";" ;
sql_declaration   = "sql-", property, ":", sql_style_value, ";" ;

css_value         = simple_value
                  | array_value
                  | function_value
                  | var_reference
                  | calc_value ;

simple_value      = string | number | color | dimension | percentage | boolean ;
string            = '"', { character - '"' }, '"'
                  | "'", { character - "'" }, "'" ;
number            = [ "-" ], digit, { digit }, [ ".", digit, { digit } ] ;
color             = hex_color | rgb_color | rgba_color | hsl_color | hsla_color ;
hex_color         = "#", hex_digit, hex_digit, hex_digit, [ hex_digit, hex_digit, hex_digit ]
                  | "#", hex_digit, hex_digit, hex_digit, hex_digit, hex_digit, hex_digit, hex_digit, hex_digit ;
rgb_color         = "rgb(", number, ",", number, ",", number, ")" ;
rgba_color        = "rgba(", number, ",", number, ",", number, ",", number, ")" ;
hsl_color         = "hsl(", number, ",", percentage, ",", percentage, ")" ;
hsla_color        = "hsla(", number, ",", percentage, ",", percentage, ",", number, ")" ;
dimension         = number, unit ;
unit              = "px" | "em" | "rem" | "vh" | "vw" | "vmin" | "vmax" | "deg" | "rad" | "grad" | "turn" ;
percentage        = number, "%" ;
boolean           = "true" | "false" ;

array_value       = "[", { css_value, [ "," ] }, "]" ;
function_value    = function_name, "(", { css_value, [ "," ] }, ")" ;
var_reference     = "var(", string, [ ",", css_value ], ")" ;
calc_value        = "calc(", calc_expression, ")" ;
calc_expression   = term, { ( "+" | "-" ), term } ;
term              = factor, { ( "*" | "/" ), factor } ;
factor            = number | dimension | percentage | "(", expression, ")" | var_reference ;

tensor_value      = "tensor", "[",
                    "shape:", shape_spec, ",",
                    "dtype:", dtype, ",",
                    "data:", data_source, ",",
                    "values:", tensor_data,
                    [ ",", tensor_options ],
                    "]" ;

shape_spec        = "[", { integer, [ "," ] }, "]" ;
dtype             = "float16" | "float32" | "float64" | "int8" | "int16" | "int32" | "uint8" | "uint16" | "uint32" | "bool" ;
data_source       = "inline" | "external" | "generated" | "computed" ;
tensor_data       = scalar_value | vector_value | matrix_value | tensor_initializer | "none" ;

scalar_value      = number ;
vector_value      = "[", { number, [ "," ] }, "]" ;
matrix_value      = "[", { vector_value, [ "," ] }, "]" ;

tensor_initializer = initializer_type, [ "(", [ arguments ], ")" ] ;
initializer_type  = "zeros" | "ones" | "eye" | "random" | "uniform" | "normal"
                  | "xavier" | "he" | "kaiming" | "truncated_normal" ;
arguments         = number, { ",", number } ;

tensor_options    = "device:", device, [ ",", "requires_grad:", boolean ]
                  | "layout:", layout, [ ",", "sparse:", boolean ] ;
device            = "cpu" | "gpu" | "tpu" | "auto" ;
layout            = "dense" | "sparse" | "compressed" ;

binary_data       = "binary", "[",
                    "encoding:", encoding_type, ",",
                    "format:", binary_format, ",",
                    "data:", binary_content,
                    [ ",", "compression:", compression_type ],
                    "]" ;

encoding_type     = "base64" | "base64url" | "hex" | "raw" | "utf8" ;
binary_format     = "bin" | "npy" | "hdf5" | "protobuf" | "msgpack" | "custom" ;
binary_content    = string | "url(", string, ")" | "embedded(", integer, ")" ;
compression_type  = "none" | "gzip" | "zstd" | "brotli" | "lz4" | "quantized" ;

svg_spec          = svg_path | svg_rect | svg_circle | svg_ellipse | svg_line
                  | svg_polyline | svg_polygon | svg_text | svg_group ;

svg_path          = "path", "[",
                    "d:", string, ",",
                    [ "fill:", fill_spec, "," ],
                    [ "stroke:", stroke_spec, "," ],
                    [ "transform:", svg_transform, "," ],
                    [ "clip-path:", string, "," ],
                    [ "filter:", string, "," ],
                    "]" ;

fill_spec         = color | "none" | "currentColor" | gradient_spec ;
stroke_spec       = color, ",", number, [ ",", stroke_style ] ;
stroke_style      = "solid" | "dashed" | "dotted" | "double" | "wavy" ;

svg_transform     = transform_list | transform_matrix ;
transform_list    = { transform_item, [ "," ] } ;
transform_item    = "translate(", number, [ ",", number ], ")"
                  | "scale(", number, [ ",", number ], ")"
                  | "rotate(", number, [ ",", number, ",", number ], ")"
                  | "skewX(", number, ")"
                  | "skewY(", number, ")" ;

transform_matrix  = "matrix(", number, ",", number, ",", number, ",", number, ",", number, ",", number, ")" ;

svg_rect          = "rect", "[", "x:", number, ",", "y:", number, ",", "width:", number, ",", "height:", number,
                   [ ",", "rx:", number ], [ ",", "ry:", number ], "]" ;
svg_circle        = "circle", "[", "cx:", number, ",", "cy:", number, ",", "r:", number, "]" ;
svg_ellipse       = "ellipse", "[", "cx:", number, ",", "cy:", number, ",", "rx:", number, ",", "ry:", number, "]" ;
svg_line          = "line", "[", "x1:", number, ",", "y1:", number, ",", "x2:", number, ",", "y2:", number, "]" ;
svg_polyline      = "polyline", "[", "points:", string, "]" ;
svg_polygon       = "polygon", "[", "points:", string, "]" ;
svg_text          = "text", "[", "value:", string, [ ",", "x:", number ], [ ",", "y:", number ], "]" ;
svg_group         = "group", "[", "children:", "[", { svg_spec, [ "," ] }, "]", "]" ;

transform_3d      = transform_3d_item | transform_3d_list ;
transform_3d_item = "translate3d", vector_3d
                  | "scale3d", vector_3d
                  | "rotate3d", vector_3d, ",", angle
                  | "matrix3d", matrix_4x4
                  | "perspective", number
                  | "rotateX", angle
                  | "rotateY", angle
                  | "rotateZ", angle ;
transform_3d_list = "[", { transform_3d_item, [ "," ] }, "]" ;

vector_3d         = "[", number, ",", number, ",", number, "]" ;
matrix_4x4        = "[", vector_4, ",", vector_4, ",", vector_4, ",", vector_4, "]" ;
vector_4          = "[", number, ",", number, ",", number, ",", number, "]" ;
angle             = number, ( "deg" | "rad" | "grad" | "turn" ) ;

gradient_spec     = linear_gradient | radial_gradient | conic_gradient ;
linear_gradient   = "linear-gradient", "[",
                    "angle:", ( number | direction ), ",",
                    "stops:", gradient_stops,
                    [ ",", "repeating:", boolean ],
                    "]" ;

radial_gradient   = "radial-gradient", "[",
                    "shape:", ( "circle" | "ellipse" ), ",",
                    "size:", ( "closest-side" | "farthest-side" | "closest-corner" | "farthest-corner" | vector_2d ), ",",
                    "position:", position, ",",
                    "stops:", gradient_stops,
                    "]" ;

conic_gradient    = "conic-gradient", "[",
                    "from:", angle, ",",
                    "position:", position, ",",
                    "stops:", gradient_stops,
                    "]" ;

direction         = "to", ( "top" | "bottom" | "left" | "right"
                          | "top left" | "top right" | "bottom left" | "bottom right" ) ;
gradient_stops    = "[", { gradient_stop, [ "," ] }, "]" ;
gradient_stop     = color, number, [ "%" ] ;
position          = vector_2d | keyword_position ;
vector_2d         = "[", number, ",", number, "]" ;
keyword_position  = "center" | "top" | "bottom" | "left" | "right"
                  | "top left" | "top right" | "bottom left" | "bottom right" ;

layer_spec        = "layer", "[",
                    "type:", layer_type, ",",
                    "units:", integer, ",",
                    "weights:", tensor_value, ",",
                    "biases:", ( tensor_value | "none" ), ",",
                    "activation:", activation_fn,
                    [ ",", layer_options ],
                    "]" ;

layer_type        = "dense" | "conv1d" | "conv2d" | "conv3d"
                  | "lstm" | "gru" | "attention" | "multihead_attention"
                  | "batch_norm" | "layer_norm" | "dropout" | "embedding" ;

activation_fn     = "relu" | "leaky_relu" | "sigmoid" | "tanh" | "softmax"
                  | "softplus" | "softsign" | "selu" | "elu" | "gelu" | "swish" | "none" ;

layer_options     = "kernel_size:", integer
                  | "stride:", integer
                  | "padding:", ( integer | "same" | "valid" )
                  | "dilation:", integer
                  | "groups:", integer
                  | "bidirectional:", boolean ;

weight_spec       = "weight", "[",
                    "value:", ( number | tensor_value ), ",",
                    "trainable:", boolean, ",",
                    "constraint:", weight_constraint,
                    [ ",", "regularizer:", regularizer ],
                    "]" ;

weight_constraint = "none" | "min_max", "[", number, ",", number, "]"
                  | "unit_norm" | "non_neg" | "orthogonal" ;
regularizer       = "l1", "[", number, "]" | "l2", "[", number, "]" | "l1_l2", "[", number, ",", number, "]" ;

compute_spec      = "compute", "[",
                    "kernel:", kernel_type, ",",
                    "workgroups:", vector_3d, ",",
                    "inputs:", compute_inputs, ",",
                    "outputs:", compute_outputs, ",",
                    "code:", string,
                    "]" ;

kernel_type       = "shader" | "compute" | "raytracing" | "mesh" | "task" ;
compute_inputs    = "[", { compute_buffer, [ "," ] }, "]" ;
compute_outputs   = "[", { compute_buffer, [ "," ] }, "]" ;
compute_buffer    = buffer_name, ":", tensor_value ;
buffer_name       = identifier ;

css_advanced      = "@css", "advanced", "{",
                    config_section, ",",
                    imports_section, ",",
                    exports_section, ",",
                    rules_section,
                    "}" ;

config_section    = "config:", "[", { config_item, [ "," ] }, "]" ;
config_item       = "mode:", mode_type
                  | "precision:", dtype
                  | "target:", target_platform
                  | "backend:", compute_backend
                  | "optimize:", boolean
                  | "debug:", boolean ;

mode_type         = "visual" | "compute" | "hybrid" | "inference" | "training" ;
target_platform   = "web" | "native" | "mobile" | "embedded" | "cloud" ;
compute_backend   = "webgl" | "webgpu" | "wasm" | "vulkan" | "metal" | "cuda" | "cpu" ;

imports_section   = "imports:", "[", { import_item, [ "," ] }, "]" ;
import_item       = string, [ "as", identifier ] ;
exports_section   = "exports:", "[", { export_item, [ "," ] }, "]" ;
export_item       = identifier, [ ":", export_type ] ;
export_type       = "tensor" | "shader" | "module" | "weights" ;

css_in_js         = "@css", "js", "{",
                    js_config, ",",
                    "rules:", css_rules,
                    "}" ;

js_config         = "atomic:", boolean, ",",
                    "generate:", generation_mode, ",",
                    "runtime:", runtime_type, ",",
                    "compute:", boolean, ",",
                    "hot:", boolean ;

generation_mode   = "classes" | "inline" | "variables" | "shaders" | "kernels" | "all" ;
runtime_type      = "dom" | "canvas" | "webgl" | "webgpu" | "wasm" ;

css_module        = "@css", "module", identifier, "{",
                    state_section, ",",
                    props_section, ",",
                    effects_section, ",",
                    rules_section,
                    "}" ;

state_section     = "state:", "[", { state_var, [ "," ] }, "]" ;
state_var         = identifier, ":", state_type, [ "=", initial_value ] ;
state_type        = "tensor" | "bool" | "number" | "string" | "color" | "array" ;
initial_value     = css_value | tensor_value ;

props_section     = "props:", "[", { prop_def, [ "," ] }, "]" ;
prop_def          = identifier, ":", prop_type, [ "=", default_value ] ;
prop_type         = state_type | "any" ;

effects_section   = "effects:", "[", { effect_def, [ "," ] }, "]" ;
effect_def        = identifier, ":", "[",
                    "trigger:", trigger_event, ",",
                    "action:", effect_action,
                    "]" ;

trigger_event     = "mount" | "unmount" | "update" | "hover" | "click" | "scroll" | "resize" ;
effect_action     = "animate" | "compute" | "update" | "dispatch" ;

css_inference     = "@inference", inference_config, "{", inference_rules, "}" ;
inference_config  = "[",
                    "engine:", inference_engine, ",",
                    "precision:", inference_precision, ",",
                    "backend:", inference_backend, ",",
                    "mode:", inference_mode,
                    "]" ;
inference_engine  = "sql" | "tensorflow" | "pytorch" | "onnx" | "xgboost" | "ensemble" ;
inference_precision = "float16" | "float32" | "float64" | "int8" | "int16" | "mixed" ;
inference_backend = "cpu" | "gpu" | "tpu" | "wasm" | "sqlite" | "duckdb" | "postgres" ;
inference_mode    = "training" | "inference" | "fine_tuning" | "transfer" ;

inference_rules   = { inference_rule } ;
inference_rule    = "WHEN", condition, "THEN", sql_query, "APPLY", css_block ;

sql_query         = "QUERY", "[",
                    "type:", query_type, ",",
                    "database:", database_spec, ",",
                    "sql:", sql_statement,
                    "]" ;

query_type        = "select" | "insert" | "update" | "delete" | "create"
                  | "join" | "aggregate" | "window" | "recursive" | "ml_predict" ;

database_spec     = "memory" | string | tensor_spec | "connection(", connection_string, ")" ;
connection_string = string ;

sql_statement     = string | multiline_string ;
multiline_string  = "```sql", { character }, "```" ;

css_dataset       = "@dataset", dataset_name, dataset_config, "{", data_schema, data_records, "}" ;
dataset_name      = identifier ;
dataset_config    = "[",
                    "source:", dataset_source, ",",
                    "format:", data_format, ",",
                    "split:", dataset_split, ",",
                    "shuffle:", boolean, ",",
                    "cache:", boolean,
                    "]" ;

dataset_source    = "inline" | "external" | "generated" | "synthetic" | "streaming" ;
data_format       = "csv" | "json" | "parquet" | "tfrecord" | "sql" | "tensor" ;
dataset_split     = "[", train_split, ",", val_split, ",", test_split, "]" ;
train_split       = "train:", number ;
val_split         = "val:", number ;
test_split        = "test:", number ;

data_schema       = "SCHEMA:", "[", { column_def, [","] }, "]" ;
column_def        = column_name, ":", column_type, [ "(", constraints, ")" ] ;
column_name       = identifier ;
column_type       = "INT" | "FLOAT" | "DOUBLE" | "DECIMAL" | "STRING"
                  | "BOOL" | "DATE" | "TIME" | "DATETIME" | "TENSOR"
                  | "VECTOR" | "MATRIX" | "JSON" | "BINARY" ;
constraints       = constraint, { ",", constraint } ;
constraint        = "PRIMARY KEY" | "UNIQUE" | "NOT NULL" | "DEFAULT", value
                  | "CHECK", condition | "REFERENCES", table_name, "(", column_name, ")" ;

data_records      = "DATA:", "[", { record, [","] }, "]" ;
record            = "ROW:", "[", { field_value, [","] }, "]" ;
field_value       = sql_value | tensor_value ;

sql_value         = sql_expression | sql_function | sql_aggregate | sql_window ;
sql_expression    = sql_term, { ("+" | "-" | "||"), sql_term } ;
sql_term          = sql_factor, { ("*" | "/" | "%"), sql_factor } ;
sql_factor        = sql_primary | "(", sql_expression, ")" ;
sql_primary       = number | string | column_reference | function_call
                  | case_expression | cast_expression ;

column_reference  = [ table_name, "." ], column_name ;
table_name        = identifier ;

function_call     = function_name, "(", [ function_args ], ")" ;
function_args     = sql_expression, { ",", sql_expression } ;

sql_function      = function_name, "(", [ function_args ], ")" ;
function_name     = "ABS" | "CEIL" | "FLOOR" | "ROUND" | "EXP" | "LN" | "LOG"
                  | "LOG10" | "LOG2" | "POW" | "POWER" | "SQRT" | "CBRT"
                  | "SIN" | "COS" | "TAN" | "ASIN" | "ACOS" | "ATAN" | "ATAN2"
                  | "SINH" | "COSH" | "TANH" | "RADIANS" | "DEGREES"
                  | "PI" | "RANDOM" | "RAND" | "SIGN" | "MOD" | "TRUNC"
                  | "GREATEST" | "LEAST" | "CLAMP" | "LERP" | "SMOOTHSTEP" ;

sql_aggregate     = aggregate_func, "(", [ "DISTINCT" ], sql_expression, ")" ;
aggregate_func    = "SUM" | "AVG" | "MEAN" | "MEDIAN" | "MODE" | "COUNT"
                  | "MIN" | "MAX" | "STDDEV" | "VARIANCE" | "CORR" | "COVAR"
                  | "PERCENTILE_CONT" | "PERCENTILE_DISC" | "GROUP_CONCAT"
                  | "ARRAY_AGG" | "JSON_AGG" | "STRING_AGG" ;

sql_window        = window_func, "OVER", "(", [ partition_clause ], [ order_clause ],
                    [ frame_clause ], ")" ;
window_func       = "ROW_NUMBER" | "RANK" | "DENSE_RANK" | "NTILE"
                  | "LAG" | "LEAD" | "FIRST_VALUE" | "LAST_VALUE"
                  | "NTH_VALUE" | "CUME_DIST" | "PERCENT_RANK" ;
partition_clause  = "PARTITION BY", column_reference, { ",", column_reference } ;
order_clause      = "ORDER BY", sort_spec, { ",", sort_spec } ;
sort_spec         = column_reference, [ "ASC" | "DESC" ] ;
frame_clause      = "ROWS", frame_spec | "RANGE", frame_spec ;
frame_spec        = frame_start, [ frame_between ] | "CURRENT ROW" ;
frame_start       = "UNBOUNDED PRECEDING" | integer, "PRECEDING" ;
frame_between     = "BETWEEN", frame_bound, "AND", frame_bound ;
frame_bound       = frame_start | "CURRENT ROW" | "UNBOUNDED FOLLOWING"
                  | integer, "FOLLOWING" ;

case_expression   = "CASE", [ case_operand ],
                    { "WHEN", when_condition, "THEN", result_expression },
                    [ "ELSE", else_expression ],
                    "END" ;

case_operand      = sql_expression ;
when_condition    = condition ;
result_expression = sql_expression ;
else_expression   = sql_expression ;

cast_expression   = "CAST", "(", sql_expression, "AS", data_type, ")"
                  | sql_expression, "::", data_type ;

data_type         = column_type | "INTEGER" | "REAL" | "TEXT" | "BLOB"
                  | "NUMERIC" | "BOOLEAN" | "TIMESTAMP" | "INTERVAL"
                  | "UUID" | "ARRAY" | "VECTOR" ;

css_query         = "@query", query_name, query_config, "{", query_body, "}" ;
query_name        = identifier ;
query_config      = "[",
                    "type:", query_body_type, ",",
                    "materialized:", boolean, ",",
                    "cache:", cache_policy, ",",
                    "ttl:", duration,
                    "]" ;

query_body_type   = "view" | "table" | "function" | "pipeline" | "materialized_view" ;
cache_policy      = "none" | "memory" | "disk" | "distributed" ;
duration          = number, time_unit ;
time_unit         = "ms" | "s" | "m" | "h" | "d" ;

query_body        = sql_statement | query_pipeline ;
query_pipeline    = "PIPELINE:", "[", { pipeline_step, [","] }, "]" ;
pipeline_step     = step_name, ":", "(", step_type, ":", step_config, ")" ;
step_name         = identifier ;
step_type         = "sql" | "transform" | "aggregate" | "join" | "filter" | "window" ;
step_config       = sql_statement | transformation ;

transformation    = "TRANSFORM", "[",
                    "input:", transformation_input, ",",
                    "operations:", "[", { operation, [","] }, "]", ",",
                    "output:", transformation_output,
                    "]" ;

transformation_input = column_reference | tensor_spec | "SELECT", "*", "FROM", table_name ;
operation         = operation_type, "(", operation_args, ")" ;
operation_type    = "normalize" | "standardize" | "one_hot" | "embed"
                  | "pca" | "kmeans" | "scale" | "clip" | "noise" | "augment"
                  | "resample" | "interpolate" | "derivative" | "integrate" ;
operation_args    = sql_expression, { ",", sql_expression } ;
transformation_output = "RETURNS", data_type | "AS", table_name ;

condition         = sql_condition | css_condition | ml_condition ;
sql_condition     = boolean_expression ;
boolean_expression = boolean_term, { "OR", boolean_term } ;
boolean_term      = boolean_factor, { "AND", boolean_factor } ;
boolean_factor    = [ "NOT" ], comparison | "(", boolean_expression, ")" ;
comparison        = sql_expression, comparison_operator, sql_expression ;
comparison_operator = "=" | "!=" | "<>" | "<" | "<=" | ">" | ">="
                    | "LIKE" | "NOT LIKE" | "ILIKE" | "IN" | "NOT IN"
                    | "BETWEEN" | "IS NULL" | "IS NOT NULL"
                    | "EXISTS" | "ANY" | "ALL" ;

ml_condition      = "PREDICT", "(", model_reference, ",", features, ")", comparison_operator, threshold ;
model_reference   = identifier | "MODEL", "(", model_spec, ")" ;
features          = "[", { sql_expression, [","] }, "]" ;
threshold         = number | sql_expression ;

css_block         = "{", css_rules, "}" | "APPLY", style_function ;
style_function    = function_name, "(", [ function_args ], ")" ;

sql_binding_rule  = "BIND", binding_name, "FROM", sql_query, "AS", binding_type ;
binding_name      = identifier ;
binding_type      = "tensor" | "scalar" | "vector" | "color" | "gradient" | "animation" ;

sql_style_value   = sql_scalar | sql_vector | sql_gradient | sql_animation ;
sql_scalar        = "SCALAR", "(", sql_query, ")" ;
sql_vector        = "VECTOR", "(", sql_query, "ORDER BY", order_clause, ")" ;
sql_gradient      = "GRADIENT", "(",
                    "colors:", sql_query, ",",
                    "positions:", sql_query, ",",
                    "angle:", sql_expression,
                    ")" ;
sql_animation     = "ANIMATION", "(",
                    "keyframes:", sql_query, ",",
                    "duration:", sql_expression, ",",
                    "easing:", easing_function,
                    ")" ;

easing_function   = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
                  | cubic_bezier | steps | spring ;
cubic_bezier      = "cubic-bezier", "(", number, ",", number, ",", number, ",", number, ")" ;
steps             = "steps", "(", integer, [ ",", ( "start" | "end" ) ], ")" ;
spring            = "spring", "(", number, [ ",", number ], ")" ;

css_classes       = "@classes", class_config, "{", class_categories, "}" ;
class_config      = "[",
                    "prefix:", [ string ], ",",
                    "separator:", ( "-" | "_" | "/" | "none" ), ",",
                    "responsive:", boolean, ",",
                    "dark_mode:", boolean, ",",
                    "important:", boolean, ",",
                    "minify:", boolean, ",",
                    "sourcemaps:", boolean,
                    "]" ;

class_categories  = { class_category } ;
class_category    = category_name, "{", class_groups, "}" ;
category_name     = "layout" | "flexbox" | "grid" | "spacing" | "sizing"
                  | "typography" | "colors" | "backgrounds" | "borders"
                  | "effects" | "filters" | "transforms" | "transitions"
                  | "animation" | "svg" | "tensor" | "interactivity"
                  | "tables" | "forms" | "accessibility" | "utilities"
                  | "custom", identifier ;

class_groups      = layout_classes | flexbox_classes | grid_classes
                  | spacing_classes | sizing_classes | typography_classes
                  | color_classes | background_classes | border_classes
                  | effects_classes | transform_classes | transition_classes
                  | animation_classes | svg_classes | tensor_classes
                  | interactivity_classes | table_classes | form_classes
                  | accessibility_classes | utility_classes | custom_classes ;

layout_classes    = "layout", "{",
                    display_classes, position_classes,
                    float_classes, clear_classes, overflow_classes,
                    z_index_classes, visibility_classes,
                    isolation_classes, "}" ;

display_classes   = "display:", "[", { display_value, [","] }, "]" ;
display_value     = "block" | "inline" | "inline-block" | "flex" | "inline-flex"
                  | "grid" | "inline-grid" | "table" | "inline-table" | "table-cell"
                  | "table-row" | "table-column" | "table-caption" | "flow-root"
                  | "contents" | "list-item" | "hidden" | "none" ;

position_classes  = "position:", "[", { position_value, [","] }, "]" ;
position_value    = "static" | "relative" | "absolute" | "fixed" | "sticky" ;

float_classes     = "float:", "[", "left", "right", "none", "]" ;
clear_classes     = "clear:", "[", "left", "right", "both", "none", "]" ;

overflow_classes  = "overflow:", "[", axis, ":", overflow_value, [","], "]" ;
axis              = "x" | "y" | "" ;
overflow_value    = "auto" | "hidden" | "visible" | "scroll" | "clip" ;

z_index_classes   = "z_index:", "[", auto_value, ",", numeric_range, [",", "negative"], "]" ;
auto_value        = "auto" ;
numeric_range     = integer, "..", integer ;

visibility_classes = "visibility:", "[", "visible", "hidden", "collapse", "]" ;
isolation_classes = "isolation:", "[", "isolate", "auto", "]" ;

flexbox_classes   = "flexbox", "{",
                    flex_direction_classes, flex_wrap_classes,
                    flex_grow_classes, flex_shrink_classes, flex_basis_classes,
                    justify_content_classes, align_items_classes,
                    align_content_classes, align_self_classes,
                    order_classes, gap_classes,
                    "}" ;

flex_direction_classes = "direction:", "[",
                         "row", "row-reverse", "column", "column-reverse",
                         "]" ;
flex_wrap_classes = "wrap:", "[", "nowrap", "wrap", "wrap-reverse", "]" ;

flex_grow_classes = "grow:", "[", numeric_range, [",", "initial", ",", "inherit"], "]" ;
flex_shrink_classes = "shrink:", "[", numeric_range, [",", "initial", ",", "inherit"], "]" ;
flex_basis_classes = "basis:", "[", length_values, [",", "auto", ",", "fill", ",", "content"], "]" ;
length_values     = { length_value, [","] } ;
length_value      = number, unit | "0" | "full" | "screen" | "min" | "max"
                  | "fit" | "min-content" | "max-content" ;

justify_content_classes = "justify:", "[", "start", "end", "center", "between", "around",
                          "evenly", "stretch", "]" ;
align_items_classes = "items:", "[", "start", "end", "center", "baseline", "stretch", "]" ;
align_content_classes = "content:", "[", "start", "end", "center", "between", "around",
                        "evenly", "stretch", "baseline", "]" ;
align_self_classes = "self:", "[", "auto", "start", "end", "center", "stretch", "baseline", "]" ;
order_classes     = "order:", "[", numeric_range, [",", "first", ",", "last", ",", "none"], "]" ;
gap_classes       = "gap:", "[", spacing_scale, [",", "row", ",", "column"], "]" ;

grid_classes      = "grid", "{",
                    grid_template_classes, grid_auto_classes,
                    grid_placement_classes, grid_area_classes,
                    grid_gap_classes, "}" ;

grid_template_classes = "template:", "[",
                        "cols:", column_templates, ",",
                        "rows:", row_templates, ",",
                        "areas:", area_templates,
                        "]" ;
column_templates  = { template_value, [","] } ;
row_templates     = { template_value, [","] } ;
template_value    = length_value | "minmax(", length_value, ",", length_value, ")"
                  | "repeat(", integer, ",", length_value, ")"
                  | "fit-content(", length_value, ")"
                  | "subgrid" | "masonry" ;
area_templates    = string | "none" ;

grid_auto_classes = "auto:", "[",
                    "flow:", "[", "row", "column", "dense", "row-dense", "column-dense", "]", ",",
                    "columns:", auto_track_sizes, ",",
                    "rows:", auto_track_sizes,
                    "]" ;
auto_track_sizes  = { auto_track_size, [","] } ;
auto_track_size   = length_value | "min-content" | "max-content" | "auto" ;

grid_placement_classes = "placement:", "[",
                         "col:", placement_values, ",",
                         "row:", placement_values, ",",
                         "start:", placement_values, ",",
                         "end:", placement_values,
                         "]" ;
placement_values  = { placement_value, [","] } ;
placement_value   = integer | "auto" | "span", integer | "full" ;

grid_area_classes = "area:", "[", area_names, [",", "auto"], "]" ;
area_names        = { identifier, [","] } ;

grid_gap_classes  = "gap:", "[", spacing_scale, [",", "row", ",", "column"], "]" ;

spacing_classes   = "spacing", "{", margin_classes, padding_classes, "}" ;

margin_classes    = "margin:", "[", sides, ":", spacing_values, [","], "]" ;
padding_classes   = "padding:", "[", sides, ":", spacing_values, [","], "]" ;

sides             = "" | "t" | "r" | "b" | "l" | "x" | "y" | "s" | "e" ;
spacing_values    = { spacing_value, [","] } ;
spacing_value     = "auto" | number, unit | css_variable ;
spacing_scale     = spacing_scale_def | "[", spacing_values, "]" ;
spacing_scale_def = "scale:", integer, "..", integer, ",", "step:", number ;

sizing_classes    = "sizing", "{",
                    width_classes, height_classes,
                    min_width_classes, max_width_classes,
                    min_height_classes, max_height_classes,
                    aspect_ratio_classes, box_sizing_classes,
                    "}" ;

width_classes     = "width:", "[", size_values, [",", "auto", ",", "full", ",", "screen"], "]" ;
height_classes    = "height:", "[", size_values, [",", "auto", ",", "full", ",", "screen"], "]" ;

min_width_classes = "min_width:", "[", size_values, [",", "min", ",", "max", ",", "fit"], "]" ;
max_width_classes = "max_width:", "[", size_values, [",", "none", ",", "full", ",", "screen"], "]" ;

min_height_classes = "min_height:", "[", size_values, [",", "min", ",", "screen"], "]" ;
max_height_classes = "max_height:", "[", size_values, [",", "none", ",", "screen"], "]" ;

size_values       = { size_value, [","] } ;
size_value        = length_value | percentage | fraction | "fit-content"
                  | "min-content" | "max-content" | "stretch" ;
fraction          = integer, "/", integer ;

aspect_ratio_classes = "aspect:", "[", ratios, [",", "auto", ",", "square", ",", "video"], "]" ;
ratios            = { ratio, [","] } ;
ratio             = integer, "/", integer | "auto" ;

box_sizing_classes = "box_sizing:", "[", "border-box", "content-box", "]" ;

typography_classes = "typography", "{",
                     font_family_classes, font_size_classes,
                     font_weight_classes, font_style_classes,
                     font_variant_classes, line_height_classes,
                     letter_spacing_classes, word_spacing_classes,
                     text_align_classes, text_decoration_classes,
                     text_transform_classes, white_space_classes,
                     text_overflow_classes, writing_mode_classes,
                     "}" ;

font_family_classes = "font_family:", "[", families, [",", "sans", ",", "serif", ",", "mono"], "]" ;
families          = { family, [","] } ;
family            = string | generic_family ;
generic_family    = "serif" | "sans-serif" | "monospace" | "cursive"
                  | "fantasy" | "system-ui" | "emoji" | "math" | "fangsong" ;

font_size_classes = "font_size:", "[", size_scale, [",", "fluid"], "]" ;
size_scale        = scaling_system | "[", font_sizes, "]" ;
scaling_system    = "scale:", ( "linear" | "modular" | "golden" | "perfect-fourth"
                              | "major-third" ), ",", "base:", number, ",", "ratio:", number ;
font_sizes        = { font_size, [","] } ;
font_size         = length_value | css_variable ;

font_weight_classes = "font_weight:", "[",
                      weights, [",", "thin", ",", "light", ",", "normal",
                      ",", "medium", ",", "semibold", ",", "bold", ",", "extrabold"],
                      "]" ;
weights           = { weight_value, [","] } ;
weight_value      = integer | "normal" | "bold" | "lighter" | "bolder" ;

font_style_classes = "font_style:", "[", "normal", "italic", "oblique", "]" ;
font_variant_classes = "font_variant:", "[",
                       "normal", "small-caps", "all-small-caps",
                       "petite-caps", "all-petite-caps", "unicase",
                       "titling-caps", "ordinal", "slashed-zero",
                       "lining-nums", "oldstyle-nums", "proportional-nums",
                       "tabular-nums", "diagonal-fractions", "stacked-fractions",
                       "]" ;

line_height_classes = "line_height:", "[",
                      line_heights, [",", "none", ",", "tight", ",", "snug",
                      ",", "normal", ",", "relaxed", ",", "loose"],
                      "]" ;
line_heights      = { line_height, [","] } ;
line_height       = number | length_value ;

letter_spacing_classes = "letter_spacing:", "[",
                         spacings, [",", "tighter", ",", "tight",
                         ",", "normal", ",", "wide", ",", "wider"],
                         "]" ;
spacings          = { spacing, [","] } ;
spacing           = length_value ;

word_spacing_classes = "word_spacing:", "[", spacings, [",", "normal"], "]" ;

text_align_classes = "text_align:", "[", "left", "center", "right", "justify", "start", "end", "]" ;

text_decoration_classes = "text_decoration:", "[",
                          "line:", "[", "underline", "overline", "line-through", "none", "]", ",",
                          "style:", "[", "solid", "double", "dotted", "dashed", "wavy", "]", ",",
                          "thickness:", length_values, ",",
                          "offset:", length_values,
                          "]" ;

text_transform_classes = "text_transform:", "[", "uppercase", "lowercase", "capitalize", "none", "]" ;

white_space_classes = "white_space:", "[",
                      "normal", "nowrap", "pre", "pre-line", "pre-wrap",
                      "break-spaces",
                      "]" ;

text_overflow_classes = "text_overflow:", "[", "ellipsis", "clip", "(", string, ")", "]" ;

writing_mode_classes = "writing_mode:", "[", "horizontal-tb", "vertical-rl", "vertical-lr", "]" ;

color_classes     = "colors", "{",
                    text_color_classes, background_color_classes,
                    border_color_classes, fill_classes, stroke_classes,
                    accent_color_classes, color_scheme_classes,
                    opacity_classes, "}" ;

text_color_classes = "text:", "[",
                     color_values, [",", "current", ",", "inherit", ",", "transparent"],
                     "]" ;

background_color_classes = "bg:", "[",
                           color_values, [",", "current", ",", "inherit", ",", "transparent"],
                           "]" ;

border_color_classes = "border:", "[",
                       color_values, [",", "current", ",", "inherit", ",", "transparent"],
                       "]" ;

fill_classes      = "fill:", "[", color_values, [",", "current", ",", "none"], "]" ;

stroke_classes    = "stroke:", "[", color_values, [",", "current", ",", "none"], "]" ;

accent_color_classes = "accent:", "[", color_values, [",", "auto"], "]" ;

color_scheme_classes = "color_scheme:", "[", "light", "dark", "only", "light dark", "]" ;

opacity_classes   = "opacity:", "[",
                    opacity_values, [",", "0", ",", "5", ",", "10", ",", "20",
                    ",", "25", ",", "30", ",", "40", ",", "50", ",", "60",
                    ",", "70", ",", "75", ",", "80", ",", "90", ",", "95",
                    ",", "100"],
                    "]" ;
opacity_values    = { opacity_value, [","] } ;
opacity_value     = number | percentage ;

color_values      = { color_value, [","] } ;
color_value       = named_color | hex_color | rgb_color | rgba_color
                  | hsl_color | hsla_color | css_variable | current_color ;
named_color       = "transparent" | "currentColor" | "inherit" | color_name ;
current_color     = "currentColor" ;
color_name        = "red" | "green" | "blue" | "black" | "white" | "gray"
                  | "slate" | "zinc" | "neutral" | "stone" | "orange"
                  | "amber" | "yellow" | "lime" | "emerald" | "teal"
                  | "cyan" | "sky" | "indigo" | "violet" | "purple"
                  | "fuchsia" | "pink" | "rose" ;

background_classes = "backgrounds", "{",
                     bg_image_classes, bg_position_classes,
                     bg_size_classes, bg_repeat_classes,
                     bg_attachment_classes, bg_blend_mode_classes,
                     bg_clip_classes, bg_origin_classes,
                     "}" ;

bg_image_classes  = "image:", "[", image_sources, [",", "none"], "]" ;
image_sources     = { image_source, [","] } ;
image_source      = "url(", string, ")" | gradient_spec | "none" ;

bg_position_classes = "position:", "[",
                      positions, [",", "center", ",", "top", ",", "bottom",
                      ",", "left", ",", "right"],
                      "]" ;
positions         = { position, [","] } ;
position          = length_value | percentage | position_keyword ;
position_keyword  = "left" | "right" | "top" | "bottom" | "center" ;

bg_size_classes   = "size:", "[", sizes, [",", "auto", ",", "cover", ",", "contain"], "]" ;
sizes             = { size, [","] } ;
size              = length_value | percentage | "auto" | "cover" | "contain" ;

bg_repeat_classes = "repeat:", "[",
                    repeat_styles, [",", "repeat", ",", "no-repeat",
                    ",", "repeat-x", ",", "repeat-y", ",", "round", ",", "space"],
                    "]" ;
repeat_styles     = { repeat_style, [","] } ;
repeat_style      = "repeat" | "no-repeat" | "repeat-x" | "repeat-y"
                  | "round" | "space" ;

bg_attachment_classes = "attachment:", "[", "fixed", "local", "scroll", "]" ;

bg_blend_mode_classes = "blend_mode:", "[", blend_modes, [",", "normal", ",", "multiply"], "]" ;
blend_modes       = { blend_mode, [","] } ;
blend_mode        = "normal" | "multiply" | "screen" | "overlay" | "darken"
                  | "lighten" | "color-dodge" | "color-burn" | "hard-light"
                  | "soft-light" | "difference" | "exclusion" | "hue"
                  | "saturation" | "color" | "luminosity" ;

bg_clip_classes   = "clip:", "[", "border-box", "padding-box", "content-box", "text", "]" ;

bg_origin_classes = "origin:", "[", "border-box", "padding-box", "content-box", "]" ;

border_classes    = "borders", "{",
                    border_width_classes, border_style_classes,
                    border_color_classes, border_radius_classes,
                    border_collapse_classes, border_spacing_classes,
                    outline_classes, "}" ;

border_width_classes = "width:", "[", sides, ":", border_widths, [","], "]" ;
border_widths     = { border_width, [","] } ;
border_width      = length_value | "thin" | "medium" | "thick" ;

border_style_classes = "style:", "[",
                       border_styles, [",", "solid", ",", "dashed", ",", "dotted"],
                       "]" ;
border_styles     = { border_style, [","] } ;
border_style      = "solid" | "dashed" | "dotted" | "double" | "groove"
                  | "ridge" | "inset" | "outset" | "none" | "hidden" ;

border_radius_classes = "radius:", "[", corners, ":", radius_values, [","], "]" ;
corners           = "" | "t" | "r" | "b" | "l" | "tl" | "tr" | "br" | "bl"
                  | "start" | "end" | "start-start" | "start-end"
                  | "end-start" | "end-end" ;
radius_values     = { radius_value, [","] } ;
radius_value      = length_value | percentage | "full" | "none" ;

border_collapse_classes = "collapse:", "[", "collapse", "separate", "]" ;
border_spacing_classes = "spacing:", "[", spacing_values, "]" ;

outline_classes   = "outline:", "[",
                    "width:", outline_widths, ",",
                    "style:", outline_styles, ",",
                    "color:", color_values, ",",
                    "offset:", length_values,
                    "]" ;
outline_widths    = { length_value, [","] } | "thin" | "medium" | "thick" ;
outline_styles    = { border_style, [","] } | "auto" ;

effects_classes   = "effects", "{",
                    box_shadow_classes, text_shadow_classes,
                    mix_blend_mode_classes, filter_classes,
                    backdrop_filter_classes, "}" ;

box_shadow_classes = "box_shadow:", "[",
                     shadows, [",", "none", ",", "sm", ",", "md", ",", "lg",
                     ",", "xl", ",", "2xl", ",", "inner", ",", "outline"],
                     "]" ;
shadows           = { shadow, [","] } ;
shadow            = length_value, length_value, [ length_value ], [ length_value ], color_value
                  | "inset", length_value, length_value, [ length_value ], [ length_value ], color_value ;

text_shadow_classes = "text_shadow:", "[", shadows, [",", "none"], "]" ;

mix_blend_mode_classes = "mix_blend:", "[", blend_modes, [",", "normal"], "]" ;

filter_classes    = "filter:", "[",
                    filter_functions, [",", "none", ",", "blur", ",", "brightness",
                    ",", "contrast", ",", "drop-shadow", ",", "grayscale",
                    ",", "hue-rotate", ",", "invert", ",", "saturate",
                    ",", "sepia"],
                    "]" ;
filter_functions  = { filter_function, [","] } ;
filter_function   = "blur(", length_value, ")"
                  | "brightness(", percentage, ")"
                  | "contrast(", percentage, ")"
                  | "drop-shadow(", shadow, ")"
                  | "grayscale(", percentage, ")"
                  | "hue-rotate(", angle, ")"
                  | "invert(", percentage, ")"
                  | "saturate(", percentage, ")"
                  | "sepia(", percentage, ")"
                  | "url(", string, ")" ;

backdrop_filter_classes = "backdrop_filter:", "[", filter_functions, [",", "none"], "]" ;

transform_classes = "transforms", "{",
                    transform_2d_classes, transform_3d_classes,
                    transform_origin_classes, transform_style_classes,
                    perspective_classes, perspective_origin_classes,
                    backface_visibility_classes, "}" ;

transform_2d_classes = "2d:", "[",
                       transforms_2d, [",", "translate", ",", "rotate",
                       ",", "scale", ",", "skew", ",", "matrix"],
                       "]" ;
transforms_2d     = { transform_2d, [","] } ;
transform_2d      = "translate(", length_value, [ ",", length_value ], ")"
                  | "translateX(", length_value, ")"
                  | "translateY(", length_value, ")"
                  | "scale(", number, [ ",", number ], ")"
                  | "scaleX(", number, ")"
                  | "scaleY(", number, ")"
                  | "rotate(", angle, ")"
                  | "skew(", angle, [ ",", angle ], ")"
                  | "skewX(", angle, ")"
                  | "skewY(", angle, ")"
                  | "matrix(", number, ",", number, ",", number, ",", number, ",", number, ",", number, ")" ;

transform_3d_classes = "3d:", "[",
                       transforms_3d, [",", "translate3d", ",", "scale3d",
                       ",", "rotate3d", ",", "matrix3d", ",", "perspective"],
                       "]" ;
transforms_3d     = { transform_3d_class, [","] } ;
transform_3d_class = "translate3d(", length_value, ",", length_value, ",", length_value, ")"
                  | "scale3d(", number, ",", number, ",", number, ")"
                  | "rotate3d(", number, ",", number, ",", number, ",", angle, ")"
                  | "matrix3d(", matrix_4x4, ")"
                  | "perspective(", length_value, ")" ;

transform_origin_classes = "origin:", "[",
                           origins, [",", "center", ",", "top", ",", "bottom",
                           ",", "left", ",", "right"],
                           "]" ;
origins           = { origin, [","] } ;
origin            = length_value | percentage | position_keyword ;

transform_style_classes = "style:", "[", "flat", "preserve-3d", "]" ;
perspective_classes = "perspective:", "[", length_values, [",", "none"], "]" ;
perspective_origin_classes = "perspective_origin:", "[", origins, "]" ;
backface_visibility_classes = "backface:", "[", "visible", "hidden", "]" ;

transition_classes = "transitions", "{",
                     transition_property_classes, transition_duration_classes,
                     transition_timing_classes, transition_delay_classes,
                     "}" ;

transition_property_classes = "property:", "[",
                              properties, [",", "all", ",", "none", ",", "colors",
                              ",", "opacity", ",", "shadow", ",", "transform"],
                              "]" ;
properties        = { property, [","] } ;

transition_duration_classes = "duration:", "[",
                              durations, [",", "75", ",", "100", ",", "150",
                              ",", "200", ",", "300", ",", "500", ",", "700",
                              ",", "1000"],
                              "]" ;
durations         = { duration, [","] } ;
duration          = time_value | integer ;
time_value        = integer, time_unit ;

transition_timing_classes = "timing:", "[",
                            timing_functions, [",", "linear", ",", "ease",
                            ",", "ease-in", ",", "ease-out", ",", "ease-in-out"],
                            "]" ;
timing_functions  = { timing_function, [","] } ;
timing_function   = cubic_bezier | steps | spring | "linear" | "ease"
                  | "ease-in" | "ease-out" | "ease-in-out" ;

transition_delay_classes = "delay:", "[",
                           delays, [",", "0", ",", "75", ",", "100", ",", "150",
                           ",", "200", ",", "300", ",", "500", ",", "700",
                           ",", "1000"],
                           "]" ;
delays            = { delay, [","] } ;
delay             = time_value | integer ;

animation_classes = "animations", "{",
                    animation_name_classes, animation_duration_classes,
                    animation_timing_classes, animation_delay_classes,
                    animation_iteration_classes, animation_direction_classes,
                    animation_fill_mode_classes, animation_play_state_classes,
                    keyframe_classes, "}" ;

animation_name_classes = "name:", "[", animation_names, [",", "none"], "]" ;
animation_names   = { identifier, [","] } ;

animation_duration_classes = "duration:", "[", durations, "]" ;
animation_timing_classes = "timing:", "[", timing_functions, "]" ;
animation_delay_classes = "delay:", "[", delays, "]" ;

animation_iteration_classes = "iteration:", "[",
                              iterations, [",", "infinite", ",", "1", ",", "2",
                              ",", "3"],
                              "]" ;
iterations        = { iteration, [","] } ;
iteration         = integer | "infinite" ;

animation_direction_classes = "direction:", "[",
                              "normal", "reverse", "alternate", "alternate-reverse",
                              "]" ;

animation_fill_mode_classes = "fill_mode:", "[",
                              "none", "forwards", "backwards", "both",
                              "]" ;

animation_play_state_classes = "play_state:", "[", "running", "paused", "]" ;

keyframe_classes  = "keyframes:", "[",
                    keyframe_definitions, [",", "spin", ",", "ping", ",", "pulse",
                    ",", "bounce", ",", "fade", ",", "slide"],
                    "]" ;
keyframe_definitions = { keyframe_definition, [","] } ;
keyframe_definition = identifier, "{", keyframe_steps, "}" ;
keyframe_steps    = { keyframe_step, [","] } ;
keyframe_step     = percentage, "{", declarations, "}"
                  | "from", "{", declarations, "}"
                  | "to", "{", declarations, "}" ;

svg_classes       = "svg", "{",
                    svg_fill_classes, svg_stroke_classes,
                    svg_stroke_width_classes, svg_stroke_dasharray_classes,
                    svg_stroke_linecap_classes, svg_stroke_linejoin_classes,
                    svg_vector_effect_classes, svg_paint_order_classes,
                    "}" ;

svg_fill_classes  = "fill:", "[", color_values, [",", "none", ",", "currentColor"], "]" ;

svg_stroke_classes = "stroke:", "[", color_values, [",", "none", ",", "currentColor"], "]" ;

svg_stroke_width_classes = "stroke_width:", "[", stroke_widths, [",", "0", ",", "1", ",", "2"], "]" ;
stroke_widths     = { length_value, [","] } ;

svg_stroke_dasharray_classes = "stroke_dasharray:", "[", dash_arrays, [",", "none"], "]" ;
dash_arrays       = { dash_array, [","] } ;
dash_array        = length_value | "none" ;

svg_stroke_linecap_classes = "stroke_linecap:", "[", "butt", "round", "square", "]" ;

svg_stroke_linejoin_classes = "stroke_linejoin:", "[", "miter", "round", "bevel", "arcs", "]" ;

svg_vector_effect_classes = "vector_effect:", "[",
                            "none", "non-scaling-stroke", "non-rotation",
                            "fixed-position",
                            "]" ;

svg_paint_order_classes = "paint_order:", "[", "normal", "fill", "stroke", "markers", "]" ;

tensor_classes    = "tensor", "{",
                    tensor_opacity_classes, tensor_transform_classes,
                    tensor_blend_classes, tensor_animation_classes,
                    tensor_gradient_classes, "}" ;

tensor_opacity_classes = "opacity:", "[", tensor_opacity_values, [",", "dynamic"], "]" ;
tensor_opacity_values = { tensor_opacity_value, [","] } ;
tensor_opacity_value = weight_spec | tensor_reference ;

tensor_transform_classes = "transform:", "[",
                           tensor_transforms, [",", "matrix3d", ",", "perspective"],
                           "]" ;
tensor_transforms = { tensor_transform, [","] } ;
tensor_transform  = weight_spec | tensor_function ;

tensor_blend_classes = "blend:", "[",
                       tensor_blend_modes, [",", "normal", ",", "tensor-mix"],
                       "]" ;
tensor_blend_modes = { tensor_blend_mode, [","] } ;
tensor_blend_mode  = "tensor-mix" | "tensor-overlay" | "tensor-dodge" ;

tensor_animation_classes = "animation:", "[",
                           tensor_animations, [",", "tensor-flow", ",", "tensor-wave"],
                           "]" ;
tensor_animations = { tensor_animation, [","] } ;
tensor_animation  = "tensor-keyframes(", tensor_spec, ")" ;

tensor_gradient_classes = "gradient:", "[",
                          tensor_gradients, [",", "tensor-linear", ",", "tensor-radial"],
                          "]" ;
tensor_gradients  = { tensor_gradient, [","] } ;
tensor_gradient   = "tensor-linear(", tensor_spec, ")"
                  | "tensor-radial(", tensor_spec, ")" ;

tensor_reference  = identifier ;
tensor_function   = identifier, "(", tensor_args, ")" ;
tensor_args       = tensor_spec, { ",", tensor_spec } ;

interactivity_classes = "interactivity", "{",
                        cursor_classes, pointer_events_classes,
                        resize_classes, user_select_classes,
                        scroll_behavior_classes, scroll_margin_classes,
                        scroll_padding_classes, scroll_snap_classes,
                        touch_action_classes, will_change_classes,
                        "}" ;

cursor_classes    = "cursor:", "[",
                    cursor_values, [",", "auto", ",", "default", ",", "pointer",
                    ",", "text", ",", "move", ",", "not-allowed", ",", "wait",
                    ",", "progress", ",", "help", ",", "context-menu",
                    ",", "cell", ",", "crosshair", ",", "vertical-text",
                    ",", "alias", ",", "copy", ",", "no-drop", ",", "grab",
                    ",", "grabbing", ",", "all-scroll", ",", "col-resize",
                    ",", "row-resize", ",", "n-resize", ",", "e-resize",
                    ",", "s-resize", ",", "w-resize", ",", "ne-resize",
                    ",", "nw-resize", ",", "se-resize", ",", "sw-resize",
                    ",", "ew-resize", ",", "ns-resize", ",", "nesw-resize",
                    ",", "nwse-resize", ",", "zoom-in", ",", "zoom-out"],
                    "]" ;
cursor_values     = { cursor_value, [","] } ;
cursor_value      = string | "url(", string, ")", [ number, number ] ;

pointer_events_classes = "pointer_events:", "[", "none", "auto", "]" ;

resize_classes    = "resize:", "[",
                    "none", "both", "horizontal", "vertical", "block", "inline",
                    "]" ;

user_select_classes = "user_select:", "[", "none", "text", "all", "auto", "]" ;

scroll_behavior_classes = "scroll_behavior:", "[", "auto", "smooth", "]" ;

scroll_margin_classes = "scroll_margin:", "[", sides, ":", spacing_values, [","], "]" ;

scroll_padding_classes = "scroll_padding:", "[", sides, ":", spacing_values, [","], "]" ;

scroll_snap_classes = "scroll_snap:", "[",
                      "align:", "[", "start", "end", "center", "none", "]", ",",
                      "type:", "[", "none", "x", "y", "both", "mandatory", "proximity", "]",
                      "]" ;

touch_action_classes = "touch_action:", "[", "auto", "none", "pan-x", "pan-y", "manipulation", "]" ;

will_change_classes = "will_change:", "[",
                      properties, [",", "auto", ",", "scroll", ",", "contents",
                      ",", "transform", ",", "opacity"],
                      "]" ;

table_classes     = "tables", "{",
                    table_layout_classes, caption_side_classes,
                    empty_cells_classes, "}" ;

table_layout_classes = "layout:", "[", "auto", "fixed", "]" ;
caption_side_classes = "caption_side:", "[", "top", "bottom", "]" ;
empty_cells_classes = "empty_cells:", "[", "show", "hide", "]" ;

form_classes      = "forms", "{", appearance_classes, caret_color_classes, "}" ;

appearance_classes = "appearance:", "[",
                     "none", "auto", "textfield", "menulist-button",
                     "searchfield", "textarea", "push-button", "slider-horizontal",
                     "checkbox", "radio", "square-button", "menulist",
                     "listbox", "meter", "progress-bar",
                     "]" ;

caret_color_classes = "caret_color:", "[", color_values, [",", "auto"], "]" ;

accessibility_classes = "accessibility", "{", forced_color_adjust_classes, color_adjust_classes, "}" ;

forced_color_adjust_classes = "forced_color_adjust:", "[", "auto", "none", "]" ;

color_adjust_classes = "color_adjust:", "[", "economy", "exact", "]" ;

utility_classes   = "utilities", "{", container_classes, sr_only_classes, not_sr_only_classes, "}" ;

container_classes = "container:", "[", container_breakpoints, [",", "center"], "]" ;
container_breakpoints = { breakpoint, [","] } ;
breakpoint        = identifier, ":", length_value ;

sr_only_classes   = "sr_only:", "[", "sr-only", "not-sr-only", "]" ;
not_sr_only_classes = "not_sr_only:", "[", "not-sr-only", "]" ;

custom_classes    = "custom", identifier, "{", class_generation_rules, "}" ;

class_generation_rules = { generation_rule } ;
generation_rule   = "generate", class_pattern, "from", data_source,
                    "with", generator_function ;

class_pattern     = string ;
generator_function = identifier | lambda_expression ;
lambda_expression = "(", parameters, ")", "=>", expression ;
parameters        = { identifier, [","] } ;

css_variable      = "var(", string, [ ",", fallback_value ], ")" ;
fallback_value    = css_value ;

tensor_spec       = tensor_value ;
model_spec        = string | identifier ;
css_condition     = "STATE", identifier | "HAS", selector ;
value             = css_value | sql_value ;

property          = identifier | custom_property ;
custom_property   = "--", identifier ;
identifier        = letter, { letter | digit | "-" | "_" } ;
integer           = digit, { digit } ;
hex_digit         = digit | "a" | "b" | "c" | "d" | "e" | "f" | "A" | "B" | "C" | "D" | "E" | "F" ;
letter            = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;
digit             = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
character         = ? any Unicode character ? ;

class             = ".", identifier ;
id                = "#", identifier ;
element           = identifier ;
pseudo            = ":", ( "hover" | "focus" | "active" | "visited" | "before" | "after"
                         | "first-child" | "last-child" | "nth-child(", expression, ")" ) ;
attribute         = "[", identifier, [ ( "=" | "~=" | "|=" | "^=" | "$=" | "*=" ), string ], "]" ;
combinator        = " " | ">" | "+" | "~" ;
```

### 13.6 Unified Example (TodoMVC)

```asxr
@block todo_app {
  schema: {
    properties: {
      todos: [@todo_item],
      filter: ["all", "active", "completed"]
    }
  }
}

@dom component[todo-app] {
  children: [
    @dom element[header] {
      children: [
        @dom element[h1] { text: "todos" },
        @dom component[todo-input]
      ]
    },
    @dom component[todo-list] {
      bind: {{todos}},
      filter: {{filter}}
    }
  ]
}

function addTodo(text) {
  @propose_dom {
    prior: {{current_dom_hash}},
    next: {
      root: "todo-app",
      tree: @dom component[todo-list] {
        children: [
          {{existing_todos}},
          @dom component[todo-item] {
            text: {{text}},
            completed: false
          }
        ]
      }
    },
    patch: [
      {
        type: "CREATE",
        target: "{{todos.length}}",
        data: #createTodoItem({{text}})
      }
    ]
  }
}

jsx: <TodoApp todos={todos} filter={filter} />

vanilla: @dom frame[body] {
  children: [#todo-app]
}

raf: [
  @dom style[todo-item:last-child] {
    prop: animation = "fadeIn 0.3s"
  }
]
```

## 14. π-Geometric Tensor Calculus Specification (Extension)

This section defines a lightweight annotation DSL used for π-geometric tensor calculus and
WebGPU/Phi-3 architecture notes.

```ebnf
quantum_spec_document     = { spec_section } ;
spec_section              = quantum_foundation_block | architecture_block
                          | heading | code_block | text_block ;

quantum_foundation_block  = "@quantum_geometric_foundation", nl,
                            indent, { foundation_entry }, dedent ;
foundation_entry          = annotation_pair | core_unification_block ;

core_unification_block    = "@core.unification", nl,
                            indent, { theorem_block }, dedent ;
theorem_block             = "@theorem", ".", integer, ":", string_literal, nl,
                            indent,
                            "formal:", annotation_value, nl,
                            "where:", nl, indent, { where_entry }, dedent,
                            "interpretation:", block_string,
                            dedent ;

where_entry               = annotation_key, where_op, annotation_value, nl ;
where_op                  = ":" | "=" | "∈" ;

architecture_block        = heading, nl, { annotation_pair | code_block | text_block } ;

annotation_pair           = annotation_key, ":", annotation_value, nl ;
annotation_key            = qualified_identifier | identifier ;
annotation_value          = string_literal | number_literal | identifier
                          | block_string | free_text ;

heading                   = "#", { "#" }, sp, free_text, nl ;
code_block                = "```", identifier, nl, { code_line }, "```", nl ;
code_line                 = { character - nl }, nl ;
text_block                = { text_line } ;
text_line                 = free_text, nl ;
free_text                 = { character - nl } ;
```
