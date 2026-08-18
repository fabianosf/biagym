import { PROGRAM_LEVELS, PROGRAM_LEVEL_LABELS, type ProgramLevel } from '@/domain/program';
import type { Coupon, Product } from '@/domain/store';
import { colors } from '@/shared/theme';
import { ProgramPosterCard } from '@/features/programs/components';
import { BrandHeader } from '@/features/programs/components/BrandHeader';
import { useCatalog } from '@/features/programs/hooks';
import { useAuth } from '@/features/auth';
import { OfflineBanner } from '@/features/offline';
import {
  createProduct,
  deleteProduct,
  getDataErrorMessage,
  listCoupons,
  listProducts,
  updateProduct,
  uploadProductImage,
} from '@/services';
import { AppImage, Button, EmptyState, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { getStoreWhatsAppUrl } from '@/shared/constants/app';
import { formatPriceBRL } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

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

export function StoreScreen() {
  const { user, isAdmin } = useAuth();
  const { catalog, myItemIds, progressByProgramId, isLoading, isRefreshing, error, refetch } =
    useCatalog();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'programas' | 'lista' | 'produtos'>('programas');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);
  const [level, setLevel] = useState<ProgramLevel | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isStoreExtrasLoading, setIsStoreExtrasLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>(undefined);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  const loadStoreExtras = useCallback(async () => {
    try {
      const [productsData, couponsData] = await Promise.all([listProducts(), listCoupons()]);
      setProducts(productsData);
      setCoupons(couponsData);
    } catch {
      // Loja de produtos é um complemento: se falhar, o catálogo de programas continua usável.
    } finally {
      setIsStoreExtrasLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStoreExtras();
  }, [loadStoreExtras]);

  function openNewProductForm() {
    setEditingProduct('new');
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImage(null);
    setProductImageUrl(undefined);
    setProductFormError(null);
  }

  function openEditProductForm(product: Product) {
    setEditingProduct(product);
    setProductName(product.name);
    setProductDescription(product.description ?? '');
    setProductPrice((product.priceCents / 100).toFixed(2).replace('.', ','));
    setProductImage(null);
    setProductImageUrl(product.imageUrl);
    setProductFormError(null);
  }

  function closeProductForm() {
    setEditingProduct(null);
    setProductFormError(null);
  }

  async function handlePickProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setProductFormError('Permita o acesso às fotos do celular para anexar a imagem.');
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
      setProductFormError('Informe o nome do produto.');
      return;
    }

    const priceCents = parsePriceToCents(productPrice);
    if (priceCents === null) {
      setProductFormError('Informe um preço válido, ex: 45,90.');
      return;
    }

    setIsSavingProduct(true);
    setProductFormError(null);
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
      await loadStoreExtras();
    } catch (err) {
      setProductFormError(getDataErrorMessage(err));
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
      await loadStoreExtras();
    } catch (err) {
      setProductFormError(getDataErrorMessage(err));
    }
  }

  const categories = useMemo(() => {
    const byId = new Map<string, string>();
    for (const program of catalog) {
      for (const category of program.categories) {
        byId.set(category.id, category.name);
      }
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [catalog]);

  const levels = useMemo(() => {
    const present = new Set(catalog.map((program) => program.level));
    return PROGRAM_LEVELS.filter((item) => present.has(item));
  }, [catalog]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return catalog.filter((program) => {
      if (normalized) {
        const matchesQuery =
          program.title.toLowerCase().includes(normalized) ||
          program.trainerName.toLowerCase().includes(normalized);
        if (!matchesQuery) {
          return false;
        }
      }

      if (categoryId && !program.categories.some((category) => category.id === categoryId)) {
        return false;
      }

      if (level && program.level !== level) {
        return false;
      }

      return true;
    });
  }, [catalog, query, categoryId, level]);

  const list = tab === 'lista' ? filtered.filter((program) => myItemIds.has(program.id)) : filtered;
  const hasActiveFilters = Boolean(categoryId || level || query.trim());

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return products;
    }
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, query]);

  return (
    <View className="flex-1 bg-background">
      <BrandHeader showBrand={false} title="Loja" showAdminPill={false} />
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando catálogo..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                void refetch();
                void loadStoreExtras();
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-4 flex-row items-center rounded-full bg-surface px-4">
            <Ionicons name="search-outline" size={18} color="#9B9B9B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Pesquise aqui"
              placeholderTextColor="#9B9B9B"
              className="flex-1 px-3 py-3 text-base text-ink"
            />
          </View>

          <View className="mb-4 flex-row gap-5 border-b border-line">
            {(
              [
                ['programas', 'Programas'],
                ['lista', 'Minha lista'],
                ['produtos', 'Produtos'],
              ] as const
            ).map(([id, label]) => (
              <Pressable key={id} onPress={() => setTab(id)} className="pb-2">
                <Text
                  className={`text-base ${
                    tab === id ? 'font-semibold text-primary' : 'text-muted'
                  }`}
                >
                  {label}
                </Text>
                {tab === id ? <View className="mt-2 h-[3px] rounded-full bg-primary" /> : null}
              </Pressable>
            ))}
          </View>

          {tab === 'produtos' ? (
            <>
              {isAdmin ? (
                editingProduct ? (
                  <View className="mb-4 gap-4 rounded-card border border-line bg-surface p-5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold text-ink">
                        {editingProduct === 'new' ? 'Novo produto' : 'Editar produto'}
                      </Text>
                      <Pressable onPress={closeProductForm}>
                        <Text className="text-sm text-muted">Cancelar</Text>
                      </Pressable>
                    </View>
                    {productFormError ? (
                      <Text className="text-sm text-red-400">{productFormError}</Text>
                    ) : null}
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
                      label={editingProduct === 'new' ? 'Salvar produto' : 'Salvar alterações'}
                      loading={isSavingProduct}
                      onPress={() => void handleSaveProduct()}
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={openNewProductForm}
                    className="mb-4 min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40"
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Text className="font-semibold text-primary">Adicionar produto</Text>
                  </Pressable>
                )
              ) : null}

              {coupons.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="mb-4 gap-2"
                >
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

              {filteredProducts.length > 0 ? (
                <Text className="mb-4 text-sm leading-5 text-muted">
                  Fale com a treinadora pra garantir o seu — a compra é combinada por fora do
                  app.
                </Text>
              ) : null}

              {!isStoreExtrasLoading && filteredProducts.length === 0 ? (
                <EmptyState
                  title="Nenhum produto por aqui"
                  description="Quando a treinadora publicar produtos, eles aparecem nesta aba."
                />
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {filteredProducts.map((product) => (
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
                              accessibilityLabel={`Editar ${product.name}`}
                            >
                              <Ionicons name="pencil" size={14} color="#FFFFFF" />
                            </Pressable>
                            <Pressable
                              onPress={() => void handleDeleteProduct(product.id)}
                              className="h-8 w-8 items-center justify-center rounded-full bg-black/55"
                              accessibilityRole="button"
                              accessibilityLabel={`Remover ${product.name}`}
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
                              <Text className="text-xs font-semibold text-primary">
                                Falar no WhatsApp
                              </Text>
                            </Pressable>
                          );
                        })()}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {categories.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="mb-2 gap-2"
                >
                  <Pressable
                    onPress={() => setCategoryId(null)}
                    className={`flex-row items-center rounded-xl border px-3 py-2 ${
                      categoryId === null ? 'border-ink' : 'border-line'
                    }`}
                  >
                    {categoryId === null ? (
                      <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                    ) : null}
                    <Text className={`text-sm text-ink ${categoryId === null ? 'ml-1' : ''}`}>
                      Todas categorias
                    </Text>
                  </Pressable>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() =>
                        setCategoryId((current) => (current === category.id ? null : category.id))
                      }
                      className={`flex-row items-center rounded-xl border px-3 py-2 ${
                        categoryId === category.id ? 'border-ink' : 'border-line'
                      }`}
                    >
                      {categoryId === category.id ? (
                        <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                      ) : null}
                      <Text className={`text-sm text-ink ${categoryId === category.id ? 'ml-1' : ''}`}>
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {levels.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="mb-5 gap-2"
                >
                  <Pressable
                    onPress={() => setLevel(null)}
                    className={`rounded-xl border px-3 py-2 ${level === null ? 'border-ink' : 'border-line'}`}
                  >
                    <Text className="text-sm text-ink">Todos os níveis</Text>
                  </Pressable>
                  {levels.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setLevel((current) => (current === item ? null : item))}
                      className={`rounded-xl border px-3 py-2 ${level === item ? 'border-ink' : 'border-line'}`}
                    >
                      <Text className="text-sm text-ink">{PROGRAM_LEVEL_LABELS[item]}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View className="mb-1" />
              )}

              {list.length === 0 ? (
                <EmptyState
                  title={hasActiveFilters ? 'Nada por aqui com esse filtro' : 'Nenhum programa por aqui'}
                  description={
                    hasActiveFilters
                      ? 'Tente limpar a busca ou trocar o filtro de categoria e nível.'
                      : 'Quando a treinadora publicar programas, eles aparecem nesta loja. Seus Treinos A, B e C ficam na aba Treinos.'
                  }
                />
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {list.map((program) => (
                    <View key={program.id} className="mb-4 w-[48%]">
                      <View className="w-full">
                        <ProgramPosterCard
                          program={program}
                          progress={progressByProgramId[program.id] ?? null}
                          size="grid"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
