// This file will relly on state.js

// Language definition

// START -> TERM '.' START
// START -> TERM

// TERM -> '**'
// TERM -> REST
// TERM -> NAME
// TERM -> '*'  
// TERM -> NAME REST
// TERM -> '*'  REST

// REST -> REST REST
// REST -> ':' NAME
// REST -> '[' BREAKET
// REST -> '#' NAME

// BREAKET -> NAME ']'
// BREAKET -> NAME '===' VALUE ']'
// BREAKET -> NAME '!==' VALUE ']'
// BREAKET -> NAME '=='  VALUE ']'
// BREAKET -> NAME '!='  VALUE ']'
// BREAKET -> NAME '<'   VALUE ']'
// BREAKET -> NAME '>'   VALUE ']'
// BREAKET -> NAME '<='  VALUE ']'
// BREAKET -> NAME '>='  VALUE ']'

// VALUE -> VALUE VALUE
// VALUE -> NAME 
// VALUE -> '{{' NAME '}}'





// START -> '**' NEXT
// START -> '*'  NEXT
// START -> NAME NEXT
// START -> '*'  REST
// START -> NAME REST

// START -> ':' IDENT
// START -> '#' IDENT
// START -> '[' ATTR

// REST -> ':' IDENT
// REST -> '#' IDENT
// REST -> '[' ATTR

// IDENT -> NAME NEXT
// IDENT -> NAME REST

// NEXT -> '.' START
// NEXT -> END

// ATTR  -> NAME OPERA
// OPERA -> ']' REST
// OPERA -> ']' NEXT
// OPERA -> '===' VALUE
// OPERA -> '!==' VALUE
// OPERA -> '!='  VALUE
// OPERA -> '=='  VALUE
// OPERA -> '<'   VALUE
// OPERA -> '<='  VALUE
// OPERA -> '>'   VALUE
// OPERA -> '>='  VALUE

// VALUE -> '{{' CURL
// VALUE -> NAME VALUE
// VALUE -> NAME VAEND
// VAEND -> ']' REST
// VAEND -> ']' NEXT

// CURL  -> NAME CURL2
// CURL2 -> '}}' VALUE
// CURL2 -> '}}' VAEND










