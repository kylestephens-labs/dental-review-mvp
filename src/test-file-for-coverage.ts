// Test file to create changes for diff coverage testing
export function testFunction() {
  console.log('This is a test function');
  return 'test result';
}

export function anotherFunction() {
  const unused = 'this should not be covered';
  return 'another result';
}
