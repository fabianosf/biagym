import { AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import type { Coupon } from '@/domain/store';
import {
  DATA_FETCH_TIMEOUT_MS,
  createCoupon,
  deleteCoupon,
  getDataErrorMessage,
  listCoupons,
  withTimeout,
} from '@/services';
import { Button, TextField } from '@/shared/components';
import { useT } from '@/shared/theme';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminStoreScreen() {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  const load = useCallback(async () => {
    try {
      const couponsData = await withTimeout(
        listCoupons(),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.store.loadTimeout'),
      );
      setCoupons(couponsData);
      setError(null);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateCoupon() {
    if (!user) {
      return;
    }

    const discountPercent = Number(couponDiscount);
    setIsSavingCoupon(true);
    setError(null);
    try {
      await createCoupon({
        code: couponCode,
        discountPercent,
        description: couponDescription.trim() || undefined,
        createdBy: user.id,
      });

      setCouponCode('');
      setCouponDiscount('');
      setCouponDescription('');
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSavingCoupon(false);
    }
  }

  async function handleDeleteCoupon(couponId: string) {
    try {
      await deleteCoupon(couponId);
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title={t('admin.store.title')}
      subtitle={t('admin.store.subtitle')}
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {isLoading ? <Text className="text-sm text-muted">{t('admin.store.loading')}</Text> : null}

        <Text className="text-sm leading-5 text-muted">{t('admin.store.productsHint')}</Text>

        <View className="gap-4 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">{t('admin.store.newCoupon')}</Text>
          <TextField
            label={t('admin.store.codeLabel')}
            value={couponCode}
            onChangeText={(value) => setCouponCode(value.toUpperCase())}
            placeholder="BIA10"
            icon="pricetag-outline"
          />
          <TextField
            label={t('admin.store.discountLabel')}
            value={couponDiscount}
            onChangeText={setCouponDiscount}
            placeholder="10"
            keyboardType="number-pad"
            icon="ticket-outline"
          />
          <TextField
            label={t('admin.store.descriptionLabel')}
            value={couponDescription}
            onChangeText={setCouponDescription}
            placeholder={t('admin.store.descriptionPlaceholder')}
            icon="document-text-outline"
          />
          <Button
            label={t('admin.store.saveCoupon')}
            loading={isSavingCoupon}
            onPress={() => void handleCreateCoupon()}
          />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">{t('admin.store.activeCoupons')}</Text>
          {!isLoading && coupons.length === 0 ? (
            <Text className="text-sm text-muted">{t('admin.store.noCoupons')}</Text>
          ) : null}
          {coupons.map((coupon) => (
            <View
              key={coupon.id}
              className="flex-row items-center justify-between rounded-card border border-line bg-surface p-4"
            >
              <View className="flex-1">
                <Text className="font-semibold text-ink">
                  {coupon.code} · {coupon.discountPercent}% off
                </Text>
                {coupon.description ? (
                  <Text className="mt-0.5 text-xs text-muted">{coupon.description}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => void handleDeleteCoupon(coupon.id)}>
                <Text className="text-sm text-red-400">{t('common.remove')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}
