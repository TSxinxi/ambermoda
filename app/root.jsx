import { defer } from '@shopify/remix-oxygen';
import { useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useMatches,
} from '@remix-run/react';
import { ShopifySalesChannel, Seo } from '@shopify/hydrogen';
import { Layout } from '~/components';
import { GenericError } from './components/GenericError';
import { NotFound } from './components/NotFound';

import styles from './styles/app.css';
import favicon from '../public/favicon.svg';

import { DEFAULT_LOCALE, parseMenu } from './lib/utils';
import { getDirection } from '~/lib/P_Variable';
import invariant from 'tiny-invariant';
import { useAnalytics } from './hooks/useAnalytics';
import * as Sentry from "@sentry/react";
import fetch from '~/fetch/axios';
import { v4 as uuidv4 } from "uuid";
import * as rrweb from "rrweb";

let uid = ''
let events = []
let copyEvents = []

const seo = ({ data, pathname }) => ({
  title: data?.layout?.shop?.name,
  titleTemplate: '%s | Hydrogen Demo Store',
  description: data?.layout?.shop?.description,
  handle: '@shopify',
  url: `https://hydrogen.shop${pathname}`,
});

export const handle = {
  seo,
};

export const links = () => {
  return [
    { rel: 'stylesheet', href: styles },
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    { rel: 'icon', href: 'https://cdn.shopify.com/s/files/1/0583/6858/9908/files/s_d_s_d.png?crop=center&height=32&v=1715756196&width=32' },
  ];
};

export const meta = () => ({
  charset: 'utf-8',
  viewport: 'width=device-width,initial-scale=1',
});

export async function loader({ context }) {
  const [cartId, layout] = await Promise.all([
    context.session.get('cartId'),
    getLayoutData(context),
  ]);

  return defer({
    layout,
    selectedLocale: context.storefront.i18n,
    cart: cartId ? getCart(context, cartId) : undefined,
    analytics: {
      shopifySalesChannel: ShopifySalesChannel.hydrogen,
      shopId: layout.shop.id,
    },
  });
}

export default function App() {
  const data = useLoaderData();
  const locale = data.selectedLocale ?? DEFAULT_LOCALE;
  const hasUserConsent = true;

  useAnalytics(hasUserConsent, locale);

  var canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.localStorage !== "undefined");
  if (canUseDOM) {
    if (getReferer() && getReferer().split('.com')[0].indexOf(window.location.host.split('.com')[0]) === -1 && (!localStorage.getItem('refererName') || (localStorage.getItem('refererName') && localStorage.getItem('refererName') !== getReferer()))) {
      localStorage.setItem('refererName', getReferer())
    }
    useEffect(() => {
      Sentry.init({
        dsn: "https://645e3eda247d4102cb446f58794dc929@o4506097284677632.ingest.sentry.io/4506097561567232",
        integrations: [
          new Sentry.BrowserTracing({
            // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
            tracePropagationTargets: ["localhost", /^https:\/\/page.modamias.com:55340\.io\/api/],
          }),
          new Sentry.Replay(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      });

      // (function (h, o, t, j, a, r) {
      //   h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments) };
      //   h._hjSettings = { hjid: 3527157, hjsv: 6 };
      //   a = o.getElementsByTagName('head')[0];
      //   r = o.createElement('script'); r.async = 1;
      //   r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      //   a.appendChild(r);
      // })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-X12GDSEKQ1');

      // !function (f, b, e, v, n, t, s) {
      //   if (f.fbq) return; n = f.fbq = function () {
      //     n.callMethod ?
      //       n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      //   };
      //   if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      //   n.queue = []; t = b.createElement(e); t.async = !0;
      //   t.src = v; s = b.getElementsByTagName(e)[0];
      //   s.parentNode.insertBefore(t, s)
      // }(window, document, 'script',
      //   'https://connect.facebook.net/en_US/fbevents.js');
      // fbq('init', location.host === 'loramodas.com' ? '1528379187566003' : '895173741588158');
      // fbq('track', 'PageView');

      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
      }(window, document, 'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', location.host === 'loramodas.com' ? '1528379187566003' : '895173741588158');
      async function generateRandomHash() {
        // 生成一个随机字符串
        const randomString = Math.random().toString(36).substring(2);

        // 转换字符串为 Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(randomString);

        // 使用 Web Crypto API 生成 SHA-256 哈希
        const buffer = await crypto.subtle.digest('SHA-256', data);

        // 转换为十六进制字符串
        const hashedString = Array.from(new Uint8Array(buffer))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');

        return hashedString;
      }
      generateRandomHash().then(
        key => {
          fbq('track', 'PageView', {}, { eventID: key });
        }
      )
      fbq('track', 'ViewContent', { content_name: 'Homepage' });

      // !(function (c, b, d, a) {
      //   c[a] || (c[a] = {}); c[a].config =
      //   {
      //     pid: "gr6w69wpuh@db34193c9e236f8",
      //     appType: "web",
      //     imgUrl: "https://arms-retcode.aliyuncs.com/r.png?",
      //     sendResource: true,
      //     enableLinkTrace: true,
      //     behavior: true,
      //     enableSPA: true,
      //     useFmp: true,
      //     enableConsole: true
      //   };
      //   let newScript = document.createElement("script")
      //   newScript.src = d
      //   newScript.setAttribute("crossorigin", "")
      //   document.body.insertBefore(newScript, document.body.firstChild);
      // })(window, document, "https://sdk.rum.aliyuncs.com/v1/bl.js", "__bl");

      // (function () {
      //   window.__insp = window.__insp || [];
      //   __insp.push(['wid', 958754140]);
      //   var ldinsp = function () {
      //     if (typeof window.__inspld != "undefined") return; window.__inspld = 1; var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js?wid=958754140&r=' + Math.floor(new Date().getTime() / 3600000); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x);
      //   };
      //   setTimeout(ldinsp, 0);
      // })();

      (function () {
        window.__insp = window.__insp || [];
        __insp.push(['wid', 1033184887]);
        var ldinsp = function () {
          if (typeof window.__inspld != "undefined") return; window.__inspld = 1; var insp = document.createElement('script'); insp.type = 'text/javascript'; insp.async = true; insp.id = "inspsync"; insp.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://cdn.inspectlet.com/inspectlet.js?wid=1033184887&r=' + Math.floor(new Date().getTime() / 3600000); var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(insp, x);
        };
        setTimeout(ldinsp, 0);
      })();

      uid = localStorage.getItem("uid")
      if (!uid) {
        uid = uuidv4();
        localStorage.setItem("uid", uid);
      }
      startRecording()
    }, []);
  }
  return (
    <html lang={locale.language} style={{ direction: getDirection() }}>
      <head>
        <Seo />
        <Meta />
        <Links />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X12GDSEKQ1"></script>
        {/* <noscript><img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=895173741588158&ev=PageView&noscript=1" /></noscript> */}
      </head>
      <body>
        <Layout
          layout={data.layout}
          key={`${locale.language}-${locale.country}`}
        >
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function startRecording() {
  rrweb.record({
    emit(event) {
      // 将 event 存入 events 数组中
      events.push(event);
    },
  });
  // 每 10 秒调用一次保存录制数据的方法
  setInterval(() => {
    saveEvents();
  }, 10000);
}

function saveEvents() {
  let timeList = copyEvents.map((i) => {
    return i.timestamp;
  });
  let filterList = events.filter(
    (item) => timeList.indexOf(item.timestamp) === -1
  );
  copyEvents = copyEvents.concat(filterList);
  fetch.post(`https://cod.xgoodspic.com/record/rrweb/${location.host}/${uid}`, filterList).then(() => { });
}

function getReferer() {
  if (document.referrer) {
    return document.referrer;
  } else {
    return false;
  }
}

export function CatchBoundary() {
  const [root] = useMatches();
  const caught = useCatch();
  const isNotFound = caught.status === 404;
  const locale = root.data?.selectedLocale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale.language}>
      <head>
        <title>{isNotFound ? 'Not found' : 'Error'}</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout
          layout={root?.data?.layout}
          key={`${locale.language}-${locale.country}`}
        >
          {isNotFound ? (
            <NotFound type={caught.data?.pageType} />
          ) : (
            <GenericError
              error={{ message: `${caught.status} ${caught.data}` }}
            />
          )}
        </Layout>
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }) {
  const [root] = useMatches();
  const locale = root?.data?.selectedLocale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale.language}>
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Layout layout={root?.data?.layout}>
          <GenericError error={error} />
        </Layout>
        <Scripts />
      </body>
    </html>
  );
}

