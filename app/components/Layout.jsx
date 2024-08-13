import { useIsHomePath } from '~/lib/utils';
import {
  Drawer,
  useDrawer,
  Text,
  // Input,
  // IconAccount,
  // IconBag,
  // IconSearch,
  // Heading,
  // IconMenu,
  // IconCaret,
  // Section,
  // CountrySelector,
  Cart,
  CartLoading,
  Link,
} from '~/components';
import fetch from '~/fetch/axios';
import { Await, useMatches } from '@remix-run/react';
import { Suspense, useEffect, useState } from 'react';
import { useCartFetchers } from '~/hooks/useCartFetchers';
import { openWhatsApp, getLanguage, getDomain, getShopAddress } from '~/lib/P_Variable';

export function Layout({ children, layout }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setHasMounted(true);
    if (openWhatsApp().isOpen) {
      fetch.get(`${getDomain()}/shopify-service/whatsup/pass/get_phone?shop=${getShopAddress()}`).then(res => {
        if (res && res.data && res.data.success) {
          setPhone(res.data.data.phone)
        }
      })
    }
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* <div className="">
          <a href="#mainContent" className="sr-only">
            Skip to content
          </a>
        </div> */}
        <Header
          title={layout?.shop.name ?? 'Hydrogen'}
          menu={layout?.headerMenu}
        />
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
        {phone ? <div className="stick_service">
          <img src="https://platform.antdiy.vip/static/image/hydrogen_icon_whatsapp.svg" alt="" onClick={() => { goWhatsApp(phone) }} />
        </div> : null}
      </div>
      {/* <Footer menu={layout?.footerMenu} /> */}
    </>
  );
}

function goWhatsApp(phone) {
  var whatsapp_url = `https://wa.me/${phone}?text=${getLanguage().whatsAppText}`;
  window.open(whatsapp_url + ' ' + window.location.href);
}

function Header({ title, menu }) {
  const isHome = useIsHomePath();

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers('ADD_TO_CART');

  // toggle cart drawer when adding to cart
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {menu && (
        <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      )}
      {/* <DesktopHeader
        isHome={isHome}
        title={title}
        menu={menu}
        openCart={openCart}
      /> */}
      {/* <MobileHeader
        isHome={isHome}
        title={title}
        openCart={openCart}
        openMenu={openMenu}
      /> */}
    </>
  );
}

function CartDrawer({ isOpen, onClose }) {
  const [root] = useMatches();

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Cart" openFrom="right">
      <div className="grid">
        <Suspense fallback={<CartLoading />}>
          <Await resolve={root.data?.cart}>
            {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

export function MenuDrawer({ isOpen, onClose, menu }) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <div className="grid">
        <MenuMobileNav menu={menu} onClose={onClose} />
      </div>
    </Drawer>
  );
}

function MenuMobileNav({ menu, onClose }) {
  return (
    <nav className="grid gap-4 p-6 sm:gap-6 sm:px-12 sm:py-8">
      {(menu?.items || []).map((item) => (
        <span key={item.id} className="block">
          <Link
            to={item.to}
            target={item.target}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'pb-1 border-b -mb-px' : 'pb-1'
            }
          >
            <Text as="span" size="copy">
              {item.title}
            </Text>
          </Link>
        </span>
      ))}
    </nav>
  );
}
