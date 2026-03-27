import { useCallback, useEffect, useState } from 'react';
import {
  dismissPlatformReview,
  getShouldShowPlatformReview,
  submitPlatformReview,
} from '../api/platformReviewApi';
import toast from 'react-hot-toast';

export function usePlatformReview() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const checkShouldShow = useCallback(async () => {
    try {
      setChecking(true);
      const data = await getShouldShowPlatformReview();
      setOpen(Boolean(data.show));
    } catch (error) {
      console.error('Platform review should-show error:', error);

      toast.error('Feedback holatini tekshirishda xatolik ❌');

      setOpen(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkShouldShow();
  }, [checkShouldShow]);

  const handleSubmit = useCallback(async (rating, comment) => {
    try {
      setSubmitting(true);
      await submitPlatformReview({ rating, comment });
      if(rating > 4){
        toast.success(`Rahmooot! 😎🤩🤩🤩😎`);
      }else{
        toast.success(`Baholash qabul qilindi Biz albatta ko'rib chiqamiz! 🤔`);
      } 
      console.log('toast fired');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleDismiss = useCallback(async () => {
    try {
      setSubmitting(true);

      await dismissPlatformReview();

      toast('Keyinroq eslatamiz 😉', {
        icon: '⏳',
      });

      setOpen(false);
    } catch (error) {
      console.error(error);

      toast.error('Xatolik yuz berdi ❌');
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    open,
    setOpen,
    checking,
    submitting,
    handleSubmit,
    handleDismiss,
    recheck: checkShouldShow,
  };
}