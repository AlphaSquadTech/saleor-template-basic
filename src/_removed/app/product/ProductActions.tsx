'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from '@/app/components/reuseableUI/primaryButton';
import CommonButton from '@/app/components/reuseableUI/commonButton';
import { MinusIcon } from '@/app/utils/svgs/minusIcon';
import { PlusIcon } from '@/app/utils/svgs/plusIcon';
import { SpinnerIcon } from '@/app/utils/svgs/spinnerIcon';
import { useGlobalStore } from '@/store/useGlobalStore';
import { CHECKOUT_CREATE } from '@/graphql/mutations/checkoutCreate';
import { gtmAddToCart, Product } from '@/app/utils/googleTagManager';

interface ProductVariant {
  id: string;
  quantityAvailable?: number;
  pricing?: {
    price?: {
      gross?: {
        amount?: number;
      };
    };
  };
}

interface ProductMedia {
  url?: string;
}

interface ProductCategory {
  name?: string;
}

interface ProductType {
  id: string;
  name: string;
  media?: ProductMedia[];
  category?: ProductCategory;
  pricing?: {
    priceRange?: {
      start?: {
        gross?: {
          amount?: number;
        };
      };
    };
  };
}

interface ProductActionsProps {
  product: ProductType;
  selectedVariant: ProductVariant;
  gtmContainerId?: string;
}

type CheckoutLineInputTS = { variantId: string; quantity: number };
type AddressInputTS = {
  firstName: string;
  lastName: string;
  streetAddress1: string;
  city: string;
  postalCode: string;
  country: string;
  countryArea?: string;
  phone?: string;
};

function resolveEndpoint() {
  const raw = process.env.NEXT_PUBLIC_API_URL || '/api/graphql';
  const lower = raw.trim().toLowerCase();
  return /\/graphql\/?$/.test(lower)
    ? raw.trim()
    : raw.replace(/\/+$/, '') + '/graphql';
}

async function createCheckout(input: {
  channel: string;
  email: string;
  lines: CheckoutLineInputTS[];
  shippingAddress?: AddressInputTS;
  billingAddress?: AddressInputTS;
}) {
  const res = await fetch(resolveEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CHECKOUT_CREATE, variables: { input } }),
  });
  if (!res.ok) throw new Error('Failed to create checkout');
  const json = await res.json();
  const errs = json?.data?.checkoutCreate?.errors;
  if (Array.isArray(errs) && errs.length)
    throw new Error(errs[0]?.message || 'Checkout creation error');
  const id: string | undefined = json?.data?.checkoutCreate?.checkout?.id;
  const token: string | undefined = json?.data?.checkoutCreate?.checkout?.token;
  if (!id) throw new Error('No checkout id returned');
  return { checkoutId: id, checkoutToken: token };
}

function clearStoredCheckout() {
  try {
    localStorage.removeItem('checkoutId');
    localStorage.removeItem('checkoutToken');
  } catch {}
}

