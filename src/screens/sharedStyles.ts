import { StyleSheet } from 'react-native';

// Primary call-to-action button, shared by every screen with a single main action.
export const sharedStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});
