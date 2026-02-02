import { useState, useCallback, useMemo } from 'react';

/**
 * useForm Hook
 * Manages form state with validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @param {Function} validate - Validation function returning errors object
 * @returns {Object} form state and handlers
 */
export function useForm(initialValues, onSubmit, validate = null) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    if (!validate) return {};
    return validate(values);
  }, [values, validate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const newErrors = validate(values);
      setErrors(newErrors);
    }
  }, [values, validate]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    setIsSubmitting(true);
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const displayErrors = useMemo(() => {
    return Object.keys(touched).reduce((acc, field) => {
      if (errors[field]) {
        acc[field] = errors[field];
      }
      return acc;
    }, {});
  }, [touched, errors]);

  return {
    values,
    errors: displayErrors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setValues
  };
}
