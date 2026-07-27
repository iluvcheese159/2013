/* eslint-disable */
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const KEY = "pf_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (listing, options = {}) => {
    const chosenColor = options.selected_filament_color || null;
    setItems((prev) => prev.find((x) => x.listing_id === listing.listing_id && (x.selected_filament_color || null) === chosenColor)
      ? prev
      : [...prev, {
          listing_id: listing.listing_id,
          title: listing.title,
          price: listing.price,
          shipping_fee: Number(listing.shipping_fee || 0),
          image: listing.image_paths?.[0],
          seller: listing.seller_name,
          selected_filament_color: chosenColor,
        }]);
  };
  const remove = (lid) => setItems((prev) => prev.filter((x) => x.listing_id !== lid));
  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() { return useContext(CartContext); }
