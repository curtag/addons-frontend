import * as React from 'react';
import userEvent from '@testing-library/user-event';

import DropdownMenu from 'amo/components/DropdownMenu';
import DropdownMenuItem from 'amo/components/DropdownMenuItem';
import Link from 'amo/components/Link';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultMenuText = 'Menu';
  let _window = {
    matchMedia: jest.fn().mockReturnValue({ matches: false }),
  };

  const getMenu = () => screen.getByClassName('DropdownMenu');
  const getMenuButton = (name = defaultMenuText) =>
    screen.getByRole('button', { name });
  const getItem = () => screen.getByRole('listitem');

  const clickMenu = (name = defaultMenuText) =>
    userEvent.click(getMenuButton(name));

  const render = ({ children, text = defaultMenuText, ...props } = {}) => {
    return defaultRender(
      <DropdownMenu _window={_window} text={text} {...props}>
        {children}
      </DropdownMenu>,
    );
  };

  it('renders a menu', () => {
    render();

    expect(screen.getByClassName('DropdownMenu')).toBeInTheDocument();
    expect(getMenu()).toHaveTextContent(defaultMenuText);
    expect(screen.getByClassName('Icon-inverted-caret')).toBeInTheDocument();

    clickMenu();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders items passed as children', () => {
    render({ children: <DropdownMenuItem>A section</DropdownMenuItem> });

    clickMenu();

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('toggles the menu state when button is clicked', () => {
    render();
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');

    // User clicks the menu main button.
    clickMenu();
    expect(getMenu()).toHaveClass('DropdownMenu--active');

    // User clicks the menu main button, again.
    clickMenu();
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
  });

  it('resets the menu state on blur', () => {
    // Render the menu in a document with another element.
    defaultRender(
      <div>
        <h1>Some Heading</h1>
        <DropdownMenu _window={_window} text={defaultMenuText} />
      </div>,
    );

    // User clicks the menu main button.
    clickMenu();
    expect(getMenu()).toHaveClass('DropdownMenu--active');

    // User clicks somewhere else.
    userEvent.click(screen.getByRole('heading'));
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
  });

  it('resets the menu state on click', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3452
    render({
      children: (
        <DropdownMenuItem>
          <a className="TestLink" href="/test-link/">
            Test!
          </a>
        </DropdownMenuItem>
      ),
    });

    // User clicks the menu main button to open it.
    clickMenu();
    expect(getMenu()).toHaveClass('DropdownMenu--active');

    // User clicks a link.
    userEvent.click(screen.getByRole('link'));
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
  });

  it('sets active on mouseEnter/clears on mouseLeave', () => {
    _window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render();

    // User hovers on the menu.
    userEvent.hover(getMenu());
    expect(getMenu()).toHaveClass('DropdownMenu--active');
    expect(_window.matchMedia).toHaveBeenCalledWith('(hover)');

    _window.matchMedia.mockClear();

    // User's mouse leaves the menu.
    userEvent.unhover(getMenu());
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
    expect(_window.matchMedia).toHaveBeenCalledWith('(hover)');
  });

  it('does not touch active on mouseleave/enter if device doesnt support hover', () => {
    _window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    render();

    // User hovers on the menu.
    userEvent.hover(getMenu());
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
    expect(_window.matchMedia).toHaveBeenCalledWith('(hover)');

    // User's mouse leaves the menu (no changes).
    userEvent.unhover(getMenu());
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
    expect(_window.matchMedia).toHaveBeenCalledWith('(hover)');
  });

  it('does not touch active on mouseleave/enter if window is null', () => {
    _window = null;
    render();

    // User hovers on the menu.
    userEvent.hover(getMenu());
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');

    // User's mouse leaves the menu (no changes).
    userEvent.unhover(getMenu());
    expect(getMenu()).not.toHaveClass('DropdownMenu--active');
  });

  it('optionally takes a class name', () => {
    const className = 'MyClass';
    render({ className });

    expect(getMenu()).toHaveClass(className);
  });

  describe('Tests for DropdownMenuItem', () => {
    const renderWithItems = (children) => {
      render({ children });
      clickMenu();
    };

    it('renders a section when only `children` prop is supplied', () => {
      const text = 'A section';
      renderWithItems(<DropdownMenuItem>{text}</DropdownMenuItem>);

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-section');
      expect(item).toHaveTextContent(text);
    });

    it('renders a `Link` passed in children', () => {
      const linkText = 'a link';
      const linkHref = '/some/path/';
      renderWithItems(
        <DropdownMenuItem>
          <Link to={linkHref}>{linkText}</Link>
        </DropdownMenuItem>,
      );

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-link');
      expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
        'href',
        `/en-US/android${linkHref}`,
      );
    });

    it('can visually detach a link item', () => {
      renderWithItems(
        <DropdownMenuItem detached>
          <Link to="/">a link detached from the rest of the menu</Link>
        </DropdownMenuItem>,
      );

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-link');
      expect(item).toHaveClass('DropdownMenuItem--detached');
    });

    it('renders a `button` when `onClick` prop is supplied', () => {
      const buttonText = 'A button';
      const onClick = jest.fn();
      renderWithItems(
        <DropdownMenuItem onClick={onClick}>{buttonText}</DropdownMenuItem>,
      );

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-link');

      userEvent.click(screen.getByRole('button', { name: buttonText }));
      expect(onClick).toHaveBeenCalled();
    });

    it('can visually detach a button item', () => {
      const onClick = jest.fn();
      renderWithItems(
        <DropdownMenuItem onClick={onClick} detached>
          A button that is detached from the rest of the menu
        </DropdownMenuItem>,
      );

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-link');
      expect(item).toHaveClass('DropdownMenuItem--detached');
    });

    it('optionally takes a class name', () => {
      const className = 'MyClass';
      renderWithItems(
        <DropdownMenuItem className={className}>A section</DropdownMenuItem>,
      );

      const item = getItem();
      expect(item).toHaveClass('DropdownMenuItem');
      expect(item).toHaveClass('DropdownMenuItem-section');
      expect(item).toHaveClass(className);
    });

    it('can render a disabled button', () => {
      const buttonText = 'A button';
      const onClick = jest.fn();
      renderWithItems(
        <DropdownMenuItem onClick={onClick} disabled>
          {buttonText}
        </DropdownMenuItem>,
      );

      expect(getItem()).toHaveClass('DropdownMenuItem--disabled');
      expect(screen.getByRole('button', { name: buttonText })).toBeDisabled();
    });

    it('renders a button with a title', () => {
      const onClick = jest.fn();
      const title = 'some title';
      renderWithItems(
        <DropdownMenuItem onClick={onClick} title={title}>
          A button with title
        </DropdownMenuItem>,
      );

      expect(screen.getByRole('button', { name: title })).toHaveAttribute(
        'title',
        title,
      );
    });
  });
});
