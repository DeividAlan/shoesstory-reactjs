import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get(`products/${productId}`);
      const product = responseProduct.data;
      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data;


      if(stock.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const productFinded = cart.find(p => p.id === productId);

        if(productFinded) {
          if(stock.amount < (productFinded.amount + 1)) {
            toast.error('Quantidade solicitada fora de estoque');
          } else {
            const newCart = cart.map(p => {
              if(p.id === productId) {
                p.amount += 1;
                return p;
              }
              return p;
            })
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          }
        } else {
          const newCart = [...cart, {...product, amount: 1 }]
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const finded = cart.find(p => p.id === productId);

      if(!finded) {
        toast.error('Erro na remoção do produto');
      } else {
        const newCart = cart.filter(p => p.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data;


      if(stock.amount < amount || amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const newCart = cart.map(p => {
          if(p.id === productId) {
            p.amount = amount;
            return p;
          }
          return p;
        })
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