export default function ProductActions({
  product,
  selectedVariant,
  gtmContainerId,
}: ProductActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const {
    addToCart,
    isLoggedIn,
    user,
    guestEmail,
    setCheckoutId,
    setCheckoutToken,
  } = useGlobalStore();

  const channel = process.env.NEXT_PUBLIC_SALEOR_CHANNEL || 'default-channel';
  const maxQty = selectedVariant?.quantityAvailable ?? undefined;

  const currentPrice = useMemo(() => {
    const variantPrice = selectedVariant?.pricing?.price?.gross;
    return (
      variantPrice?.amount ??
      product?.pricing?.priceRange?.start?.gross?.amount ??
      0
    );
  }, [selectedVariant, product]);

  const decQty = () => setQuantity((q) => Math.max(1, q - 1));
  const incQty = () => setQuantity((q) => Math.min(q + 1, maxQty || q + 1));

  const onQtyInput = (val: string) => {
    const n = Number.parseInt(val, 10);
    const safe = Number.isFinite(n) ? Math.max(1, n) : 1;
    setQuantity(maxQty ? Math.min(safe, maxQty) : safe);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setIsAdding(true);
      await addToCart({
        id: selectedVariant?.id ?? product.id,
        name: product.name,
        price: currentPrice,
        image: product.media?.[0]?.url ?? '',
        category: product?.category?.name ?? 'N/A',
        quantity,
      });

      // Track add to cart event in GTM
      const productData: Product = {
        item_id: selectedVariant?.id ?? product.id,
        item_name: product.name,
        item_category: product?.category?.name || 'Products',
        price: currentPrice,
        quantity: quantity,
        currency: 'USD',
        item_brand: product?.category?.name || undefined,
      };

      gtmAddToCart(
        [productData],
        'USD',
        currentPrice * quantity,
        gtmContainerId
      );
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setTimeout(() => setIsAdding(false), 400);
    }
  };

  const handleBuyNow = useCallback(async () => {
    if (!product || !selectedVariant?.id) {
      return;
    }
    if (quantity < 1) {
      return;
    }

    try {
      setBuying(true);

      // Add to cart first
      await addToCart({
        id: selectedVariant.id,
        name: product.name,
        price: currentPrice,
        image: product.media?.[0]?.url ?? '',
        category: product?.category?.name ?? 'N/A',
        quantity,
      });

      // Clear any stale checkout
      clearStoredCheckout();
      try {
        useGlobalStore.getState().setCheckoutId(null);
        const setTok = useGlobalStore.getState().setCheckoutToken as
          | ((v: string | null) => void)
          | undefined;
        setTok?.(null);
      } catch {}

      // Build lines
      const lines: CheckoutLineInputTS[] = [
        { variantId: selectedVariant.id, quantity },
      ];

      // Email
      const email =
        (isLoggedIn ? user?.email || '' : guestEmail || 'guest@example.com') ||
        'guest@example.com';

      // Create checkout
      const { checkoutId, checkoutToken } = await createCheckout({
        channel,
        email,
        lines,
      });

      // Persist in store + localStorage
      setCheckoutId(checkoutId);
      if (checkoutToken) setCheckoutToken(checkoutToken);
      try {
        localStorage.setItem('checkoutId', checkoutId);
        if (checkoutToken) localStorage.setItem('checkoutToken', checkoutToken);
      } catch {}

      // Navigate to checkout
      router.push(`/checkout?checkoutId=${encodeURIComponent(checkoutId)}`);
    } catch (e) {
      console.error('[BuyNow] error:', e);
    } finally {
      setBuying(false);
    }
  }, [
    product,
    selectedVariant?.id,
    quantity,
    addToCart,
    currentPrice,
    isLoggedIn,
    user?.email,
    guestEmail,
    channel,
    setCheckoutId,
    setCheckoutToken,
    router,
  ]);

  const btnSecondary =
    'border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-colors';

  if (process.env.NEXT_PUBLIC_BLOCK_CHECKOUT === 'true') {
    return (
      <PrimaryButton
        content="Where to Buy"
        className="w-full text-base font-semibold leading-6 tracking-[-0.04px] py-3 px-4"
        onClick={() => router.push('/locator')}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center group border border-[var(--color-secondary-200)] w-full ${
          currentPrice === 0 ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <button
          type="button"
          className={`${btnSecondary} px-2 py-3 !border-0 hover:!bg-[var(--color-secondary-200)] transition-all ease-in-out duration-300 h-full cursor-pointer w-full flex items-center justify-center`}
          onClick={decQty}
        >
          <span className="size-4 block">{MinusIcon}</span>
        </button>
        <input
          type="number"
          min={1}
          max={maxQty ?? undefined}
          value={quantity}
          inputMode="numeric"
          className="text-center outline-none border-x border-[var(--color-secondary-200)] w-full select-none"
          onChange={(e) => onQtyInput(e.target.value)}
        />
        <button
          type="button"
          className={`${btnSecondary} px-2 py-3 !border-0 w-full cursor-pointer hover:!bg-[var(--color-secondary-200)] transition-all ease-in-out duration-300 flex items-center justify-center`}
          onClick={incQty}
        >
          <span className="size-4 block">{PlusIcon}</span>
        </button>
      </div>

      <CommonButton
        className="w-full"
        onClick={handleAddToCart}
        disabled={!product || isAdding || currentPrice === 0}
        variant="secondary"
      >
        {isAdding ? (
          <span className="flex size-6 items-center text-black justify-center w-full">
            {SpinnerIcon}
          </span>
        ) : (
          'Add to Cart'
        )}
      </CommonButton>

      <PrimaryButton
        content={buying ? 'Processing...' : 'Buy Now'}
        className="w-full text-base font-semibold leading-6 tracking-[-0.04px] py-3 px-4"
        onClick={handleBuyNow}
        disabled={buying || !selectedVariant || currentPrice === 0}
      />
    </div>
  );
}
