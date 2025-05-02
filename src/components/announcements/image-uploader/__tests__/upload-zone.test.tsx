
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UploadZone } from '../upload-zone';

describe('UploadZone', () => {
  const defaultProps = {
    isUploading: false,
    uploadProgress: 0,
    error: null,
    triggerFileUpload: jest.fn(),
    triggerCameraUpload: jest.fn(),
    isMobile: false
  };

  it('renders with desktop view', () => {
    render(<UploadZone {...defaultProps} />);
    
    expect(screen.getByText('Glissez-déposez vos images ici, ou sélectionnez une option ci-dessous')).toBeInTheDocument();
    expect(screen.getByText('Sélectionner des fichiers')).toBeInTheDocument();
    expect(screen.getByText('Prendre une photo')).toBeInTheDocument();
  });
  
  it('renders with mobile view', () => {
    render(<UploadZone {...defaultProps} isMobile={true} />);
    
    expect(screen.getByText('Ajoutez des photos à votre annonce')).toBeInTheDocument();
    expect(screen.getByText('Galerie')).toBeInTheDocument();
    expect(screen.getByText('Appareil photo')).toBeInTheDocument();
  });
  
  it('shows loading state when uploading', () => {
    render(<UploadZone {...defaultProps} isUploading={true} uploadProgress={50} />);
    
    expect(screen.getByText('Téléversement en cours...')).toBeInTheDocument();
    // Check for progress bar
    const progressBar = document.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle('width: 50%');
  });
  
  it('shows error message when error occurs', () => {
    const error = "Erreur lors du téléversement";
    render(<UploadZone {...defaultProps} error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
  });
  
  it('calls triggerFileUpload when file button is clicked', () => {
    render(<UploadZone {...defaultProps} />);
    
    const button = screen.getByText('Sélectionner des fichiers');
    fireEvent.click(button);
    
    expect(defaultProps.triggerFileUpload).toHaveBeenCalled();
  });
  
  it('calls triggerCameraUpload when camera button is clicked', () => {
    render(<UploadZone {...defaultProps} />);
    
    const button = screen.getByText('Prendre une photo');
    fireEvent.click(button);
    
    expect(defaultProps.triggerCameraUpload).toHaveBeenCalled();
  });
  
  it('displays offline message when not online', () => {
    render(<UploadZone {...defaultProps} isOnline={false} />);
    
    expect(screen.getByText('Vous êtes hors ligne')).toBeInTheDocument();
  });
  
  it('displays slow connection message when network is slow', () => {
    render(<UploadZone {...defaultProps} networkQuality="slow" isOnline={true} />);
    
    expect(screen.getByText('Connexion lente détectée. Les images seront compressées pour un envoi plus rapide.')).toBeInTheDocument();
  });
});
