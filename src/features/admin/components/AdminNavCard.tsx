import { colors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type AdminNavCardProps = {
  title: string;
  description: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

export function AdminNavCard({ title, description, href, icon }: AdminNavCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-row items-center rounded-card border border-line bg-surface p-5 active:opacity-90">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9B9B9B" />
      </Pressable>
    </Link>
  );
}
