
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagesGrid } from '../images-grid';

describe('ImagesGrid', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ];
  
  const mockOnRemove = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the correct number of images', () => {
    render(<ImagesGrid images={mockImages} onRemove={mockOnRemove} />);
    
    // Check that all images are rendered
    const imageElements = screen.getAllByRole('img');
    expect(imageElements.length).toBe(mockImages.length);
  });
  
  it('renders images with correct src attributes', () => {
    render(<ImagesGrid images={mockImages} onRemove={mockOnRemove} />);
    
    // Check each image has the correct src
    mockImages.forEach((src, index) => {
      const image = screen.getByAltText(`Image ${index + 1}`);
      expect(image).toHaveAttribute('src', src);
    });
  });
  
  it('calls onRemove with the correct index when delete button is clicked', () => {
    render(<ImagesGrid images={mockImages} onRemove={mockOnRemove} />);
    
    // Get all delete buttons
    const deleteButtons = screen.getAllByRole('button');
    
    // Click the second delete button
    fireEvent.click(deleteButtons[1]);
    
    // Check if onRemove was called with the correct index
    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });
  
  it('renders no images when empty array is provided', () => {
    render(<ImagesGrid images={[]} onRemove={mockOnRemove} />);
    
    // Check that no images are rendered
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer?.children.length).toBe(0);
  });
});
