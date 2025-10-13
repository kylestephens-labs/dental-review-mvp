// Test feature in production code without kill switch
export function newProductionFeature() {
  console.log('This is a new production feature without any kill switches');
  return 'production-feature-result';
}