const LAYOUT_QUERY = `#graphql
  query layoutMenus(
    $language: LanguageCode
    $headerMenuHandle: String!
    $footerMenuHandle: String!
  ) @inContext(language: $language) {
    shop {
      id
      name
      description
    }
    headerMenu: menu(handle: $headerMenuHandle) {
      id
      items {
        ...MenuItem
        items {
          ...MenuItem
        }
      }
    }
    footerMenu: menu(handle: $footerMenuHandle) {
      id
      items {
        ...MenuItem
        items {
          ...MenuItem
        }
      }
    }
  }
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
`;

async function getLayoutData({ storefront }) {
  const HEADER_MENU_HANDLE = 'main-menu';
  const FOOTER_MENU_HANDLE = 'footer';

  const data = await storefront.query(LAYOUT_QUERY, {
    variables: {
      headerMenuHandle: HEADER_MENU_HANDLE,
      footerMenuHandle: FOOTER_MENU_HANDLE,
      language: storefront.i18n.language,
    },
  });

  invariant(data, 'No data returned from Shopify API');

  /*
        Modify specific links/routes (optional)
        @see: https://shopify.dev/api/storefront/unstable/enums/MenuItemType
        e.g here we map:
          - /blogs/news -> /news
          - /blog/news/blog-post -> /news/blog-post
          - /collections/all -> /products
      */
  const customPrefixes = { BLOG: '', CATALOG: 'products' };

  const headerMenu = data?.headerMenu
    ? parseMenu(data.headerMenu, customPrefixes)
    : undefined;

  const footerMenu = data?.footerMenu
    ? parseMenu(data.footerMenu, customPrefixes)
    : undefined;

  return { shop: data.shop, headerMenu, footerMenu };
}

const CART_QUERY = `#graphql
  query CartQuery($cartId: ID!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }

  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              compareAtPrice {
                ...MoneyFragment
              }
              price {
                ...MoneyFragment
              }
              requiresShipping
              title
              image {
                ...ImageFragment
              }
              product {
                handle
                title
                id
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        ...MoneyFragment
      }
      totalAmount {
        ...MoneyFragment
      }
      totalDutyAmount {
        ...MoneyFragment
      }
      totalTaxAmount {
        ...MoneyFragment
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
    }
  }

  fragment MoneyFragment on MoneyV2 {
    currencyCode
    amount
  }

  fragment ImageFragment on Image {
    id
    url
    altText
    width
    height
  }
`;

export async function getCart({ storefront }, cartId) {
  invariant(storefront, 'missing storefront client in cart query');

  const { cart } = await storefront.query(CART_QUERY, {
    variables: {
      cartId,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    cache: storefront.CacheNone(),
  });

  return cart;
}
