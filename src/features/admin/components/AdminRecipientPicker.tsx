import type { StudentProfile } from '@/domain/student';
import { useT } from '@/shared/theme';
import { Pressable, Text, View } from 'react-native';

type AdminRecipientPickerProps = {
  students: readonly StudentProfile[];
  selectedIds: readonly string[];
  lockedIds?: readonly string[];
  onToggle: (studentId: string) => void;
};

export function AdminRecipientPicker({
  students,
  selectedIds,
  lockedIds = [],
  onToggle,
}: AdminRecipientPickerProps) {
  const t = useT();
  const selected = new Set(selectedIds);
  const locked = new Set(lockedIds);

  if (students.length === 0) {
    return <Text className="text-sm text-muted">{t('admin.recipientPicker.noStudents')}</Text>;
  }

  return (
    <View className="gap-2">
      {students.map((student) => {
        const isOn = selected.has(student.userId);
        const isLocked = locked.has(student.userId);
        return (
          <Pressable
            key={student.userId}
            onPress={() => {
              if (!isLocked) {
                onToggle(student.userId);
              }
            }}
            disabled={isLocked && isOn}
            className={`rounded-2xl border px-3 py-3 ${
              isOn ? 'border-primary/40 bg-primary/10' : 'border-line bg-elevated'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={t('admin.recipientPicker.sendTo', { name: student.name })}
          >
            <Text className="font-medium text-ink">{student.name}</Text>
            <Text className="text-xs text-muted">{student.email}</Text>
            {isLocked ? (
              <Text className="mt-1 text-xs text-primary">{t('admin.recipientPicker.thisStudentSpace')}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
