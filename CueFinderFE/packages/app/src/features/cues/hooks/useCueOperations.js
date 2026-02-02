import { useState, useCallback } from 'react';
import { useAsync } from '@cuefinder/common';
import * as cueService from '../../../api/cueService';

/**
 * useCueOperations Hook
 * Handles cue CRUD operations (Create, Read, Update, Delete)
 */
export function useCueOperations() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addCue = useCallback(async (cueData) => {
    try {
      const cue = await cueService.createCue(cueData);
      return cue;
    } catch (error) {
      console.error('Error adding cue:', error);
      throw error;
    }
  }, []);

  const updateCue = useCallback(async (id, cueData) => {
    try {
      const cue = await cueService.updateCue(id, cueData);
      return cue;
    } catch (error) {
      console.error('Error updating cue:', error);
      throw error;
    }
  }, []);

  const deleteCue = useCallback(async (id) => {
    try {
      await cueService.deleteCue(id);
      return true;
    } catch (error) {
      console.error('Error deleting cue:', error);
      throw error;
    }
  }, []);

  const uploadImages = useCallback(async (cueId, files) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await cueService.uploadCueImages(cueId, files, (progress) => {
        setUploadProgress(progress);
      });
      return result;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const deleteImage = useCallback(async (imageId) => {
    try {
      await cueService.deleteImage(imageId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }, []);

  const setPrimaryImage = useCallback(async (imageId) => {
    try {
      await cueService.setPrimaryImage(imageId);
      return true;
    } catch (error) {
      console.error('Error setting primary image:', error);
      throw error;
    }
  }, []);

  return {
    addCue,
    updateCue,
    deleteCue,
    uploadImages,
    deleteImage,
    setPrimaryImage,
    isUploading,
    uploadProgress
  };
}
