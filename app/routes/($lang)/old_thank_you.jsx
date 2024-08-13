// 结账页
import { useEffect, useState } from 'react';
import { Text } from '~/components';
import fetch from '~/fetch/axios';
import { getShopAddress, getLanguage, getDomain } from '~/lib/P_Variable';
const LText = getLanguage()

export default function thank_you() {
  const [hasMounted, setHasMounted] = useState(false);
  const [orderData, setOrderData] = useState('');
  let shop = getShopAddress()
  useEffect(() => {
    setHasMounted(true);
    var canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.location !== "undefined");
    if (canUseDOM && window.location) {
      let result = new URLSearchParams(window.location.search);
      fetch.get(`${getDomain()}/account-service/media_orders/detail/pass?shop=${shop}&order_id=${result.get('id')}`).then(res => {
        if (res && res.data && res.data.success) {
          let odata = res.data.data ? JSON.parse(res.data.data) : {}
          setOrderData(odata)

          let source_name = window.localStorage.getItem('sourceName')
          let referer_name = window.localStorage.getItem('refererName')
          let source_product_id = window.localStorage.getItem('sourceProductId')
          if (source_name) {
            let params = {
              source: source_name ? source_name : null,
              referer: referer_name ? referer_name : null,
              product_id: setSplit(source_product_id),
              shop: shop,
              total_price: odata.totalOutstandingSet.presentmentMoney.amount,
              create_at: odata.createdAt,
              order_id: setSplit(odata.id)
            }
            fetch.post(`${getDomain()}/account-service/media_orders/set/pass`, params).then(() => { })
          }
        }
      })
    }
  }, []);
  // console.log(orderData)

  if (!hasMounted) {
    return null;
  }

  return (
    <div className='settle_accounts'>
      <ProductBox product={orderData.lineItems && orderData.lineItems.nodes ? orderData.lineItems.nodes[0] : ''} />
      <OrderBox orderData={orderData} />
    </div>
  )
}

export function ProductBox({ product }) {
  // let selectedVariant = JSON.parse(window.localStorage.getItem('selectedVariant'))
  // let currency = selectedVariant.price.currencyCode
  if (product) {
    return (
      <div className='product_box thank_product_box' >
        <img src={product.image.url} />
        <div className='product_title'>
          <span>{product.title}</span>
          <span>{product.variantTitle}</span>
          <span>{LText.type} {parseFloat(product?.originalTotalSet?.presentmentMoney?.amount)}</span>
        </div>
      </div >
    );
  }
}

export function OrderBox({ orderData }) {
  if (orderData) {
    return (
      <div className='order_box' >
        <div className="section__header">
          <img src="https://platform.antdiy.vip/static/image/cloudstore_steps_finish.svg" />
          <div className="header__heading">
            <span className="order_number">{LText.orders} {orderData.name}</span>
            <h2 className="header_title">{LText.thank}</h2>
          </div>
        </div>
        <div className='order_list'>
          <div className='order_list_title'>{LText.request}</div>
          <div className='order_list_text'>{LText.receive}</div>
        </div>
        <div className='order_list'>
          <div className='order_list_title'>{LText.updateOrder}</div>
          <div className='order_list_text'>{LText.information}</div>
        </div>
        <div className='order_list'>
          <div className='order_list_title'>{LText.customer}</div>
          <div className='customer_info'>
            {/* <div className='info_li'>
              <div className='info_li_title'>{LText.contactInfo}</div>
              <div className='info_li_text'>{orderData.customer.email}</div>
            </div>
            <div className='info_li'>
              <div className='info_li_title'>{LText.delivery}</div>
              {orderData.customer ? <div className='info_li_text'>
                <p>{orderData.shippingAddress.name}</p>
                <p>{orderData.shippingAddress.phone}</p>
                <p>{orderData.shippingAddress.country}</p>
                <p>{orderData.shippingAddress.province}</p>
                <p>{orderData.shippingAddress.city}</p>
                <p>{orderData.shippingAddress.address1}</p>
                <p>{orderData.shippingAddress.address2}</p>
              </div> : null}
            </div> */}
            <div className='info_li'>
              <div className='info_li_title'>{LText.payment}</div>
              <div className='info_li_text'>{LText.payReceipt}</div>
            </div>
            <div className='info_li'>
              <div className='info_li_title'>{LText.invoice}</div>
              {orderData.shippingAddress ? <div className='info_li_text'>
                <p>{orderData.shippingAddress.name}</p>
                <p>{orderData.shippingAddress.phone}</p>
                <p>{orderData.shippingAddress.country}</p>
                <p>{orderData.shippingAddress.province}</p>
                <p>{orderData.shippingAddress.city}</p>
                <p>{orderData.shippingAddress.address1}</p>
                <p>{orderData.shippingAddress.address2}</p>
              </div> : null}
            </div>
          </div>
        </div>
        {
          LText.type === 'RON' ? <button className='inline-block rounded font-medium text-center w-full bg-primary text-contrast' style={{ marginTop: '20px' }} onClick={() => { window.open('https://' + getShopAddress(), '_self') }}>
            <Text
              as="span"
              className="flex items-center justify-center gap-2 py-3 px-6"
            >
              <span>{LText.keeyshop}</span>
            </Text>
          </button> : null
        }
      </div>
    );
  }
}

function setSplit(data) {
  if (data.indexOf('/') > -1) {
    let arr = data.split('/')
    return arr[arr.length - 1]
  } else {
    return data
  }
}