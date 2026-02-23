import { render, renderHook } from '@testing-library/react';
import { Container, createContainer, Token, token } from 'ditox';
import React, { useEffect } from 'react';
import { describe, expect, it, Mock, vi } from 'vitest';
import {
  CustomDependencyContainer,
  DependencyContainer,
} from './DependencyContainer';
import { useDependencyContainer } from './hooks';

describe('DependencyContainer', () => {
  it('should provide a new container', () => {
    const { result } = renderHook(useDependencyContainer, {
      wrapper: ({ children }) => (
        <DependencyContainer>{children}</DependencyContainer>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should connect a new container with a parent one in case "root" property is not set', () => {
    const FOO = token('FOO');
    const BAR = token('BAR');

    const parentContainer = createContainer();
    parentContainer.bindValue(FOO, 'foo');

    const binder = (container: Container) => {
      container.bindValue(BAR, 'bar');
    };

    const { result } = renderHook(() => useDependencyContainer('strict'), {
      wrapper: ({ children }) => (
        <CustomDependencyContainer container={parentContainer}>
          <DependencyContainer binder={binder}>{children}</DependencyContainer>
        </CustomDependencyContainer>
      ),
    });

    expect(result.current.resolve(BAR)).toEqual('bar');
    expect(result.current.resolve(FOO)).toEqual('foo');
  });

  it('should not connect a new container with a parent one in case "root" is "true"', () => {
    const FOO = token('FOO');
    const BAR = token('BAR');

    const parentContainer = createContainer();
    parentContainer.bindValue(FOO, 'foo');

    const binder = (container: Container) => {
      container.bindValue(BAR, 'bar');
    };

    const { result } = renderHook(() => useDependencyContainer('strict'), {
      wrapper: ({ children }) => (
        <CustomDependencyContainer container={parentContainer}>
          <DependencyContainer root binder={binder}>
            {children}
          </DependencyContainer>
        </CustomDependencyContainer>
      ),
    });

    expect(result.current.resolve(BAR)).toEqual('bar');
    expect(result.current.get(FOO)).toBeUndefined();
  });

  it('should disconnect a container from a parent one in case "root" is changed from "false" to "true"', () => {
    const FOO = token('FOO');
    const BAR = token('BAR');

    const parentContainer = createContainer();
    parentContainer.bindValue(FOO, 'foo');

    const binder = (container: Container) => container.bindValue(BAR, 'bar');

    const [FooMonitor, fooCallback] = createMonitor(FOO);
    const [BarMonitor, barCallback] = createMonitor(BAR);

    const { rerender } = render(
      <CustomDependencyContainer container={parentContainer}>
        <DependencyContainer root={false} binder={binder}>
          <FooMonitor />
          <BarMonitor />
        </DependencyContainer>
      </CustomDependencyContainer>,
    );

    expect(fooCallback).toBeCalledTimes(1);
    expect(fooCallback).lastCalledWith('foo');
    expect(barCallback).toBeCalledTimes(1);
    expect(barCallback).lastCalledWith('bar');

    fooCallback.mockClear();
    barCallback.mockClear();

    rerender(
      <CustomDependencyContainer container={parentContainer}>
        <DependencyContainer root={true} binder={binder}>
          <FooMonitor />
          <BarMonitor />
        </DependencyContainer>
      </CustomDependencyContainer>,
    );

    expect(fooCallback).toBeCalledTimes(1);
    expect(fooCallback).lastCalledWith(undefined);
    expect(barCallback).toBeCalledTimes(1);
    expect(barCallback).lastCalledWith('bar');
  });

  it('should connect a container to a parent one in case "root" is changed from "true" to "false"', () => {
    const FOO = token('FOO');
    const BAR = token('BAR');

    const parentContainer = createContainer();
    parentContainer.bindValue(FOO, 'foo');

    const binder = (container: Container) => container.bindValue(BAR, 'bar');

    const [FooMonitor, fooCallback] = createMonitor(FOO);
    const [BarMonitor, barCallback] = createMonitor(BAR);

    const { rerender } = render(
      <CustomDependencyContainer container={parentContainer}>
        <DependencyContainer root={true} binder={binder}>
          <FooMonitor />
          <BarMonitor />
        </DependencyContainer>
      </CustomDependencyContainer>,
    );

    expect(fooCallback).toBeCalledTimes(1);
    expect(fooCallback).lastCalledWith(undefined);
    expect(barCallback).toBeCalledTimes(1);
    expect(barCallback).lastCalledWith('bar');

    fooCallback.mockClear();
    barCallback.mockClear();

    rerender(
      <CustomDependencyContainer container={parentContainer}>
        <DependencyContainer root={false} binder={binder}>
          <FooMonitor />
          <BarMonitor />
        </DependencyContainer>
      </CustomDependencyContainer>,
    );

    expect(fooCallback).toBeCalledTimes(1);
    expect(fooCallback).lastCalledWith('foo');
    expect(barCallback).toBeCalledTimes(1);
    expect(barCallback).lastCalledWith('bar');
  });

  it('should create a new container and initialize it with "binder"', () => {
    const FOO = token('FOO');

    const binder = (container: Container) => container.bindValue(FOO, 'foo');

    const { result } = renderHook(() => useDependencyContainer('strict'), {
      wrapper: ({ children }) => (
        <DependencyContainer binder={binder}>{children}</DependencyContainer>
      ),
    });

    expect(result.current.resolve(FOO)).toEqual('foo');
  });

  it('should remove all bindings from a previous container in case "binder" is changed', () => {
    const FOO = token('FOO');

    const removeHandler1 = vi.fn();
    const binder1 = (container: Container) =>
      container.bindFactory(FOO, () => 'foo1', { onRemoved: removeHandler1 });

    const removeHandler2 = vi.fn();
    const binder2 = (container: Container) =>
      container.bindFactory(FOO, () => 'foo2', { onRemoved: removeHandler2 });

    const [Monitor, monitorCallback] = createMonitor(FOO);

    const { rerender } = render(
      <DependencyContainer binder={binder1}>
        <Monitor />
      </DependencyContainer>,
    );
    expect(monitorCallback).toBeCalledTimes(1);
    expect(monitorCallback).lastCalledWith('foo1');
    expect(removeHandler1).toBeCalledTimes(0);
    expect(removeHandler2).toBeCalledTimes(0);
    monitorCallback.mockClear();
    removeHandler1.mockClear();
    removeHandler2.mockClear();

    rerender(
      <DependencyContainer binder={binder2}>
        <Monitor />
      </DependencyContainer>,
    );
    expect(monitorCallback).toBeCalledTimes(1);
    expect(monitorCallback).lastCalledWith('foo2');
    expect(removeHandler1).toBeCalledTimes(1);
    expect(removeHandler2).toBeCalledTimes(0);
    monitorCallback.mockClear();
    removeHandler1.mockClear();
    removeHandler2.mockClear();

    rerender(<></>);
    expect(monitorCallback).toBeCalledTimes(0);
    expect(removeHandler1).toBeCalledTimes(0);
    expect(removeHandler2).toBeCalledTimes(1);
  });

  it('should remove all bindings from a previous container in case "root" is changed', () => {
    const FOO = token('FOO');

    const removeHandler1 = vi.fn();
    const binder1 = (container: Container) =>
      container.bindFactory(FOO, () => 'foo1', { onRemoved: removeHandler1 });

    const [Monitor, monitorCallback] = createMonitor(FOO);

    const { rerender } = render(
      <DependencyContainer binder={binder1} root={false}>
        <Monitor />
      </DependencyContainer>,
    );
    expect(monitorCallback).toBeCalledTimes(1);
    expect(monitorCallback).lastCalledWith('foo1');
    expect(removeHandler1).toBeCalledTimes(0);
    monitorCallback.mockClear();
    removeHandler1.mockClear();

    rerender(
      <DependencyContainer binder={binder1} root={true}>
        <Monitor />
      </DependencyContainer>,
    );
    expect(monitorCallback).toBeCalledTimes(1);
    expect(monitorCallback).lastCalledWith('foo1');
    expect(removeHandler1).toBeCalledTimes(1);
    monitorCallback.mockClear();
    removeHandler1.mockClear();

    rerender(<></>);
    expect(monitorCallback).toBeCalledTimes(0);
    expect(removeHandler1).toBeCalledTimes(1);
  });
});

describe('CustomDependencyContainer', () => {
  it('should provide a custom container', () => {
    const FOO = token('FOO');

    const container = createContainer();
    container.bindValue(FOO, 'foo');

    const { result } = renderHook(useDependencyContainer, {
      wrapper: ({ children }) => (
        <CustomDependencyContainer container={container}>
          {children}
        </CustomDependencyContainer>
      ),
    });

    expect(result.current?.resolve(FOO)).toBe('foo');
  });

  it('should not clean a custom container on rerender or unmount', () => {
    const FOO = token('FOO');

    const removeHandler1 = vi.fn();
    const container1 = createContainer();
    container1.bindFactory(FOO, () => 'foo1', { onRemoved: removeHandler1 });

    const removeHandler2 = vi.fn();
    const container2 = createContainer();
    container2.bindFactory(FOO, () => 'foo2', { onRemoved: removeHandler2 });

    const [Monitor, monitorCallback] = createMonitor(FOO);

    const { rerender } = render(
      <CustomDependencyContainer container={container1}>
        <Monitor />
      </CustomDependencyContainer>,
    );

    rerender(
      <CustomDependencyContainer container={container2}>
        <Monitor />
      </CustomDependencyContainer>,
    );

    rerender(<></>);

    expect(monitorCallback).toBeCalledTimes(2);
    expect(monitorCallback).nthCalledWith(1, 'foo1');
    expect(monitorCallback).nthCalledWith(2, 'foo2');
    expect(removeHandler1).toBeCalledTimes(0);
    expect(removeHandler2).toBeCalledTimes(0);
  });
});

function createMonitor<T>(token: Token<T>): [() => null, Mock] {
  const callback = vi.fn();

  const Monitor = () => {
    const container = useDependencyContainer();
    useEffect(() => callback(container?.get(token)), [container]);
    return null;
  };

  return [Monitor, callback];
}
