import { useT } from '@/shared/theme';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type MedicalDisclaimerProps = {
  visible: boolean;
  onAccept: () => void;
  onDismiss?: () => void;
};

export function MedicalDisclaimer({
  visible,
  onAccept,
  onDismiss,
}: MedicalDisclaimerProps) {
  const t = useT();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      accessibilityViewIsModal
    >
      <View className="flex-1 bg-black px-6 pb-10 pt-16">
        {onDismiss ? (
          <Pressable onPress={onDismiss} className="mb-6 h-10 w-10 items-center justify-center">
            <Text className="text-2xl text-white">×</Text>
          </Pressable>
        ) : null}
        <Text className="text-xl font-bold uppercase text-white">{t('disclaimer.title')}</Text>
        <ScrollView className="mt-4 flex-1" showsVerticalScrollIndicator={false}>
          <Text className="text-base leading-7 text-white">
            {t('disclaimer.body1')}
            {'\n\n'}
            {t('disclaimer.body2')}
          </Text>
        </ScrollView>
        <Pressable
          onPress={onAccept}
          className="mt-6 min-h-[52px] items-center justify-center rounded-2xl bg-primary"
        >
          <Text className="font-semibold text-white">{t('disclaimer.accept')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
