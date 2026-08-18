import { AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import type { Coupon, Product } from '@/domain/store';
import {
  DATA_FETCH_TIMEOUT_MS,
  createCoupon,
  createProduct,
  deleteCoupon,
  deleteProduct,
  getDataErrorMessage,
  listCoupons,
  listProducts,
  updateProduct,
  uploadProductImage,
  withTimeout,
} from '@/services';
import { AppImage, Button, TextField } from '@/shared/components';
import { formatPriceBRL } from '@/shared/utils';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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

export function AdminStoreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>(undefined);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  const load = useCallback(async () => {
    try {
      const [productsData, couponsData] = await withTimeout(
        Promise.all([listProducts(), listCoupons()]),
        DATA_FETCH_TIMEOUT_MS,
        'A loja demorou demais para carregar. Tente novamente.',
      );
      setProducts(productsData);
      setCoupons(couponsData);
      setError(null);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePickProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita o acesso às fotos do celular para anexar a imagem do produto.');
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

  function resetProductForm() {
    setEditingProductId(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImage(null);
    setProductImageUrl(undefined);
  }

  function handleStartEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductDescription(product.description ?? '');
    setProductPrice((product.priceCents / 100).toFixed(2).replace('.', ','));
    setProductImage(null);
    setProductImageUrl(product.imageUrl);
    setError(null);
  }

  async function handleSaveProduct() {
    if (!user) {
      return;
    }

    if (productName.trim().length < 2) {
      setError('Informe o nome do produto.');
      return;
    }

    const priceCents = parsePriceToCents(productPrice);
    if (priceCents === null) {
      setError('Informe um preço válido, ex: 45,90.');
      return;
    }

    setIsSavingProduct(true);
    setError(null);
    try {
      const imageUrl = productImage
        ? await uploadProductImage({
            fileUri: productImage.uri,
            mimeType: productImage.mimeType,
            fileName: productImage.fileName,
          })
        : productImageUrl;

      if (editingProductId) {
        await updateProduct(editingProductId, {
          name: productName.trim(),
          description: productDescription.trim() || null,
          priceCents,
          imageUrl: imageUrl ?? null,
        });
      } else {
        await createProduct({
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          priceCents,
          imageUrl,
          createdBy: user.id,
        });
      }

      resetProductForm();
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      if (editingProductId === productId) {
        resetProductForm();
      }
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

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
      title="Loja"
      subtitle="Produtos e cupons visíveis para as alunas."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {isLoading ? <Text className="text-sm text-muted">Carregando loja...</Text> : null}

        <View className="gap-4 rounded-card border border-line bg-surface p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">
              {editingProductId ? 'Editar produto' : 'Novo produto'}
            </Text>
            {editingProductId ? (
              <Pressable onPress={resetProductForm}>
                <Text className="text-sm text-muted">Cancelar</Text>
              </Pressable>
            ) : null}
          </View>
          <TextField
            label="Nome"
            value={productName}
            onChangeText={setProductName}
            placeholder="Whey Protein"
            icon="pricetag-outline"
          />
          <TextField
            label="Descrição (opcional)"
            value={productDescription}
            onChangeText={setProductDescription}
            placeholder="900g, sabor morango"
            icon="document-text-outline"
          />
          <TextField
            label="Preço (R$)"
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
              {productImage || productImageUrl ? 'Trocar foto' : 'Anexar foto do produto'}
            </Text>
          </Pressable>
          <Button
            label={editingProductId ? 'Salvar alterações' : 'Salvar produto'}
            loading={isSavingProduct}
            onPress={() => void handleSaveProduct()}
          />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Produtos cadastrados</Text>
          {!isLoading && products.length === 0 ? (
            <Text className="text-sm text-muted">Nenhum produto cadastrado ainda.</Text>
          ) : null}
          {products.map((product) => (
            <View
              key={product.id}
              className="flex-row items-center gap-3 rounded-card border border-line bg-surface p-3"
            >
              {product.imageUrl ? (
                <AppImage uri={product.imageUrl} aspectRatio={1} className="h-16 w-16 rounded-2xl" />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated" />
              )}
              <View className="flex-1">
                <Text className="font-semibold text-ink">{product.name}</Text>
                <Text className="mt-0.5 text-sm text-primary">{formatPriceBRL(product.priceCents)}</Text>
                {product.description ? (
                  <Text className="mt-0.5 text-xs text-muted" numberOfLines={2}>
                    {product.description}
                  </Text>
                ) : null}
              </View>
              <View className="items-end gap-2">
                <Pressable onPress={() => handleStartEditProduct(product)}>
                  <Text className="text-sm text-primary">Editar</Text>
                </Pressable>
                <Pressable onPress={() => void handleDeleteProduct(product.id)}>
                  <Text className="text-sm text-red-400">Remover</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-4 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Novo cupom</Text>
          <TextField
            label="Código"
            value={couponCode}
            onChangeText={(value) => setCouponCode(value.toUpperCase())}
            placeholder="BIA10"
            icon="pricetag-outline"
          />
          <TextField
            label="Desconto (%)"
            value={couponDiscount}
            onChangeText={setCouponDiscount}
            placeholder="10"
            keyboardType="number-pad"
            icon="ticket-outline"
          />
          <TextField
            label="Descrição (opcional)"
            value={couponDescription}
            onChangeText={setCouponDescription}
            placeholder="10% de desconto na primeira compra"
            icon="document-text-outline"
          />
          <Button
            label="Salvar cupom"
            loading={isSavingCoupon}
            onPress={() => void handleCreateCoupon()}
          />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Cupons ativos</Text>
          {!isLoading && coupons.length === 0 ? (
            <Text className="text-sm text-muted">Nenhum cupom cadastrado ainda.</Text>
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
                <Text className="text-sm text-red-400">Remover</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}
