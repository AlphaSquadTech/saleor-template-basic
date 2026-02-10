'use client';

import { CHECKOUT_CREATE } from '@/graphql/mutations/checkoutCreate';
import { ME_ADDRESSES_QUERY, type MeAddressesData } from '@/graphql/queries/meAddresses';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../components/reuseableUI/breadcrumb';
import CommonButton from '../components/reuseableUI/commonButton';
import EmptyState from '../components/reuseableUI/emptyState';
import { ArrowIcon } from '../utils/svgs/arrowIcon';
import { CartIcon } from '../utils/svgs/cart/cartIcon';
import { PlusIcon } from '../utils/svgs/cart/plusIcon';
import { SubtractIcon } from '../utils/svgs/cart/subtractIcon';
import { gtmRemoveFromCart, gtmViewCart, gtmAddToCart, gtmBeginCheckout, Product } from '../utils/googleTagManager';
import { useAppConfiguration } from '../components/providers/ServerAppConfigurationProvider';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
  sku?: string;
};

export default function CartPage() {
  const { cartItems: items, totalAmount, removeFromCart, updateQuantity, addToCart, checkoutId, setCheckoutId, setCheckoutToken, isLoggedIn, user, guestEmail, guestShippingInfo } = useGlobalStore();
  const { getGoogleTagManagerConfig } = useAppConfiguration();
  const [refreshedItems, setRefreshedItems] = useState<CartItem[]>([]);
  const [refreshedTotals, setRefreshedTotals] = useState({ totalItems: 0, totalAmount: 0 });
  const [pricesRefreshed, setPricesRefreshed] = useState(false);
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: { plus: boolean; minus: boolean; remove: boolean } }>({});
  
  const gtmConfig = getGoogleTagManagerConfig();

  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When logged in, fetch account addresses
  const { data: meData, loading: meLoading } = useQuery<MeAddressesData>(ME_ADDRESSES_QUERY, { skip: !isLoggedIn });
  const accountShipping = useMemo(() => {
    const me = meData?.me;
    if (!me || !me.addresses?.length) return null;
    const defId = me.defaultShippingAddress?.id;
    return (defId ? me.addresses.find((a: { id: string }) => a.id === defId) : me.addresses[0]) || null;
  }, [meData]);
  const accountBilling = useMemo(() => {
    const me = meData?.me;
    if (!me || !me.addresses?.length) return null;
    const defId = me.defaultBillingAddress?.id;
    return (defId ? me.addresses.find((a: { id: string }) => a.id === defId) : accountShipping || me.addresses[0]) || null;
  }, [meData, accountShipping]);

  const endpoint = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || '/api/graphql';
    let url = raw.trim();
    if (!/\/graphql\/?$/i.test(url)) url = url.replace(/\/+$/, '') + '/graphql';
    return url;
  }, []);


  // Refresh prices from checkout if available to ensure we show discounted prices
  useEffect(() => {
    const refreshPricesFromCheckout = async () => {
      if (!checkoutId || pricesRefreshed || items.length === 0) return;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetCheckoutDetails($id: ID!) {
                checkout(id: $id) {
                  id
                  totalPrice { gross { amount currency } }
                  subtotalPrice { gross { amount currency } }
                  lines {
                    id
                    quantity
                    totalPrice { gross { amount currency } }
                    variant {
                      id
                      name
                      product {
                        name
                        thumbnail { url }
                        pricing {
                          discount { gross { amount currency } }
                        }
                      }
                      pricing {
                        price { gross { amount currency } }
                      }
                    }
                  }
                }
              }
            `,
            variables: { id: checkoutId }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const checkout = data?.data?.checkout;

          if (checkout?.lines?.length > 0) {

            // Calculate unit prices - use variant pricing (discounted) instead of line total
            type CheckoutLine = {
              id: string;
              quantity: number;
              variant: {
                id: string;
                product: {
                  name: string;
                  pricing?: {
                    discount?: {
                      gross?: {
                        amount: number;
                      };
                    };
                  };
                };
                pricing?: {
                  price?: {
                    gross?: {
                      amount: number;
                    };
                  };
                };
                name: string;
              };
              totalPrice: {
                gross: {
                  amount: number;
                  currency: string;
                };
              };
              name: string;
            };

            const updatedItems: CartItem[] = checkout.lines
              .map((line: CheckoutLine) => {
                const existingItem = items.find(item => item.id === line.variant.id);
                if (!existingItem) return null;

                // Use line totalPrice divided by quantity to get the actual unit price
                const lineTotal = line?.totalPrice?.gross?.amount ?? 0;
                const qty = Math.max(1, line.quantity);
                const unitPrice = lineTotal / qty;
                

                return {
                  ...existingItem,
                  price: unitPrice,
                  quantity: line.quantity,
                };
              })
              .filter(Boolean) as CartItem[];

            const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            setRefreshedItems(updatedItems);
            setRefreshedTotals({ totalItems, totalAmount });
            setPricesRefreshed(true);
          }
        }
      } catch (error) {
        console.error('[Cart] Failed to refresh prices from checkout:', error);
      }
    };

    refreshPricesFromCheckout();
  }, [checkoutId, endpoint, items, pricesRefreshed]);

  // Reset prices refreshed state when global cart items change (e.g., when items are removed)
  useEffect(() => {
    if (pricesRefreshed && refreshedItems.length > 0) {
      // Check if any items in refreshedItems no longer exist in the global store
      const hasRemovedItems = refreshedItems.some(refreshedItem => 
        !items.find(globalItem => globalItem.id === refreshedItem.id)
      );
      
      // Check if global items count differs from refreshed items count
      const itemCountDiffers = items.length !== refreshedItems.length;
      
      if (hasRemovedItems || itemCountDiffers) {
        setPricesRefreshed(false);
        setRefreshedItems([]);
        setRefreshedTotals({ totalItems: 0, totalAmount: 0 });
      }
    }
  }, [items, refreshedItems, pricesRefreshed]);

  // Force refresh when cart becomes empty but still has cached items
  useEffect(() => {
    if (items.length === 0 && (refreshedItems.length > 0 || pricesRefreshed)) {
      setPricesRefreshed(false);
      setRefreshedItems([]);
      setRefreshedTotals({ totalItems: 0, totalAmount: 0 });
    }
  }, [items.length, refreshedItems.length, pricesRefreshed]);

  // Track cart view with GTM
  useEffect(() => {
    const currentItems = pricesRefreshed ? refreshedItems : items;
    if (currentItems.length > 0) {
      const products: Product[] = currentItems.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || 'Products',
        price: item.price,
        quantity: item.quantity,
        currency: 'USD',
        index: index
      }));

      const totalValue = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      gtmViewCart(products, 'USD', totalValue, gtmConfig?.container_id);
    }
  }, [items, refreshedItems, pricesRefreshed]);

  const handleProceed = useCallback(async () => {
    setError(null);
    if (isLoggedIn && meLoading) {
      return;
    }

    // Track begin_checkout GTM event
    const gtmConfig = getGoogleTagManagerConfig();
    if (displayItems.length > 0) {
      const products: Product[] = displayItems.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || 'Products',
        price: item.price,
        quantity: item.quantity,
        currency: 'USD',
        index: index
      }));
      const totalValue = displayItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      gtmBeginCheckout(products, 'USD', totalValue, undefined, gtmConfig?.container_id);
    }
    // Always create a new checkout; clear any previous IDs/tokens first
    if (checkoutId) {
      setCheckoutId(null);
    }
    try { localStorage.removeItem('checkoutId'); localStorage.removeItem('checkoutToken'); } catch { }
    setCreating(true);
    try {
      // Build lines from cart using the item id as variantId directly
      const lines = items.map((it) => ({ quantity: it.quantity, variantId: it.id }));
      if (lines.length === 0) {
        setCreating(false);
        return;
      }
      const email = (isLoggedIn ? (user?.email || meData?.me?.email || '') : guestEmail) || 'guest@example.com';

      const mutation = CHECKOUT_CREATE;
      type CheckoutLineInputTS = { variantId: string; quantity: number };
      type CheckoutCreateInputTS = {
        channel: string;
        email: string;
        lines: CheckoutLineInputTS[];
      };
      const input: CheckoutCreateInputTS = {
        channel: process.env.NEXT_PUBLIC_SALEOR_CHANNEL || 'default-channel',
        email,
        lines,
      };
      const variables = { input };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables }),
      });
      if (!res.ok) throw new Error('Failed to create checkout');
      const json = await res.json();
      const errs = json.data?.checkoutCreate?.errors;
      if (errs && errs.length) throw new Error(errs[0]?.message || 'Checkout creation error');
      const createdId = json.data?.checkoutCreate?.checkout?.id as string | undefined;
      const createdToken = json.data?.checkoutCreate?.checkout?.token as string | undefined;
      if (!createdId) throw new Error('No checkout id returned');
      setCheckoutId(createdId);
      if (createdToken) {
        setCheckoutToken(createdToken);
      }
      try {
        localStorage.setItem('checkoutId', createdId);
        if (createdToken) localStorage.setItem('checkoutToken', createdToken);
      } catch { }
      router.push(`/checkout?checkoutId=${encodeURIComponent(createdId)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to proceed to checkout';
      console.error('[Cart] handleProceed error:', e);
      setError(msg);
    } finally {
      setCreating(false);
    }
  }, [accountBilling, accountShipping, checkoutId, endpoint, guestEmail, guestShippingInfo, isLoggedIn, items, meData, meLoading, router, setCheckoutId, setCheckoutToken, user?.email]);


  // Use refreshed items and totals if available, otherwise fall back to store values
  const displayItems = pricesRefreshed ? refreshedItems : items;
  const displayTotalAmount = pricesRefreshed ? refreshedTotals.totalAmount : totalAmount;

  // Enhanced remove and update functions that work with refreshed prices
  const handleRemoveFromCart = useCallback(async (itemId: string) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], remove: true } }));
    
    try {
      // Get item before removing for GTM tracking
      const currentItems = pricesRefreshed ? refreshedItems : items;
      const itemToRemove = currentItems.find(item => item.id === itemId);
      
      if (itemToRemove) {
        // GTM tracking for remove from cart
        const product: Product = {
          item_id: itemToRemove.id,
          item_name: itemToRemove.name,
          item_category: itemToRemove.category || 'Products',
          price: itemToRemove.price,
          quantity: itemToRemove.quantity,
          currency: 'USD'
        };
        
        gtmRemoveFromCart([product], 'USD', itemToRemove.price * itemToRemove.quantity, gtmConfig?.container_id);
      }
      
      if (pricesRefreshed) {
        // Update both store and local refreshed state
        setRefreshedItems(prev => prev.filter(item => item.id !== itemId));
        setRefreshedTotals(() => {
          const filteredItems = refreshedItems.filter(item => item.id !== itemId);
          const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return { totalItems, totalAmount };
        });
      }
      removeFromCart(itemId);
      
      // Small delay to ensure backend sync completes
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], remove: false } }));
    }
  }, [pricesRefreshed, refreshedItems, removeFromCart, items]);

  const handleUpdateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    setLoadingItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], minus: true } }));
    
    try {
      if (pricesRefreshed) {
        // Update both store and local refreshed state
        setRefreshedItems(prev => {
          const updated = prev.map(item =>
            item.id === itemId
              ? { ...item, quantity: Math.max(0, newQuantity) }
              : item
          ).filter(item => item.quantity > 0);

          // Update totals
          const totalItems = updated.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = updated.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          setRefreshedTotals({ totalItems, totalAmount });

          return updated;
        });
      }
      updateQuantity(itemId, newQuantity);
      
      // Small delay to ensure backend sync completes
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setLoadingItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], minus: false } }));
    }
  }, [pricesRefreshed, updateQuantity]);

  const handleAddToCart = useCallback(async (item: CartItem) => {
    setLoadingItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], plus: true } }));
    
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        sku: item.sku,
        category: item.category
      });

      // GTM tracking for add to cart - quantity 1 is correct here as we're adding 1 more item
      const product: Product = {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || 'Products',
        price: item.price,
        quantity: 1, // This is correct - we're adding 1 more item
        currency: 'USD'
      };
      
      gtmAddToCart([product], 'USD', item.price, gtmConfig?.container_id);
      
      // Reset price refresh state to force refresh with new data
      setPricesRefreshed(false);
    } catch (error) {
      console.error('[Cart] Failed to add item to cart:', error);
    } finally {
      setLoadingItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], plus: false } }));
    }
  }, [addToCart]);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 lg:px-4 lg:py-8">
        <div className='flex lg:hidden justify-between items-center w-full'>
          <p className='font-semibold text-xl font-secondary text-[var(--color-secondary-800)]'>
            MY CART
          </p>
          <div className="flex items-center gap-1 cursor-pointer">
            {
              !isLoggedIn ?
                <CommonButton
                  onClick={() => router.push("/account/login")}
                  className="p-0 text-sm"
                  content="LOG IN"
                  variant="tertiary"
                /> : <CommonButton
                  onClick={() => router.push("/")}
                  className="p-0 text-sm"
                  content="CONTINUE SHOPPING"
                  variant="tertiary"
                />
            }
            <span className="size-5 text-[var(--color-primary-600)]">
              {ArrowIcon}
            </span>
          </div>
        </div>
        <div className='hidden lg:block space-y-10'>
          <div className='flex items-center justify-between w-full'>
            <Breadcrumb
              items={[
                { text: 'Home', link: '/' },
                { text: 'Cart' },
              ]}
            />
            <div className="flex items-center gap-1 cursor-pointer">
              {
                !isLoggedIn ?
                  <CommonButton
                    onClick={() => router.push("/account/login")}
                    className="p-0"
                    content="LOG IN"
                    variant="tertiary"
                  /> : <CommonButton
                    onClick={() => router.push("/")}
                    className="p-0"
                    content="CONTINUE SHOPPING"
                    variant="tertiary"
                  />
              }
              <span className="size-5 text-[var(--color-primary-600)]">
                {ArrowIcon}
              </span>
            </div>
          </div>
          <p className='font-primary font-normal text-4xl text-[var(--color-secondary-800)]'>
            CART
          </p>
        </div>
        <EmptyState
          icon={CartIcon}
          iconContainer="p-5"
          text="YOUR CART IS EMPTY"
          textParagraph="Browse parts and accessories to get started."
          className='h-[70vh]'
          buttonLabel="BACK TO HOME"
          buttonVariant="secondary"
          onClick={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className="lg:container lg:mx-auto p-6 lg:px-6 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 lg:gap-14">
        <div className="lg:col-span-2 space-y-5 lg:space-y-10 lg:border-r lg:border-[var(--color-secondary-200)] lg:pr-14">
          <div className='flex lg:hidden justify-between items-center w-full border-b border-[var(--color-secondary-200)] pb-3'>
            <p className='font-semibold text-xl font-secondary text-[var(--color-secondary-800)]'>
              MY CART
            </p>
            <div className="flex items-center gap-1 cursor-pointer">
              {
                !isLoggedIn ?
                  <CommonButton
                    onClick={() => router.push("/account/login")}
                    className="p-0 text-sm"
                    content="LOG IN"
                    variant="tertiary"
                  /> : <CommonButton
                    onClick={() => router.push("/")}
                    className="p-0 text-sm"
                    content="CONTINUE SHOPPING"
                    variant="tertiary"
                  />
              }
              <span className="size-5 text-[var(--color-primary-600)]">
                {ArrowIcon}
              </span>
            </div>
          </div>
          <div className='hidden lg:block space-y-10'>
            <div className='flex items-center justify-between w-full'>
              <Breadcrumb
                items={[
                  { text: 'Home', link: '/' },
                  { text: 'Cart' },
                ]}
              />
              <div className="flex items-center gap-1 cursor-pointer">
                {
                  !isLoggedIn ?
                    <CommonButton
                      onClick={() => router.push("/account/login")}
                      className="p-0"
                      content="LOG IN"
                      variant="tertiary"
                    /> : <CommonButton
                      onClick={() => router.push("/")}
                      className="p-0"
                      content="CONTINUE SHOPPING"
                      variant="tertiary"
                    />
                }
                <span className="size-5 text-[var(--color-primary-600)]">
                  {ArrowIcon}
                </span>
              </div>
            </div>
            <p className='font-primary font-normal text-4xl text-[var(--color-secondary-800)]'>
              CART
            </p>
          </div>
          <div className='space-y-4'>
            {displayItems.map((item: CartItem) => (
              <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 border-b border-[var(--color-secondary-200)] last:border-b-0 pb-6 last:pb-0">
                <div className='w-full items-center gap-2 lg:gap-5 flex'>
                  <div className="relative size-[50px] md:size-[100px] flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-row md:flex-col items-start lg:items-start gap-4 w-full justify-between">
                    <div className='space-y-1'>
                      <p className="text-xs lg:text-sm font-normal text-[var(--color-secondary-800)]">{item.category ?? "N/A"}</p>
                      <h3 className="font-medium font-secondary text-xs md:text-sm lg:text-xl/7 text-[var(--color-secondary-800)]">{item.name}</h3>
                    </div>
                    <CommonButton
                      onClick={() => handleRemoveFromCart(item.id)}
                      disabled={loadingItems[item.id]?.remove || loadingItems[item.id]?.plus || loadingItems[item.id]?.minus}
                      variant="tertiary"
                      className="p-0 text-sm lg:text-base"
                    >
                      {loadingItems[item.id]?.remove ? 'Removing...' : 'Remove'}
                    </CommonButton>
                  </div>
                </div>
                <div className='flex flex-row justify-between w-full md:w-auto md:justify-normal items-center gap-6 lg:gap-10 pl-[58px] md:pl-0'>
                  <div className="flex items-center border border-[var(--color-secondary-200)] bg-[var(--color-secondary-50)] py-2 px-1 md:py-2.5 md:px-2 lg:py-3 gap-2 min-w-32 justify-between">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={loadingItems[item.id]?.minus || loadingItems[item.id]?.plus || loadingItems[item.id]?.remove}
                      className={`border-r border-[var(--color-secondary-200)] [&>svg]:size-6 pr-2 transition-opacity ${
                        loadingItems[item.id]?.minus || loadingItems[item.id]?.plus || loadingItems[item.id]?.remove
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer hover:opacity-75'
                      }`}
                    >
                      {loadingItems[item.id]?.minus ? (
                        <svg className="animate-spin size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        SubtractIcon
                      )}
                    </button>
                    <span className='font-normal text-base font-secondary text-[var(--color-secondary-800)]'>{item.quantity}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={loadingItems[item.id]?.plus || loadingItems[item.id]?.minus || loadingItems[item.id]?.remove}
                      className={`border-l border-[var(--color-secondary-200)] [&>svg]:size-6 pl-2 transition-opacity ${
                        loadingItems[item.id]?.plus || loadingItems[item.id]?.minus || loadingItems[item.id]?.remove
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer hover:opacity-75'
                      }`}
                    >
                      {loadingItems[item.id]?.plus ? (
                        <svg className="animate-spin size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        PlusIcon
                      )}
                    </button>
                  </div>
                  <div className="font-semibold text-base lg:text-2xl text-[var(--color-primary-600)] font-secondary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-base font-secondary text-[var(--color-secondary-800)] font-medium mb-4 uppercase">Summary</h2>

          <div className="gap-2 flex flex-col mb-4 font-normal text-sm md:text-base font-secondary text-[var(--color-secondary-600)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className='font-medium'>${displayTotalAmount.toFixed(2)}</span>
            </div>
            {/* <div className="flex justify-between pb-2">
              <span>Tax</span>
              <span className='font-medium'>N/A</span>
            </div> */}
            <div className="border-t border-gray-200 pt-4 flex justify-between text-base md:text-xl text-[var(--color-secondary-600)] font-medium ">
              <span>TOTAL</span>
              <span className='font-semibold text-[var(--color-secondary-800)]'>${displayTotalAmount.toFixed(2)}</span>
            </div>
          </div>
          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}
          <CommonButton
            onClick={handleProceed}
            disabled={creating || (isLoggedIn && meLoading)}
            variant="primary"
            className='mt-2 py-2.5 md:py-3.5 w-full flex items-center gap-2 justify-center text-sm lg:text-base'
          >
            {creating ? 'Preparing checkout...' : (isLoggedIn && meLoading ? 'Loading your address...' : 'Proceed to Checkout')}
            {
              !creating && <span className="size-5 ">
                {ArrowIcon}
              </span>
            }
          </CommonButton>
        </div>
      </div>
    </div>
  );
}
