import { describe, expect, it } from 'vitest';
import { optional, token } from './tokens';

describe('token()', () => {
  it('should return a token with description it is specified', () => {
    expect(token().symbol.description).toBeUndefined();
    expect(token('text1').symbol.description).toBe('text1');
    expect(token({ description: 'text2' }).symbol.description).toBe('text2');
  });

  it('should return independent tokens if key is not specified', () => {
    const t1 = token();
    const t2 = token();

    expect(t1).not.toBe(t2);
    expect(t1.symbol).not.toBe(t2.symbol);
    expect(t1.isOptional).not.toBeTruthy();
  });

  it('should return tokens with the same symbol if key is specified', () => {
    const source = token({ key: 'test-token' });
    const clone = token({ key: 'test-token' });
    const something = token({ key: 'something-else' });

    expect(source).not.toBe(clone);
    expect(source.symbol).toBe(clone.symbol);

    expect(something).not.toBe(source);
    expect(something.symbol).not.toBe(source);
  });
});

describe('optional()', () => {
  it('should decorate a source token to attach an optional value', () => {
    const t1 = token<number>();
    expect(t1.isOptional).not.toBeTruthy();

    const o1 = optional(t1);
    expect(o1.symbol).toBe(t1.symbol);
    expect(o1.isOptional).toBe(true);

    const o2 = optional(t1, -1);
    expect(o2.symbol).toBe(t1.symbol);
    expect(o2.isOptional).toBe(true);
    expect(o2.optionalValue).toBe(-1);
  });

  it('should reuse symbol from a source token if its key is specified', () => {
    const source = token({ key: 'token-key' });
    const clone = token({ key: 'token-key' });
    const optClone = optional(clone);

    expect(optClone.symbol).toBe(source.symbol);
  });
});
