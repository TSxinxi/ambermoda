import React from 'react'
import { Text } from '~/components';
import fetch from '~/fetch/axios';
import { getShopAddress, getLanguage, getDirection, getDomain } from '~/lib/P_Variable';
import { add, subtract, multiply } from '~/lib/floatObj';
const LText = getLanguage()

class SettleAccounts extends React.Component {
  componentDidMount() {
    this.getData()
  }
  state = {
    addressList: LText.addressList,
    productData: null,
    selectedVar: null,
    quantity: 1,
    isPreview: false,
    options: [],
    formData: {
      name: '',
      email: '',
      phone: '',
      country: LText.country,
      country_code: LText.type,
      state: '',
      city: '',
      area: '',
      postcode: '',
      building: '',
      house_number: '',
    },
    isSubmit: false,
    errorText: '',
    province: [],
    streetList: []
  };

  getData() {
    if (localStorage.getItem('productVariant')) {
      let productData = JSON.parse(localStorage.getItem('productVariant'))
      const firstVariant = productData.variants.nodes[0];
      console.log(productData)
      const selectedVariant = productData.selectedVariant ?? firstVariant
      if (localStorage.getItem('currencyCode')) {
        selectedVariant.price.currencyCode = localStorage.getItem('currencyCode')
      }
      let options = productData.options.map(item => {
        item.values = item.values.map(val => {
          let obj = {
            value: val,
            active: false
          }
          selectedVariant.selectedOptions.forEach(pop => {
            if (pop.name === item.name && val === pop.value) {
              obj.active = true
            }
          })
          return obj
        })
        return item
      })
      let province = []
      if (LText.type === 'HUF' && this.state.addressList) {
        for (var i in this.state.addressList) {
          let obj = {
            name: i,
            value: i === 'Megye' ? '' : i,
            children: [{ name: 'Település/Kerület', value: '' }]
          }
          if (this.state.addressList[i]) {
            for (var j in this.state.addressList[i]) {
              obj.children.push({
                name: j,
                value: j,
              })
            }
          }
          province.push(obj)
        }
      }
      this.setState({
        productData: productData,
        selectedVar: selectedVariant,
        options: options,
        province: province,
        streetList: [{ name: LText.type === 'HUF' ? 'Utca' : LText.type === 'CZK' ? 'Vyberte obec' : 'Vă rugăm să selectați Localitate', value: '' }],
      })
    }
  }
  setSplit(data) {
    if (data.indexOf('/') > -1) {
      let arr = data.split('/')
      return arr[arr.length - 1]
    } else {
      return data
    }
  }
  changeVariant(value, option) {
    let { options, productData } = this.state
    let copyOpt = [...options]
    let variantsList = productData.variants.nodes || []
    copyOpt.forEach(item => {
      if (item.name === option) {
        item.values.forEach(val => {
          val.active = false
          if (val.value === value) {
            val.active = true
          }
        })
      }
    })

    let filterOpt = copyOpt.map(item => {
      return {
        name: item.name,
        value: item.values.filter(i => i.active)[0].value
      }
    })

    if (variantsList && variantsList.length > 0) {
      variantsList.forEach(varItem => {
        varItem._list = [];
        varItem.selectedOptions.forEach(item => {
          const _item = filterOpt.find(i => i.value == item.value);
          if (_item && _item.name == item.name) {
            varItem._list.push(_item)
          }
        })
      })
      let selectOpt = variantsList.filter(i => i._list && i._list.length === filterOpt.length)[0]
      if (selectOpt) {
        if (localStorage.getItem('currencyCode')) {
          selectOpt.price.currencyCode = localStorage.getItem('currencyCode')
        }
        this.setState({
          selectedVar: selectOpt,
          options: copyOpt,
        })
      }
    }
  }
  setQuantity(value) {
    const regex = /[^0-9]/g;
    if (value > 10000) {
      this.setState({ quantity: 10000 })
    } else {
      this.setState({ quantity: value.toString().replace(regex, '') })
    }
  }
  changeForm(name, value) {
    let { formData } = this.state
    formData[name] = value
    this.setState({ formData })
  }
  changeCity(value) {
    let default_name = LText.type === 'HUF' ? 'Utca' : LText.type === 'CZK' ? 'Vyberte obec' : 'Vă rugăm să selectați Localitate'
    let { formData } = this.state
    if (!value && LText.type !== 'HUF') {
      formData.area = ''
      formData.postcode = ''
      this.setState({ formData, streetList: [{ name: default_name, value: '' }] })
    }
    fetch.get(`${getDomain()}/account-service/media_orders/pass/street?value=${value}`).then(res => {
      if (res && res.data && res.data.success && res.data[value]) {
        let list = JSON.parse(res.data[value])
        let streetData = []
        for (var i in list) {
          streetData.push({
            name: i,
            value: i,
            code: list[i] instanceof Array ? list[i][0] : list[i]
          })
        }
        if (streetData && streetData.length > 0) {
          if (LText.type !== 'HUF') {
            streetData.unshift({ name: default_name, code: '', value: '' })
          }
          formData.area = streetData[0].value
          formData.postcode = streetData[0].code
          this.setState({ streetList: streetData, formData })
        }
      }
    })
  }
  changeArea(value) {
    let { formData, streetList } = this.state
    let streetObj = streetList.filter(i => i.value === value)[0]
    formData.postcode = streetObj ? streetObj.code : streetList[0].code
    formData.city = value
    this.setState({ formData })
  }
  sendFbq(a, b, c) {
    if ("function" == typeof window.fbq) {
      window.fbq("track", a, b, c)
    }
  }
  setErrorText(value) {
    this.setState({ errorText: value }, () => {
      var count = 2;
      let that = this
      let countdown = setInterval(function () {
        count--;
        if (count < 1) {
          clearInterval(countdown);
          return that.setState({ errorText: '' })
        }
      }, 800)
    })
  }
  SettleAccounts() {
    let { quantity, selectedVar, formData } = this.state
    if (!quantity || quantity < 1) {
      return this.setErrorText(LText.errorQuantity)
    }
    if (!formData.name || !formData.phone || !formData.state || !formData.city || !formData.area) {
      return this.setErrorText(LText.empty)
    }
    if (LText.type === 'HUF' && !formData.building) {
      return this.setErrorText(LText.empty)
    }
    if (LText.type === 'RON' && !formData.house_number) {
      return this.setErrorText(LText.empty)
    }
    let line_items = [{
      product_id: this.setSplit(this.state.productData.id),
      quantity: quantity,
      variant_id: this.setSplit(selectedVar.id),
    }]
    let source_name = window.localStorage.getItem('sourceName')
    formData.line_items = line_items
    formData.count = 1
    formData.shop = getShopAddress()
    formData.source = source_name ? source_name : null
    if (LText.type === 'HUF') {
      formData.area = formData.area + ' ' + formData.building
    }
    formData.tags = LText.type
    formData.route = 2
    console.log(formData)
    return

    this.setState({ isSubmit: true })
    fetch.post(`${getDomain()}/account-service/media_orders/create/pass`, params).then(res => {
      if (res && res.data) {
        if (res.data.success && res.data.data && res.data.data.oid) {
          let orderData = res.data?.data?.detail?.order
          if (orderData) {
            let contents = line_items.map(item => {
              return {
                id: item.variant_id,
                quantity: item.quantity,
              }
            })
            this.sendFbq(
              'Purchase',
              {
                content_type: 'product',
                contents: contents,
                value: orderData?.total_price,
                currency: orderData?.currency,
              },
              {
                eventID: orderData?.token || (new Date).getTime() + ""
              }
            )
          }
          window.open(`/thank_you?id=${res.data.data.oid}`, '_self')
        } else {
          this.setState({ isSubmit: false })
          return this.setErrorText(res?.data?.msg || LText.orderError)
        }
      } else {
        this.setState({ isSubmit: false })
      }
    })
  }

