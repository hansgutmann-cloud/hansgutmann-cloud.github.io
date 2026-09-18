/** S3. compose(p,q) means p∘q, so q acts first. No hard-coded group table. */
export const identity = [0, 1, 2];
export const a = [1, 2, 0];
export const b = [1, 0, 2];
export const compose = (p, q) => q.map(i => p[i]);
export const equal = (p, q) => p.every((v, i) => v === q[i]);
export const inverse = p => p.map((_, i) => p.indexOf(i));
export const elements = [identity, a, compose(a,a), b, compose(a,b), compose(compose(a,a),b)];
export const labels = ['e', 'a', 'a²', 'b', 'ab', 'a²b'];
export function indexOf(p) { return elements.findIndex(q => equal(p,q)); }
export function table() { return elements.map(p => elements.map(q => indexOf(compose(p,q)))); }
export function verify() {
  let associativity = 0;
  for (const p of elements) for (const q of elements) for (const r of elements) {
    if (!equal(compose(compose(p,q),r),compose(p,compose(q,r)))) throw new Error('Associativity failure');
    associativity++;
  }
  return {
    order: elements.length, associativity,
    closure: table().every(row => row.every(i => i >= 0)),
    inverses: elements.every(p => equal(compose(p,inverse(p)),identity)),
    noncommutative: !equal(compose(a,b),compose(b,a)),
    presentation: equal(compose(compose(a,a),a), identity) && equal(compose(b,b), identity)
      && equal(compose(compose(b,a),b), inverse(a))
  };
}
