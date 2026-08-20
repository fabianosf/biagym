import type { Coupon, Product } from '@/domain/store';
import { useAuth } from '@/features/auth';
import {
  createProduct,
  deleteProduct,
  getDataErrorMessage,
  listCoupons,
  listProducts,
  updateProduct,
  uploadProductImage,
} from '@/services';
import { AppImage, Button, EmptyState, TextField } from '@/shared/components';
import { getStoreWhatsAppUrl } from '@/shared/constants/app';
import { colors, useT } from '@/shared/theme';
import { formatPriceBRL } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

function parsePriceToCents(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function RecommendedProductsSection() {
  const t = useT();
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>(undefined);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [productsData, couponsData] = await Promise.all([listProducts(), listCoupons()]);
      setProducts(productsData);
      setCoupons(couponsData);
    } catch {
      // Seção complementar do perfil: se falhar, o resto da tela de Conta continua usável.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openNewProductForm() {
    setEditingProduct('new');
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImage(null);
    setProductImageUrl(undefined);
    setFormError(null);
  }

  function openEditProductForm(product: Product) {
    setEditingProduct(product);
    setProductName(product.name);
    setProductDescription(product.description ?? '');
    setProductPrice((product.priceCents / 100).toFixed(2).replace('.', ','));
    setProductImage(null);
    setProductImageUrl(product.imageUrl);
    setFormError(null);
  }

  function closeProductForm() {
    setEditingProduct(null);
    setFormError(null);
  }

  async function handlePickProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(t('store.imagePermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setProductImage(result.assets[0]);
  }

  async function handleSaveProduct() {
    if (!user || !editingProduct) {
      return;
    }

    if (productName.trim().length < 2) {
      setFormError(t('store.nameRequired'));
      return;
    }

    const priceCents = parsePriceToCents(productPrice);
    if (priceCents === null) {
      setFormError(t('store.invalidPrice'));
      return;
    }

    setIsSavingProduct(true);
    setFormError(null);
    try {
      const imageUrl = productImage
        ? await uploadProductImage({
            fileUri: productImage.uri,
            mimeType: productImage.mimeType,
            fileName: productImage.fileName,
          })
        : productImageUrl;

      if (editingProduct === 'new') {
        await createProduct({
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          priceCents,
          imageUrl,
          createdBy: user.id,
        });
      } else {
        await updateProduct(editingProduct.id, {
          name: productName.trim(),
          description: productDescription.trim() || null,
          priceCents,
          imageUrl: imageUrl ?? null,
        });
      }

      closeProductForm();
      await load();
    } catch (err) {
      setFormError(getDataErrorMessage(err));
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      if (editingProduct !== 'new' && editingProduct?.id === productId) {
        closeProductForm();
      }
      await load();
    } catch (err) {
      setFormError(getDataErrorMessage(err));
    }
  }

  if (!isLoading && !isAdmin && products.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
        {t('store.recommended')}
      </Text>

      {isAdmin ? (
        editingProduct ? (
          <View className="gap-4 rounded-card border border-line bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">
                {editingProduct === 'new' ? t('store.newProduct') : t('store.editProduct')}
              </Text>
              <Pressable onPress={closeProductForm}>
                <Text className="text-sm text-muted">{t('common.cancel')}</Text>
              </Pressable>
            </View>
            {formError ? <Text className="text-sm text-red-400">{formError}</Text> : null}
            <TextField
              label={t('admin.exercises.nameLabel')}
              value={productName}
              onChangeText={setProductName}
              placeholder="Whey Protein"
              icon="pricetag-outline"
            />
            <TextField
              label={t('store.descriptionLabel')}
              value={productDescription}
              onChangeText={setProductDescription}
              placeholder="900g, sabor morango"
              icon="document-text-outline"
            />
            <TextField
              label={t('store.priceLabel')}
              value={productPrice}
              onChangeText={setProductPrice}
              placeholder="120,00"
              keyboardType="decimal-pad"
              icon="cash-outline"
            />
            {productImageUrl && !productImage ? (
              <AppImage uri={productImageUrl} aspectRatio={1} className="h-20 w-20 rounded-2xl" />
            ) : null}
            <Pressable
              onPress={() => void handlePickProductImage()}
              className="min-h-[48px] items-center justify-center rounded-2xl border border-primary/40"
            >
              <Text className="font-semibold text-primary">
                {productImage || productImageUrl ? t('admin.programForm.changeCover') : t('store.attachProductPhoto')}
              </Text>
            </Pressable>
            <Button
              label={editingProduct === 'new' ? t('store.saveProduct') : t('admin.schedule.saveChanges')}
              loading={isSavingProduct}
              onPress={() => void handleSaveProduct()}
            />
          </View>
        ) : (
          <Pressable
            onPress={openNewProductForm}
            className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40"
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text className="font-semibold text-primary">{t('store.addProduct')}</Text>
          </Pressable>
        )
      ) : null}

      {coupons.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {coupons.map((coupon) => (
            <View
              key={coupon.id}
              className="flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2"
            >
              <Ionicons name="pricetag" size={14} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">
                {coupon.code} · {coupon.discountPercent}% OFF
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {!isLoading && products.length === 0 && isAdmin ? (
        <EmptyState
          title={t('store.noProductsTitle')}
          description={t('store.noProductsDescription')}
        />
      ) : products.length > 0 ? (
        <>
          <Text className="text-sm leading-5 text-muted">{t('store.purchaseHint')}</Text>
          <View className="flex-row flex-wrap justify-between">
            {products.map((product) => (
              <View
                key={product.id}
                className="mb-4 w-[48%] overflow-hidden rounded-[18px] border border-line bg-surface"
              >
                <View>
                  {product.imageUrl ? (
                    <AppImage uri={product.imageUrl} aspectRatio={1} />
                  ) : (
                    <View className="aspect-square items-center justify-center bg-elevated">
                      <Ionicons name="pricetag-outline" size={28} color="#9B9B9B" />
                    </View>
                  )}
                  {isAdmin ? (
                    <View className="absolute right-2 top-2 flex-row gap-1.5">
                      <Pressable
                        onPress={() => openEditProductForm(product)}
                        className="h-8 w-8 items-center justify-center rounded-full bg-black/55"
                        accessibilityRole="button"
                        accessibilityLabel={t('workouts.editField', { label: product.name })}
                      >
                        <Ionicons name="pencil" size={14} color="#FFFFFF" />
                      </Pressable>
                      <Pressable
                        onPress={() => void handleDeleteProduct(product.id)}
                        className="h-8 w-8 items-center justify-center rounded-full bg-black/55"
                        accessibilityRole="button"
                        accessibilityLabel={t('store.removeProductLabel', { name: product.name })}
                      >
                        <Ionicons name="trash" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <View className="p-3">
                  <Text numberOfLines={2} className="text-sm font-semibold text-ink">
                    {product.name}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-primary">
                    {formatPriceBRL(product.priceCents)}
                  </Text>
                  {(() => {
                    const whatsappUrl = getStoreWhatsAppUrl(product.name);
                    if (!whatsappUrl) {
                      return null;
                    }
                    return (
                      <Pressable
                        onPress={() => void Linking.openURL(whatsappUrl)}
                        className="mt-2 flex-row items-center justify-center gap-1.5 rounded-full bg-primary/10 py-2"
                      >
                        <Ionicons name="logo-whatsapp" size={14} color={colors.primary} />
                        <Text className="text-xs font-semibold text-primary">{t('store.talkOnWhatsapp')}</Text>
                      </Pressable>
                    );
                  })()}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