  render() {
    let { selectedVar, options, quantity, formData } = this.state
    return (
      <div className='settle_accounts'>
        <div className='settle_accounts_title shadow_box'>
          <div>
            <span onClick={() => { window.history.back() }} className='prev'><img src="https://platform.antdiy.vip/static/image/xiangzuo.svg" /></span>
            <span>{LText.confirRequest}</span>
            <i></i>
          </div>
        </div>
        <div className='product_box shadow_box' >
          {
            this.state.isPreview ? <div className='fixed_img' onClick={() => { this.setState({ isPreview: false }) }}>
              <img src={selectedVar?.image.url} />
            </div> : null
          }
          {selectedVar?.image ? <img src={selectedVar?.image.url} onClick={() => { this.setState({ isPreview: true }) }} /> : null}
          <div className='product_title'>
            <span>{selectedVar?.product.title}</span>
            <span>{selectedVar?.title}</span>
            <Text
              as="span"
              className="flex items-center gap-2"
            >
              <span className='font_weight_b'>{selectedVar?.price.currencyCode} {parseFloat(multiply(quantity, selectedVar?.price?.amount))}</span>
            </Text>
          </div>
        </div >
        <div className='order_content'>
          <div className='variant_box padding16'>
            {options
              .filter((option) => option.values.length > 1)
              .map((option) => (
                <div key={option.name} className='variant_li'>
                  <div className='title'>{option.name}</div>
                  <div className='flex_center variant_li_sku'>{option.values.map((item, index) => {
                    return (
                      <div className={item.active ? 'active_sku bord_sku' : 'bord_sku'} key={index} onClick={() => { this.changeVariant(item.value, option.name) }}>{item.value}</div>
                    )
                  })}</div>
                </div>
              ))}
            <div className='variant_li' key='quantity_li'>
              <div className='title'>{LText.quantityText}</div>
              <div className='quantity_li'>
                <button onClick={() => { if (quantity > 1) this.setQuantity(subtract(quantity, 1)) }}>-</button>
                <input type="text" value={quantity} onChange={(e) => { this.setQuantity(e.target.value) }} />
                <button onClick={() => { this.setQuantity(add(quantity, 1)) }}>+</button>
              </div>
            </div>
          </div >
          <div className='information_in'>
            <div className='information_in_title padding16'>{LText.recipientInfo}</div>
            <div className='information_in_list padding16'>
              <div className='in_list'>
                <div className='in_list_title'>
                  <span>{LText.yourName} <i>*</i></span>
                  <p></p>
                </div>
                <input type="text" placeholder={LText.fullName} value={formData.name} onChange={(e) => { this.changeForm('name', e.target.value) }} />
              </div>
              <div className='in_list'>
                <div className='in_list_title'>
                  <span>{LText.telephone} <i>*</i></span>
                  <p></p>
                </div>
                <input type="text" placeholder={LText.telephone} value={formData.phone} onChange={(e) => {
                  const regex = /[^0-9]/g;
                  this.changeForm('phone', e.target.value.replace(regex, ''))
                }} />
              </div>
              {
                LText.type === 'RON' ? <>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.governor} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.governor} value={formData.state} onChange={(e) => { this.changeForm('state', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.city} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.city} value={formData.city} onChange={(e) => { this.changeForm('city', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.address} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder='ex: Strada, numar, bloc, scara, etaj, apartament' value={formData.area} onChange={(e) => { this.changeForm('area', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>Numărul casei <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder='Numărul casei' value={formData.house_number} onChange={(e) => { this.changeForm('house_number', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.postalCode} <i></i></span>
                      <p></p>
                    </div>
                    <input type="number" placeholder={LText.postalCode} value={formData.postcode} onChange={(e) => {
                      if (e.target.value.length > 6) {
                        this.changeForm('postcode', e.target.value.slice(0, 6))
                      } else { this.changeForm('postcode', e.target.value) }
                    }} />
                  </div>
                </> : LText.type === 'CZK' ? <>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.governor} <i>*</i></span>
                      <p></p>
                    </div>
                    <select name="state" nullmsg={LText.district} value={formData.state} onChange={(e) => { changeCity(e.target.value); this.changeForm('state', e.target.value) }} style={{ backgroundPosition: getDirection() === 'rtl' ? 'left .5rem center' : 'right .5rem center' }}>
                      {
                        this.state.addressList.map((item, index) => {
                          return (
                            <option value={item.value} key={index}>{item.name}</option>
                          )
                        })
                      }
                    </select>
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.city} <i>*</i></span>
                      <p></p>
                    </div>
                    <select name="city" value={formData.city} onChange={(e) => { changeArea(e.target.value) }} style={{ backgroundPosition: getDirection() === 'rtl' ? 'left .5rem center' : 'right .5rem center' }}>
                      {
                        this.state.streetList.map((item, index) => {
                          return (
                            <option value={item.value} key={index}>{item.name}</option>
                          )
                        })
                      }
                    </select>
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.postalCode} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="number" placeholder={LText.postalCode} value={formData.postcode} onChange={(e) => {
                      if (e.target.value.length > 5) {
                        setPostcode(e.target.value.slice(0, 5))
                        this.changeForm('postcode', e.target.value.slice(0, 5))
                      } else { this.changeForm('postcode', e.target.value) }
                    }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.address} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder='Ulice + číslo dveří: např. (Pod Pivovarem 265)' value={formData.area} onChange={(e) => { this.changeForm('area', e.target.value) }} />
                  </div>
                </> : LText.type === 'HUF' ? <>
                  {
                    province && province.length > 0 ? <div className='in_list'>
                      <div className='in_list_title'>
                        <span>Megye <i>*</i></span>
                        <p></p>
                      </div>
                      <select name="state" nullmsg={LText.district} value={formData.state} onChange={(e) => { this.changeForm('state', e.target.value); this.changeForm('city', e.target.value); this.changeForm('postcode', e.target.value); }} style={{ backgroundPosition: getDirection() === 'rtl' ? 'left .5rem center' : 'right .5rem center' }} >
                        {
                          province.map((item, index) => {
                            return (
                              <option value={item.value} key={index}>{item.name}</option>
                            )
                          })
                        }
                      </select>
                    </div> : null
                  }
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>Település/Kerület <i>*</i></span>
                      <p></p>
                    </div>
                    <select name="city" nullmsg={LText.selectCity} value={formData.city} onChange={(e) => { this.changeForm('city', e.target.value) }} style={{ backgroundPosition: getDirection() === 'rtl' ? 'left .5rem center' : 'right .5rem center' }}>
                      {
                        province.filter(i => i.value === state)[0].children.map((item, index) => {
                          return (
                            <option value={item.value} key={index}>{item.name}</option>
                          )
                        })
                      }
                    </select>
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.address} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.address} value={formData.area} onChange={(e) => { this.changeForm('area', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.postalCode}</span>
                      <p></p>
                    </div>
                    <input type="number" placeholder={LText.postalCode} value={formData.postcode} onChange={(e) => {
                      if (e.target.value.length > 4) {
                        this.changeForm('postcode', e.target.value.slice(0, 4))
                      } else { this.changeForm('postcode', e.target.value) }
                    }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>házszám <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder='Utca+házszám: Például (KBocskai utca 18)' value={formData.building} onChange={(e) => { this.changeForm('building', e.target.value) }} />
                  </div>
                </> : LText.type === 'zł' ? <>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.address} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.addressPle} value={formData.area} onChange={(e) => { this.changeForm('area', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.governor} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.governor} value={formData.state} onChange={(e) => { this.changeForm('state', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.city} <i>*</i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.city} value={formData.city} onChange={(e) => { this.changeForm('city', e.target.value) }} />
                  </div>
                  <div className='in_list'>
                    <div className='in_list_title'>
                      <span>{LText.postalCode} <i></i></span>
                      <p></p>
                    </div>
                    <input type="text" placeholder={LText.postalCode} value={formData.postcode} onChange={(e) => { this.changeForm('postcode', e.target.value) }} />
                  </div>
                </> : <></>
              }
              <div className='in_list'>
                <div className='in_list_title'>
                  <span>{LText.semail}</span>
                  <p></p>
                </div>
                <input name="email" type="text" placeholder={LText.semail} value={formData.email} onChange={(e) => { this.changeForm('email', e.target.value) }} />
              </div>
            </div>
            <div className='settle_accounts_foot'>
              <div>
                {
                  selectedVar?.availableForSale ? <div className='submit_btn'>
                    {
                      this.state.isSubmit ? <div className='loading_box'>
                        <img src="https://platform.antdiy.vip/static/image/hydrogen_loading.gif" />
                      </div> : null
                    }
                    <button className='inline-block rounded font-medium text-center w-full bg-primary text-contrast paddingT5' onClick={() => { this.SettleAccounts() }}>
                      <Text
                        as="span"
                        className="flex items-center justify-center gap-2 py-3 px-6 font_weight_b buy_text"
                      >
                        <span>{LText.apply}</span>
                      </Text>
                    </button>
                  </div> : <div className='submit_btn'>
                    <button className='inline-block rounded font-medium text-center w-full bg-primary paddingT5 out_of_btn'>
                      <Text
                        as="span"
                        className="flex items-center justify-center gap-2 py-3 px-6 font_weight_b buy_text"
                      >
                        <span>{LText.sold}</span>
                      </Text>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
          <div className='padding16'>
            <div className='payment_method'>
              <div className='information_in_title'>{LText.method}</div>
              <div>
                <div className="payment_method_check">
                  <div>
                    <input type="radio" name="payment" defaultChecked="true" />
                    <p>{LText.recieving}</p>
                  </div>
                  <img src="https://platform.antdiy.vip/static/image/hydrogen_icon_delivery.svg" />
                </div>
                <div className='description'>{LText.onlinePayment}</div>
              </div>
            </div>
            <div className='order_tips'>
              <span>{LText.Website}</span>
              <p>{LText.homepage}</p>
            </div>
          </div>
        </div>
        {this.state.errorText ? <div className='error_box'>
          <span>{this.state.errorText}</span>
        </div> : null}
      </div >
    )
  }
}

export default SettleAccounts
