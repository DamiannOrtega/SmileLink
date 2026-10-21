import test from 'node:test';
import assert from 'node:assert/strict';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

test('Unit test frontend: cn combina clases css correctamente', () => {
  const result = cn('px-2 py-1', 'bg-blue-500');
  assert.equal(result, 'px-2 py-1 bg-blue-500');
});

test('Unit test frontend: cn resuelve conflictos de Tailwind', () => {
  const result = cn('px-2', 'px-4');
  assert.equal(result, 'px-4');
});

test('Unit test frontend: cn ignora valores booleanos o falsy', () => {
  const result = cn('btn', false && 'hidden', null, undefined, 'btn-primary');
  assert.equal(result, 'btn btn-primary');
});
