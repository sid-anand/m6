const util = require('../distribution').util;

test('object with date', () => {
  const obj = {date: new Date()};
  const serialized = util.serialize(obj);
  const deserialized = util.deserialize(serialized);
  expect(deserialized.date instanceof Date);
  expect(deserialized.date.getTime()).toBe(obj.date.getTime());
});

test('boolean false', () => {
  const bool = false;
  const serialized = util.serialize(bool);
  const deserialized = util.deserialize(serialized);
  expect(bool).toBe(deserialized);
});

test('object loop of length 3', () => {
  const o1 = {};
  const o2 = {o: o1};
  const o3 = {o: o2};
  o1.o = o3;
  const serialized = util.serialize(o1);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(o1);
});

test('serialize eval', () => {
  const fn = eval;
  const serialized = util.serialize(fn);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized).toBe('function');
  expect(deserialized('1+2')).toBe(3);
});

test('serialize ArrayBuffer.prototype', () => {
  const fn = ArrayBuffer.prototype;
  const serialized = util.serialize(fn);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized).toBe('object');
});

test('object with multiple self-references', () => {
  const obj = {
    a: {
      aa: {},
    },
    b: {},
  };
  obj.ref = obj;
  obj.a.ref = obj;
  obj.b.ref = obj;
  obj.a.aa.ref = obj;
  const serialized = util.serialize(obj);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(obj);
});

test('array with n elements', () => {
  const n = 100;
  const arr = [...Array(n).keys()];
  console.time('serialize');
  const serialized = util.serialize(arr);
  console.timeEnd('serialize');
  console.time('deserialize');
  const deserialized = util.deserialize(serialized);
  console.timeEnd('deserialize');
  expect(deserialized).toEqual(arr);
});

test('array with n funcs', () => {
  const n = 10000;
  const add = (a, b) => a + b;
  const arr = new Array(n).fill(add);
  console.time('serialize');
  const serialized = util.serialize(arr);
  console.timeEnd('serialize');
  console.time('deserialize');
  const deserialized = util.deserialize(serialized);
  console.timeEnd('deserialize');
  deserialized.forEach((func) => {
    expect(typeof func).toBe('function');
    expect(func(1, 2)).toBe(3);
  });
});

test('array with n native objects', () => {
  const n = 10000;
  const arr = new Array(n).fill(globalThis.history);
  console.time('serialize');
  const serialized = util.serialize(arr);
  console.timeEnd('serialize');
  console.time('deserialize');
  const deserialized = util.deserialize(serialized);
  console.timeEnd('deserialize');
  expect(deserialized).toEqual(arr);
});
