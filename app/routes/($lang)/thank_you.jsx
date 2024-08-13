import React from 'react'
import { Text } from '~/components';
import fetch from '~/fetch/axios';
import { getShopAddress, getLanguage, getDomain } from '~/lib/P_Variable';
const LText = getLanguage()

class Thantyou extends React.Component {
  componentDidMount() {
    this.getData()
  }
  state = {
    orderData: {},
    orderId: '',
    productData: null,
  };

  getData() {
    let shop = getShopAddress()
    let result = new URLSearchParams(window.location.search);
    let order_id = result.get('id')
    fetch.get(`${getDomain()}/account-service/media_orders/pass/${order_id}`).then(res => {
      if (res && res.data && res.data.success) {
        let odata = JSON.parse(res.data?.data?.order_title || '{}')
        // console.log(odata?.order)
        this.setState({
          orderData: odata?.order || '',
          orderId: order_id,
          productData: res.data?.form?.product_list?.[0]
        })

        let source_name = window.localStorage.getItem('sourceName')
        let referer_name = window.localStorage.getItem('refererName')
        let source_product_id = window.localStorage.getItem('sourceProductId')
        if (source_name) {
          let params = {
            source: source_name ? source_name : null,
            referer: referer_name ? referer_name : null,
            product_id: this.setSplit(source_product_id),
            shop: shop,
            total_price: odata?.totalOutstandingSet?.presentmentMoney?.amount,
            create_at: res.data?.data?.create_time,
            order_id: this.setSplit(odata.id)
          }
          fetch.post(`${getDomain()}/account-service/media_orders/set/pass`, params).then(() => { })
        }
      }
    })
  }
  setSplit(data) {
    if (data.indexOf('/') > -1) {
      let arr = data.split('/')
      return arr[arr.length - 1]
    } else {
      return data
    }
  }

  render() {
    let { orderData, productData } = this.state
    return (
      <div className='settle_accounts'>
        {
          productData ? <div className='product_box thank_product_box' >
            <div className="product_img">
              <img src={productData?.img_url} />
              <div className="product_count">{productData?.quantity}</div>
            </div>
            <div className='product_title'>
              <span>{productData?.title}</span>
              <span>{productData?.variantTitle}</span>
              <span>{LText.type} {parseFloat(productData?.price)}</span>
            </div>
          </div > : null
        }
        {
          orderData.shipping_address ? <div className='order_box' >
            <div className="section__header">
              <img src="https://platform.antdiy.vip/static/image/cloudstore_steps_finish.svg" />
              <div className="header__heading">
                <span className="order_number">{LText.orders} {this.state.orderId}</span>
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
                <div className='info_li'>
                  <div className='info_li_title'>{LText.payment}</div>
                  <div className='info_li_text'>{LText.payReceipt}</div>
                </div>
                <div className='info_li'>
                  <div className='info_li_title'>{LText.invoice}</div>
                  {orderData.shipping_address ? <div className='info_li_text'>
                    <p>{orderData.shipping_address.first_name}</p>
                    <p>{orderData.shipping_address.phone}</p>
                    <p>{orderData.shipping_address.country}</p>
                    <p>{orderData.shipping_address.province}</p>
                    <p>{orderData.shipping_address.city}</p>
                    <p>{orderData.shipping_address.address1}</p>
                    <p>{orderData.shipping_address.address2}</p>
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
          </div> : null
        }
      </div>
    )
  }
}

export default Thantyou
