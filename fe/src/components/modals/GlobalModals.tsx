import React, { Suspense, lazy } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';

// Dynamic lazy imports for modal components to drastically reduce initial bundle size
const AuthModal = lazy(() =>
  import('../AuthModal').then((m) => ({ default: m.AuthModal }))
);
const OnboardingModal = lazy(() =>
  import('../OnboardingModal').then((m) => ({ default: m.OnboardingModal }))
);
const FoodScannerModal = lazy(() =>
  import('../FoodScannerModal').then((m) => ({ default: m.FoodScannerModal }))
);
const WeightLogModal = lazy(() =>
  import('../WeightLogModal').then((m) => ({ default: m.WeightLogModal }))
);
const SubscriptionModal = lazy(() =>
  import('../SubscriptionModal').then((m) => ({ default: m.SubscriptionModal }))
);
const RAGMealPlanModal = lazy(() =>
  import('../RAGMealPlanModal').then((m) => ({ default: m.RAGMealPlanModal }))
);

export const GlobalModals: React.FC = () => {
  const { activeModal, closeModal, openModal } = useModal();
  const { user, profile, updateUser, updateProfileState } = useAuth();
  const { invalidateData } = useData();
  const { theme } = useTheme();

  if (!activeModal) return null;

  return (
    <Suspense fallback={null}>
      {activeModal === 'AUTH' && (
        <AuthModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={(authUser, isNewRegistration) => {
            updateUser(authUser);
            invalidateData('all');
            closeModal();
            if (isNewRegistration) {
              setTimeout(() => {
                openModal('ONBOARDING');
              }, 300);
            }
          }}
        />
      )}

      {activeModal === 'ONBOARDING' && (
        <OnboardingModal
          isOpen={true}
          onClose={closeModal}
          userId={user?.user_id || 1}
          user={user}
          currentProfile={profile}
          onSaveProfile={(p) => {
            updateProfileState(p);
            invalidateData('all');
          }}
          onOpenSubscription={() => {
            closeModal();
            openModal('SUBSCRIPTION');
          }}
        />
      )}

      {activeModal === 'FOOD_SCANNER' && (
        <FoodScannerModal
          isOpen={true}
          onClose={closeModal}
          userId={user?.user_id || 1}
          user={user}
          onFoodLogged={() => {
            invalidateData('dashboard');
          }}
          onOpenSubscription={() => {
            closeModal();
            openModal('SUBSCRIPTION');
          }}
        />
      )}

      {activeModal === 'WEIGHT_LOG' && (
        <WeightLogModal
          isOpen={true}
          onClose={closeModal}
          userId={user?.user_id || 1}
          currentWeight={profile?.current_weight_kg || 65}
          onWeightRecorded={(w) => {
            if (profile) {
              updateProfileState({ ...profile, current_weight_kg: w });
            }
            invalidateData('all');
          }}
        />
      )}

      {activeModal === 'SUBSCRIPTION' && (
        <SubscriptionModal
          isOpen={true}
          onClose={closeModal}
          currentUser={user}
          onPlanUpgraded={(updatedUser) => {
            updateUser(updatedUser);
            invalidateData('all');
          }}
        />
      )}

      {activeModal === 'RAG_MEAL_PLAN' && (
        <RAGMealPlanModal
          user={user}
          onClose={closeModal}
          onOpenSubscription={() => {
            closeModal();
            openModal('SUBSCRIPTION');
          }}
          onFoodLogged={() => {
            invalidateData('dashboard');
          }}
          theme={theme}
        />
      )}
    </Suspense>
  );
};
