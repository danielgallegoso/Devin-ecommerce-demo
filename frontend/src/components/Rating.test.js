import React from 'react';
import { render } from '@testing-library/react';
import Rating from './Rating';

const starClasses = (container) =>
  Array.from(container.querySelectorAll('.rating i')).map((icon) => icon.className);

describe('Rating', () => {
  test('renders five full stars for a perfect rating', () => {
    // Arrange
    const value = 5;

    // Act
    const { container } = render(<Rating value={value} />);

    // Assert
    expect(starClasses(container)).toEqual(Array(5).fill('fa fa-star'));
  });

  test('renders a half star for a fractional rating', () => {
    const { container } = render(<Rating value={3.5} />);

    expect(starClasses(container)).toEqual([
      'fa fa-star',
      'fa fa-star',
      'fa fa-star',
      'fa fa-star-half-o',
      'fa fa-star-o',
    ]);
  });

  test('renders empty stars beyond a whole-number rating', () => {
    const { container } = render(<Rating value={2} />);

    expect(starClasses(container)).toEqual([
      'fa fa-star',
      'fa fa-star',
      'fa fa-star-o',
      'fa fa-star-o',
      'fa fa-star-o',
    ]);
  });

  test('renders nothing when the rating value is zero or missing', () => {
    const { container } = render(<Rating value={0} />);

    expect(container.querySelector('.rating')).toBeNull();
  });

  test('renders the supplied caption text next to the stars', () => {
    const { getByText } = render(<Rating value={4} text="12 reviews" />);

    expect(getByText('12 reviews')).toBeInTheDocument();
  });
});
