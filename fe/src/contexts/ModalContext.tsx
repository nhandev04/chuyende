import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ModalType =
  | 'AUTH'
  | 'ONBOARDING'
  | 'FOOD_SCANNER'
  | 'WEIGHT_LOG'
  | 'SUBSCRIPTION'
  | 'RAG_MEAL_PLAN'
  | null;

interface ModalContextType {
  activeModal: ModalType;
  modalProps: Record<string, unknown>;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  isOpen: (type: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalProps, setModalProps] = useState<Record<string, unknown>>({});

  const openModal = useCallback((type: ModalType, props: Record<string, unknown> = {}) => {
    setActiveModal(type);
    setModalProps(props);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalProps({});
  }, []);

  const isOpen = useCallback((type: ModalType) => activeModal === type, [activeModal]);

  const value = useMemo(
    () => ({
      activeModal,
      modalProps,
      openModal,
      closeModal,
      isOpen,
    }),
    [activeModal, modalProps, openModal, closeModal, isOpen]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
