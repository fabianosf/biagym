import { parseSessionLoadKg } from '@/features/workouts/utils/format';
import { useT } from '@/shared/theme';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

type LoadEditorModalProps = {
  visible: boolean;
  currentLoadKg: number;
  onClose: () => void;
  onSave: (loadKg: number) => void;
};

export function LoadEditorModal({ visible, currentLoadKg, onClose, onSave }: LoadEditorModalProps) {
  const t = useT();
  const [draft, setDraft] = useState(String(currentLoadKg));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(String(currentLoadKg));
      setError(null);
    }
  }, [currentLoadKg, visible]);

  function handleSave() {
    const parsed = parseSessionLoadKg(draft);
    if (parsed == null) {
      setError(t('exercise.loadInvalid'));
      return;
    }

    onSave(parsed);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/70"
      >
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t('common.close')} />
        <View className="rounded-t-3xl bg-gymCard px-5 pb-8 pt-5">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />
          <Text className="text-lg font-bold text-white">{t('exercise.loadKg')}</Text>
          <Text className="mt-1 text-sm text-gymMuted">{t('exercise.loadHint')}</Text>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setError(null);
            }}
            keyboardType="decimal-pad"
            className="mt-5 h-14 rounded-2xl bg-black px-4 text-2xl font-bold text-white"
            placeholder="0"
            placeholderTextColor="#737373"
            autoFocus
          />
          {error ? <Text className="mt-2 text-sm text-red-300">{error}</Text> : null}
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-full border border-white/15"
            >
              <Text className="font-semibold text-white">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="h-12 flex-1 items-center justify-center rounded-full bg-gymAccent"
            >
              <Text className="font-bold text-gymOnAccent">{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
