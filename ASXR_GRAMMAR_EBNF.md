# ASX-R Language Grammar — Formal Specification (v2.0)

**Document:** `ASXR_GRAMMAR_EBNF.md`
**Status:** 🔒 **CANONICAL / LOCKED**
**Authority:** ASX-R Runtime Language
**Scope:** Formal syntactic and structural definition

## 1. Core Runtime Language EBNF

### 1.1 Atomic Block Structure

```ebnf
atomic_block         = "@", block_type, [ block_id ], "{", block_body, "}" ;
block_type           = identifier | quoted_string ;
block_id             = "[", identifier, "]" ;
block_body           = { property_assignment | nested_block } ;
property_assignment  = property_name, ":", value, ";" ;
property_name        = identifier | "@", identifier ;
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
program              = { block | statement | plugin_directive } ;
block                = atomic_block | dom_block | component_def ;
block_body           = { statement | expression | nested_block } ;
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

### 2.3 Control Flow as Plugin Statements

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

### 2.4 Statement Forms

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
                   boolean_literal | null_literal ;
string_literal   = '"', { character - '"' }, '"' ;
number_literal   = integer | float ;
integer          = [ "-" ], digit, { digit } ;
float            = integer, ".", digit, { digit } ;
boolean_literal  = "true" | "false" ;
null_literal     = "null" ;

reference        = "{{", path_expression, "}}" ;
expression       = arithmetic_expr | logical_expr | comparison_expr ;
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
directive        = "@use", identifier, ";" ;
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
letter           = "A" | "B" | ... | "Z" | "a" | "b" | ... | "z" ;
digit            = "0" | "1" | ... | "9" ;
hex_digit        = digit | "A" | "B" | "C" | "D" | "E" | "F" |
                           "a" | "b" | "c" | "d" | "e" | "f" ;
character        = ? any Unicode character ? ;
sp               = ? whitespace character ? ;
crlf             = "\r\n" ;
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
dom_atomic_block = "@dom", block_type, block_id, "{", dom_operations, "}" ;
block_type       = "frame" | "mutation" | "style" | "layout" ;
block_id         = "[", element_selector, "]" ;
dom_operations   = { dom_operation } ;
dom_operation    = property_op | child_op | attribute_op | class_op ;
property_op      = "prop", ":", identifier, "=", value, ";" ;
child_op         = "children", ":", "[", element_def, { ",", element_def }, "]", ";" ;
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
css_atomic       = "@css", scope, "{", css_rules, "}" ;
scope            = "global" | "scoped" | "shadow" ;
css_rules        = { css_rule } ;
css_rule         = selector, "{", declarations, "}" ;
declarations     = { declaration } ;
declaration      = property, ":", value, ";"
                 | property, ":", array_value, ";" ;

css_in_js        = "@css", "js", "{",
                   "atomic:", boolean, ",",
                   "generate:", ("classes" | "inline" | "variables"), ",",
                   "breakpoints:", array_value, ",",
                   "spacing:", array_value, ",",
                   "colors:", array_value, ",",
                   "rules:", css_rules,
                   "}" ;

value            = string | number | color | function | var_ref | calc ;
array_value      = "[", { value, [","] }, "]" ;
string           = '"', { character }, '"' ;
color            = "#", hex_digit, { hex_digit }
                 | "rgb(", number, ",", number, ",", number, ")"
                 | "rgba(", number, ",", number, ",", number, ",", number, ")" ;
var_ref          = "var(", string, ")" ;
function         = function_name, "(", { value, [","] }, ")" ;
calc             = "calc(", expression, ")" ;
```

```css
@css scoped {
  .button {
    --color-primary: #007bff;
    padding: 8px 16px;
  }

  .button.primary {
    background: var(--color-primary);
  }
}
```

```css
@css js {
  atomic: true,
  generate: classes,
  breakpoints: ["640px", "1024px"],
  spacing: [0, 4, 8, 16],
  colors: ["#111111", "#ffffff", "#007bff"],
  rules: {
    .card {
      padding: [16px, 24px];
      box-shadow: [0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)];
    }
  }
}
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
