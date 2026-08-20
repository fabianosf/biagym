import type { StudentProfile } from '@/domain/student';
import { useT } from '@/shared/theme';
import { getNameInitials } from '@/shared/utils/person-name';
import { Image, Text, View } from 'react-native';

type AdminStudentAvatarProps = {
  student: Pick<StudentProfile, 'name' | 'avatarUrl'>;
  size?: number;
};

export function AdminStudentAvatar({ student, size = 48 }: AdminStudentAvatarProps) {
  const t = useT();
  const initials = getNameInitials(student.name);

  if (student.avatarUrl) {
    return (
      <Image
        source={{ uri: student.avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={t('profile.avatarOf', { name: student.name })}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-primary/15"
    >
      <Text className="font-bold text-primary" style={{ fontSize: size * 0.32 }}>
        {initials}
      </Text>
    </View>
  );
}
