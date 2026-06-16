const code = document.getElementById("code");
let variables = [];
let values = [];

function run() {
console.clear();
let currCode = code.value;

print: {
    if (currCode.includes("print('") || currCode.includes('print("')) {
        console.log(currCode.length);
        console.log(currCode.slice(7, Math.abs(2 - currCode.length)));
    } else {
        if (currCode.includes("print(")) { 
            let found = false
            for (const variable of variables) {
                if (variable == currCode.slice(6, Math.abs(1 - currCode.length))) {
                    console.log(values[variables.indexOf(variable)]);
                    break print;
                }
            }
            console.log("Expected Number, got: " + currCode.slice(6, Math.abs(1 - currCode.length)));
        }
    }
}
local: {
    if (currCode.includes("local")) {
        variables.push(currCode.slice(6, currCode.indexOf("=")- 1));
        values.push(currCode.slice(currCode.indexOf("=") + 2, currCode.length));
    }
}
}
