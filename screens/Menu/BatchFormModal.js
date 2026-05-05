/**
 * BatchFormModal.js
 * Modal form for creating a new fermentation batch.
 * Extracted from AddButton.js — handles all form UI and submission logic.
 */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons }      from '@expo/vector-icons';
import { useAppTheme }   from '../../context/ThemeContext';
import { menuStyles as styles } from './MenuStyles';
import { createBatch }   from './batchUtils';

/**
 * Modal that lets the user fill in a batch name + optional notes,
 * then fires the batch creation logic via `createBatch`.
 *
 * @param {{ visible: boolean, onClose: () => void, onBatchCreated: (data: object) => void }} props
 */
const BatchFormModal = ({ visible, onClose, onBatchCreated }) => {
  const { colors } = useAppTheme();
  const [batchName,  setBatchName]  = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [creating,   setCreating]   = useState(false);

  const handleClose = useCallback(() => {
    setBatchName('');
    setBatchNotes('');
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!batchName.trim()) {
      Alert.alert('Error', 'Please enter a batch name');
      return;
    }
    setCreating(true);
    try {
      const batchData = await createBatch(batchName.trim(), batchNotes.trim());
      Alert.alert(
        'Success',
        `Batch "${batchName}" created successfully!`,
        [{ text: 'OK', onPress: () => { handleClose(); onBatchCreated?.(batchData); } }],
      );
    } catch {
      Alert.alert('Error', 'Failed to create batch. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [batchName, batchNotes, handleClose, onBatchCreated]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ModalHeader colors={colors} onClose={handleClose} />
              <NameField   colors={colors} value={batchName}  onChange={setBatchName} />
              <NotesField  colors={colors} value={batchNotes} onChange={setBatchNotes} />
              <ModalActions
                colors={colors}
                creating={creating}
                onCancel={handleClose}
                onSubmit={handleSubmit}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/** Header row with title and close icon. */
const ModalHeader = React.memo(({ colors, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Batch</Text>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color={colors.subtext} />
    </TouchableOpacity>
  </View>
));

/** Batch name text input. */
const NameField = React.memo(({ colors, value, onChange }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.label, { color: colors.text }]}>Batch Name *</Text>
    <TextInput
      style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
      placeholder="e.g., Batch 5"
      placeholderTextColor={colors.subtext}
      value={value}
      onChangeText={onChange}
      maxLength={50}
    />
  </View>
));

/** Optional notes text area. */
const NotesField = React.memo(({ colors, value, onChange }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
    <TextInput
      style={[styles.input, styles.textArea, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
      placeholder="Add notes about this batch..."
      placeholderTextColor={colors.subtext}
      value={value}
      onChangeText={onChange}
      multiline
      numberOfLines={4}
      maxLength={200}
    />
  </View>
));

/** Cancel / Submit button pair. */
const ModalActions = React.memo(({ colors, creating, onCancel, onSubmit }) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity
      style={[styles.cancelButton, { backgroundColor: colors.bg }]}
      onPress={onCancel}
      disabled={creating}
    >
      <Text style={[styles.cancelButtonText, { color: colors.subtext }]}>Cancel</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.submitButton, { backgroundColor: colors.primary }, creating && styles.disabledButton]}
      onPress={onSubmit}
      disabled={creating}
    >
      {creating ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Create Batch</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
));

export default React.memo(BatchFormModal);
