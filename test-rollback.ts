// This file intentionally has linting errors to test rollback mechanism
const unusedVariable = "this will cause a linting error";
const anotherUnused = "this will also cause an error";

// Missing return type annotation
function badFunction(param) {
  return param + 1;
}

// This will cause TypeScript errors
const badType: string = 123;
