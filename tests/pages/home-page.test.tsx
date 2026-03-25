import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import HomePage from '../../src/pages/HomePage';

describe('HomePage', () => {
  it('应该显示主页标题', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByText('五子棋游戏')).toBeInTheDocument();
    expect(screen.getByText('主页')).toBeInTheDocument();
  });

  it('应该显示人机对战和双人对战按钮', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByText('人机对战')).toBeInTheDocument();
    expect(screen.getByText('双人对战')).toBeInTheDocument();
  });
});
