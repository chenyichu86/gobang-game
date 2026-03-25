import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

/**
 * 渲染组件的辅助函数,包含Router
 * 用于Week 4的UI组件测试
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * 创建Mock的Zustand store
 * 用于测试组件与store的交互
 */
export function createMockStore<T>(initialState: T) {
  let state = initialState;
  const getState = () => state;
  const setState = (partial: Partial<T>) => {
    state = { ...state, ...partial };
  };
  return { getState, setState };
}

// 导出所有RTL工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
