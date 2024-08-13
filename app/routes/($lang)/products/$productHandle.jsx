// 详情页
import { useRef, useMemo, useEffect, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { defer } from '@shopify/remix-oxygen';
import fetch from '../../../fetch/axios';
import { getShopAddress, openComment, getLanguage, getDomain } from '~/lib/P_Variable';
import $ from 'jquery'
import {
  useLoaderData,
  useSearchParams,
  useLocation,
  useTransition,
} from '@remix-run/react';
import {
  AnalyticsPageType,
  Money,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  Heading,
  IconCaret,
  IconCheck,
  ProductGallery,
  Section,
  Text,
  Link,
  AddToCartButton,
} from '~/components';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import { MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT } from '~/data/fragments';
const LText = getLanguage()

const seo = ({ data }) => {
  const media = flattenConnection(data.product.media).find(
    (media) => media.mediaContentType === 'IMAGE',
  );

  return {
    title: data?.product?.seo?.title ?? data?.product?.title,
    media: media?.image,
    description: data?.product?.seo?.description ?? data?.product?.description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      brand: data?.product?.vendor,
      name: data?.product?.title,
    },
  };
};
let productData = ''
let productVariants = []
let currencyCode = ''

export const handle = {
  seo,
};

export async function loader({ params, request, context }) {
  const { productHandle } = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const searchParams = new URL(request.url).searchParams;

  const selectedOptions = [];
  searchParams.forEach((value, name) => {
    selectedOptions.push({ name, value });
  });

  const { shop, product } = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle: productHandle,
      selectedOptions,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const firstVariant = product.variants.nodes[0];
  const selectedVariant = product.selectedVariant ?? firstVariant;

  const productAnalytics = {
    productGid: product.id,
    variantGid: selectedVariant.id,
    name: product.title,
    variantName: selectedVariant.title,
    brand: product.vendor,
    price: selectedVariant.price.amount,
  };

  return defer({
    product,
    shop,
    recommended,
    analytics: {
      pageType: AnalyticsPageType.product,
      resourceId: product.id,
      products: [productAnalytics],
      totalValue: parseFloat(selectedVariant.price.amount),
    },
  });
}

//评论列表
function GetJudge(product_id, page, sortBy, rating) {
  let params = {
    url: getShopAddress(),
    shop_domain: getShopAddress(),
    platform: 'shopify',
    per_page: 5,
    product_id: product_id,
    page: page,
    filter_rating: rating ? rating : null
  }
  if (sortBy === 'created_at') {
    params.sort_by = 'created_at'
    params.sort_dir = 'desc'
  } else if (sortBy === 'desc') {
    params.sort_by = 'rating'
    params.sort_dir = 'desc'
  } else if (sortBy === 'asc') {
    params.sort_by = 'rating'
    params.sort_dir = 'asc'
  } else {
    params.sort_by = sortBy
  }
  return (fetch.get(`https://judge.me/reviews/reviews_for_widget`, { params })
    .then(res => {
      if (res && res.data && res.data.html) {
        var html_data = document.createElement('div')
        html_data.innerHTML = res.data.html

        if (html_data) {
          let commentRev = html_data.getElementsByClassName('jdgm-rev')
          // 分页
          let commentPaginate = html_data.getElementsByClassName('jdgm-paginate')[0]
          if (commentPaginate) {
            let numPage = html_data.getElementsByClassName('jdgm-paginate__page')
            Array.from(numPage).forEach(item => {
              item.style.backgroundImage = item.className.indexOf('next') > -1 ? 'url("https://platform.antdiy.vip/static/image/hydrogen_icon_Next.svg")' :
                item.className.indexOf('last') > -1 ? 'url("https://platform.antdiy.vip/static/image/hydrogen_icon_Last.svg")' :
                  item.className.indexOf('first') > -1 ? 'url("https://platform.antdiy.vip/static/image/hydrogen_icon_First.svg")' :
                    item.className.indexOf('prev') > -1 ? 'url("https://platform.antdiy.vip/static/image/hydrogen_icon_Previous.svg")' :
                      item.innerHTML
            })
          }
          // 评论列表
          if (commentRev && commentRev.length > 0) {
            Array.from(commentRev).forEach(item => {
              let commentImg = item.getElementsByClassName('jdgm-rev__pic-img')
              let commentTime = item.getElementsByClassName('jdgm-rev__timestamp')[0]
              let commentStar = item.getElementsByClassName('jdgm-star')
              let commentIcon = item.getElementsByClassName('jdgm-rev__author-wrapper')[0]

              if (commentImg && commentImg.length > 0) {
                Array.from(commentImg).forEach(val => {
                  if (val && val.getAttribute("data-src")) {
                    val.src = val.getAttribute("data-src")
                  }
                })
              }
              if (commentTime && commentTime.getAttribute("data-content")) {
                // commentTime.innerHTML = new Date(commentTime.getAttribute("data-content")).toLocaleDateString()
                commentTime.innerHTML = commentTime.getAttribute("data-content").slice(0, 10)
              }
              if (commentIcon) {
                let img = '<img src="https://platform.antdiy.vip/static/image/userIcon.svg" alt="" />'
                commentIcon.innerHTML = commentIcon.innerHTML.indexOf(img) > -1 ? commentIcon.innerHTML : commentIcon.innerHTML + img;
                commentIcon.className = 'flex_center'
              }
              if (commentStar && commentStar.length > 0) {
                Array.from(commentStar).forEach(val => {
                  if (val.className.indexOf('jdgm--on') > -1) {
                    val.innerHTML = '<img src="https://platform.antdiy.vip/static/image/hydrogen_icon_star_quan.svg" />'
                  }
                  if (val.className.indexOf('jdgm--off') > -1) {
                    val.innerHTML = '<img src="https://platform.antdiy.vip/static/image/hydrogen_icon_star_kongg.svg" />'
                  }
                })
              }
            })
          }
          return html_data.innerHTML
        }
      }
    })
    .catch(function (error) {
    }).finally(() => {
    }))
}
//评论头部
function GetCommentHeader() {
  return (fetch.get(`https://${getShopAddress()}${window.location.pathname}`)
    .then(res => {
      if (res && res.data) {
        var urlDiv = document.createElement("div");
        urlDiv.innerHTML = res.data;
        // var urlDivHead = urlDiv
        var urlDivHead = urlDiv.getElementsByClassName('jdgm-rev-widg__header')[0]
        if (urlDivHead) {
          let averageStar = urlDivHead.getElementsByClassName('jdgm-star')
          let averageRow = urlDivHead.getElementsByClassName('jdgm-histogram__row')
          let averageNumStr = urlDivHead.getElementsByClassName('jdgm-rev-widg__summary-stars')[0]
          let averageText = urlDivHead.getElementsByClassName('jdgm-rev-widg__summary-text')[0]
          let averageWrapper = urlDivHead.getElementsByClassName('jdgm-rev-widg__sort-wrapper')[0]

          if (averageWrapper) {
            averageWrapper.innerHTML = `<button class='add_comment'>${LText.addComment}</button>`
            averageWrapper.style.display = 'none'
          }
          if (averageText) {
            if (averageText.innerHTML === 'Be the first to write a review') {
              averageText.innerHTML = LText.commentResult
            } else {
              let summaryNum = averageText.innerHTML.match(/\d+(\.\d+)?/g)[0]
              if (summaryNum) {
                averageText.innerHTML = LText.based1 + summaryNum + LText.based2
              }
            }
          }
          if (averageNumStr) {
            let averageNum = averageNumStr.getAttribute("aria-label").match(/\d+(\.\d+)?/g)[0]
            if (averageNum) {
              if (LText.type === 'SA') {
                averageNumStr.innerHTML = averageNum + averageNumStr.innerHTML + ` من 5`
              } else {
                averageNumStr.style.direction = 'initial'
                averageNumStr.innerHTML = `${averageNum} out of 5`
              }
            }
          }
          if (averageRow && averageRow.length > 0) {
            Array.from(averageRow).forEach(item => {
              item.style.cursor = Number(item.getAttribute("data-frequency")) ? 'pointer' : 'inherit'
              let averageFrequency = item.getElementsByClassName('jdgm-histogram__frequency')[0]
              if (averageFrequency) {
                averageFrequency.innerHTML = item.getAttribute("data-frequency")
              }
            })
          }
          if (averageStar && averageStar.length > 0) {
            Array.from(averageStar).forEach(item => {
              item.innerHTML = item.className.indexOf('jdgm--on') > -1 ? '<img src="https://platform.antdiy.vip/static/image/hydrogen_icon_star_quan.svg" />' :
                item.className.indexOf('jdgm--off') > -1 ? '<img src="https://platform.antdiy.vip/static/image/hydrogen_icon_star_kongg.svg" />' :
                  item.className.indexOf('jdgm--half') > -1 ? '<img src="https://platform.antdiy.vip/static/image/hydrogen_icon_star_bann.svg" />' : ''
            })
          }
          return urlDivHead.innerHTML
        }
      }
    }).catch(function (error) {
    }).finally(() => {
    }))
}
// 筛选下拉框
function setScreen(e, product_id, setComment, setSortBy, filtRat) {
  setSortBy(e)
  GetJudge(product_id, 1, e, filtRat).then(res => {
    if (res) {
      setComment(res)
    }
  })
}
// 分页
function changePage(e, product_id, setComment, sortBy, filtRat) {
  if (e.target.className.indexOf('jdgm-paginate__page') > -1 && e.target.className.indexOf('jdgm-curt') === -1) {
    GetJudge(product_id, e.target.getAttribute("data-page"), sortBy, filtRat).then(res => {
      if (res) {
        setComment(res)
      }
    })
  }
}
// 显示添加评论模块、刷新页面、筛选评论
function clickComment(e, setFiltRat, product_id, sortBy, setComment) {
  if (e.target.className.indexOf('add_comment') > -1) {
    WriteReview()
  }
  if (e.target.className.indexOf('refresh_page') > -1) {
    window.location.reload();
  }
  if (e.target.className.indexOf('jdgm-histogram__clear-filter') > -1) {
    setFiltRat('')
    GetJudge(product_id, 1, sortBy).then(res => {
      if (res) {
        setComment(res)
        $('.jdgm-histogram__clear-filter')[0].innerHTML = ''
      }
    })
  }
  let starScreen = $(e.target).parents('.jdgm-histogram__row')[0]
  if (starScreen && Number(starScreen.getAttribute("data-frequency"))) {
    let rating = starScreen.getAttribute("data-rating")
    setFiltRat(rating)
    GetJudge(product_id, 1, sortBy, rating).then(res => {
      if (res) {
        setComment(res)
        $('.jdgm-histogram__clear-filter')[0].innerHTML = LText.seeAll
      }
    })
  }
}
function WriteReview() {
  $(".jq_slow").slideToggle("slow");
}
// 添加图片
function changeImg(e, imgList, setImgList, imgKey, setImgKey) {
  let files = e.target.files
  if (files.length + imgList.length > 5) {
    alert(LText.image5)
    return
  }

  if (files[0]) {
    if (imgKey) {
      Promise.all(getImgName(files, imgKey)).then((res) => {
        res.forEach((item) => {
          if (item) {
            imgList.push(item)
          }
        })
        setImgList([...imgList])
      })
    } else {
      fetch.get(`https://judge.me/api/v1/pictures/presigned_data?url=${getShopAddress()}&shop_domain=${getShopAddress()}&platform=shopify`)
        .then(res => {
          if (res && res.data && res.data.fields) {
            setImgKey(res.data)
            Promise.all(getImgName(files, res.data)).then((res) => {
              res.forEach((item) => {
                if (item) {
                  imgList.push(item)
                }
              })
              setImgList([...imgList])
            })
          }
        })
    }
  }
}
// 获取图片链接
function getImgName(files, obj) {
  let requestConfig = {
    headers: {
      "Accept": "*/*",
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }
  return Array.from(files).map(item => {
    let formData = new FormData();
    formData.append("key", obj.key_prefix + randomString() + '__' + item.name);
    formData.append("acl", obj.fields.acl);
    formData.append("success_action_status", obj.fields.success_action_status);
    formData.append("policy", obj.fields.policy);
    formData.append("x-amz-credential", obj.fields['x-amz-credential']);
    formData.append("x-amz-algorithm", obj.fields['x-amz-algorithm']);
    formData.append("x-amz-date", obj.fields['x-amz-date']);
    formData.append("x-amz-signature", obj.fields['x-amz-signature']);
    formData.append("file", item);

    return new Promise((resolve, reject) => {
      fetch.post(obj.url, formData, requestConfig)
        .then(res => {
          if (res.status === 201 && res.statusText === 'Created') {
            var keyDiv = document.createElement('div')
            keyDiv.innerHTML = res.data
            var reader = new FileReader();
            reader.readAsDataURL(item);
            reader.onload = function (evt) {
              resolve({ url: evt.target.result, key: keyDiv.getElementsByTagName('key')[0].innerHTML });
            }
          }
        })
    });
  })
}
// 随机数
function randomString() {
  var t = "ABCDEFGHJKMNPORSTWXYZabcdefhijkmnprstwxyz012345678"
  var n = ''
  for (let i = 0; i < 5; i++) n += t.charAt(Math.floor(Math.random() * t.length));
  return n
}
// 提交评论
function submitReview(params, imgList, setErrorText, setIsSuccess) {
  if (!params.body) {
    return setErrorText({ type: 1, content: LText.error })
  }
  if (!params.name) {
    return setErrorText({ type: 2, content: LText.error })
  }
  if (!params.email) {
    return setErrorText({ type: 3, content: LText.error })
  }
  var emailRegExp = /^[a-zA-Z0-9]+([-_.][A-Za-zd]+)*@([a-zA-Z0-9]+[-.])+[A-Za-zd]{2,5}$/;
  if (!emailRegExp.test(params.email)) {
    return setErrorText({ type: 3, content: LText.rightEmail })
  }

  let requestConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }
  let formData = new FormData();
  formData.append("url", params.url);
  formData.append("shop_domain", params.shop_domain);
  formData.append("reviewer_name_format", params.reviewer_name_format);
  formData.append("name", params.name);
  formData.append("email", params.email);
  formData.append("rating", params.rating);
  formData.append("title", params.title);
  formData.append("body", params.body);
  formData.append("id", params.id);
  if (imgList && imgList.length > 0) {
    imgList.forEach((item, index) => {
      formData.append(`picture_keys[${index}]`, item.key);
    })
  }
  fetch.post(`https://judge.me/api/v1/reviews`, formData, requestConfig)
    .then(res => {
      WriteReview()
      setIsSuccess(true)
      let wrapBox = document.getElementsByClassName('jdgm-rev-widg__sort-wrapper')[0]
      if (wrapBox) {
        wrapBox.innerHTML = `<button class='refresh_page'>refresh page</button>`
      }
      let pageView = document.getElementsByClassName('comment_box_content')[0]
      if (pageView) {
        pageView.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    })
}

export default function Product() {
  const { product, shop, recommended } = useLoaderData();
  var canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.localStorage !== "undefined");
  if (canUseDOM && productVariants && productVariants.length > 0) {
    let result = new URLSearchParams(window.location.search);
    let param = result.get('variant');
    if (param) {
      product.selectedVariant = productVariants.filter(i => i.id.indexOf(param) > -1)[0]
    }
  }
  const { media, title, vendor, descriptionHtml } = product;
  const { shippingPolicy, refundPolicy } = shop;
  const firstVariant = product.variants.nodes[0];
  const selectedVariant = product.selectedVariant ?? firstVariant;
  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount;
  const isOutOfStock = !selectedVariant?.availableForSale;
  const strProductId = product.id.lastIndexOf("/");
  let product_id = strProductId ? product.id.slice(strProductId + 1) : '';

  const [hasMounted, setHasMounted] = useState(false);
  const [commentHtml, setComment] = useState('');
  const [commentHeader, setCommentHeader] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [review, setReview] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [imgList, setImgList] = useState([]);
  const [errorText, setErrorText] = useState({ type: '', content: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [starScore, setStarScore] = useState(5);
  const [hoverStar, setHhoverStar] = useState(5);
  const [imgKey, setImgKey] = useState('');
  const [reviewer_name_format, setFrmat] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [filtRat, setFiltRat] = useState('');
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    setHasMounted(true);
    if (canUseDOM) {
      let href = window.location.href
      let result = new URLSearchParams(window.location.search);
      let param = result.get('source');
      let site = result.get('site');
      if (href && href.indexOf('-huf') > -1) {
        currencyCode = 'HUF'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      } else if (href && href.indexOf('-czk') > -1) {
        currencyCode = 'CZK'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      } else if (href && href.indexOf('-pln') > -1) {
        currencyCode = 'zł'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      } else {
        localStorage.removeItem('currencyCode')
        setCurrency(selectedVariant?.price?.currencyCode)
      }
      if (site === 'POL') {
        currencyCode = 'zł'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      }
      if (site === 'EUR') {
        currencyCode = 'EUR'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      }
      if (site === 'HUF') {
        currencyCode = 'HUF'
        localStorage.setItem('currencyCode', currencyCode)
        setCurrency(currencyCode)
      }
      if (localStorage.getItem('refererName')) {
        localStorage.setItem('sourceProductId', product.id)
      }
      if (param) {
        let qs = location.search.length > 0 ? location.search.substring(1) : ""
        window.localStorage.setItem('sourceObj', qs)
        window.localStorage.setItem('sourceName', param)
        window.localStorage.setItem('sourceProductId', product.id)
      }
      if (product_id && openComment()) {
        // 评论
        GetJudge(product_id, 1, sortBy).then(res => {
          if (res) {
            setComment(res)
          }
        })
        // 评论头部
        GetCommentHeader().then(res => {
          if (res) {
            setCommentHeader(res)
          }
        })
      }
    }
  }, []);
  if (!hasMounted) {
    return null;
  }
  productData = product
  productVariants = product.variants.nodes
  if (productData) {
    sendGtag({ event_name: "PageView" });
    saveXgood(["ViewContent", "PageView"]);
  }

  return (
    <>
      <Section padding="x" className="px-0 prodect_section">
        <div className="product_details items-start md:gap-6 md:grid-cols-2">
          {/* 详情页右侧 */}
          <ProductGallery
            media={media.nodes}
            product={product}
            className="w-screen md:w-full lg:col-span-2"
          />
          <div className="left_product sticky md:-mb-nav md:top-nav md:-translate-y-nav md:pt-nav hiddenScroll padding16">
            <section className="flex flex-col w-full md:mx-auto md:max-w-sm md:px-0" style={{ color: '#141414E6' }}>
              <div className="grid gap-2">
                <Heading as="h1" className="whitespace-normal">
                  {title}
                </Heading>
                {/* {vendor && (
                  <Text className={'opacity-50 font-medium'}>{vendor}</Text>
                )} */}
              </div>
              <ProductForm />
              {descriptionHtml && (
                <div
                  className="dark:prose-invert description_box"
                  style={{ overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              )}
              <img src={`https://platform.antdiy.vip/static/image/${LText.deliveryProcess}`} />
              {/* <div className="grid gap-4 py-4">
                {descriptionHtml && (
                  <ProductDetail
                    title="Product Details"
                    content={descriptionHtml}
                  />
                )}
                {shippingPolicy?.body && (
                  <ProductDetail
                    title="Shipping"
                    content={getExcerpt(shippingPolicy.body)}
                    learnMore={`/policies/${shippingPolicy.handle}`}
                  />
                )}
                {refundPolicy?.body && (
                  <ProductDetail
                    title="Returns"
                    content={getExcerpt(refundPolicy.body)}
                    learnMore={`/policies/${refundPolicy.handle}`}
                  />
                )}
              </div> */}
            </section>
          </div>
        </div>
        <div className='comment_product'>
          <div className='comment_box'>
            <div className='comment_box_title'>{LText.comTit}</div>
            {commentHeader ? <div
              className="dark:prose-invert comment_box_content"
              dangerouslySetInnerHTML={{ __html: commentHeader }}
              onClick={(e) => { clickComment(e, setFiltRat, product_id, sortBy, setComment) }}
            /> : <div className="jdgm-rev-widg__header comment_box_content">
              {/* <div className="jdgm-rev-widg__summary">
                  <div className="jdgm-rev-widg__summary-text">{LText.noOpinion}</div>
                </div> */}
              <div className="jdgm-rev-widg__sort-wrapper" onClick={(e) => { clickComment(e, setFiltRat, product_id, sortBy, setComment) }}>
                <button className="add_comment">{LText.writeReview}</button>
              </div>
            </div>
            }
            <div className='jq_slow'>
              <div className='write_review'>
                <div className='write_review_title'>{LText.addComment}</div>
                <div className='write_review_li'>
                  <div className="write_review_name">{LText.rating}</div>
                  <div className='star_score'>
                    {
                      ['', '', '', '', ''].map((item, index) => {
                        return <div className='star_li'
                          key={index}
                          onMouseEnter={() => { setHhoverStar(index + 1) }}
                          onMouseLeave={() => { setHhoverStar(starScore) }}
                          onClick={() => { setStarScore(index + 1) }}
                        ><img src={`https://platform.antdiy.vip/static/image/${hoverStar > index ? 'hydrogen_icon_star_quan' : 'hydrogen_icon_star_kongg'}.svg`} /> </div>
                      })
                    }
                  </div>
                </div>
                <div className='write_review_li'>
                  <div className="write_review_name">{LText.reviewTitle}</div>
                  <input type="text" placeholder={LText.reviewTiPle} value={reviewTitle} onChange={(e) => { setReviewTitle(e.target.value) }} />
                </div>
                <div className='write_review_li'>
                  <div className="write_review_name">{LText.review}</div>
                  <textarea type="text" placeholder={LText.reviewPle} value={review} onChange={(e) => { setErrorText({ type: 1, content: e.target.value ? '' : LText.error }), setReview(e.target.value) }} />
                  {
                    errorText.type === 1 && errorText.content ? <div className='error_text'>{errorText.content}</div> : null
                  }
                </div>
                <div className='write_review_li'>
                  <div className="write_review_name">{LText.picture}</div>
                  <div className="write_review_img">
                    <div className='write_review_cont'>
                      <span className='write_review_cont_icon'>
                        <img src="https://platform.antdiy.vip/static/image/hydrogen_icon_upload.svg" />
                      </span>
                      <input type="file" name="media" multiple accept="image/gif,image/jpeg,image/jpg,image/png,image/webp" onChange={(e) => { changeImg(e, imgList, setImgList, imgKey, setImgKey) }} />
                    </div>
                    {
                      imgList.map((item, index) => {
                        return <div className='write_review_cont' key={index}>
                          <img className='delete' onClick={() => { imgList.splice(index, 1); setImgList([...imgList]) }} src="https://platform.antdiy.vip/static/image/hydrogen_icon_delete.svg" />
                          <img src={item.url} alt="" />
                        </div>
                      })
                    }
                  </div>
                </div>
                <div className='write_review_li'>
                  <div className="write_review_name">
                    <span>{LText.selectName}</span>
                    <select className="write_review_select" value={reviewer_name_format} onChange={(e) => { setFrmat(e.target.value) }} >
                      <option value="">John Smith</option>
                      <option value="last_initial">John S.</option>
                      <option value="all_initials">J.S.</option>
                      <option value="anonymous">{LText.unknown}</option>
                    </select>
                    <span> )</span>
                  </div>
                  <input type="text" placeholder={LText.namePle} value={name} onChange={(e) => { setErrorText({ type: 2, content: e.target.value ? '' : LText.error }), setName(e.target.value) }} />
                  {
                    errorText.type === 2 && errorText.content ? <div className='error_text'>{errorText.content}</div> : null
                  }
                </div>
                <div className='write_review_li'>
                  <div className="write_review_name">{LText.emailN}</div>
                  <input name="email" type="text" placeholder={LText.emailPle} value={email} onChange={(e) => { setErrorText({ type: 3, content: e.target.value ? '' : LText.error }), setEmail(e.target.value) }} />
                  {
                    errorText.type === 3 && errorText.content ? <div className='error_text'>{errorText.content}</div> : null
                  }
                </div>
                <div className="write_review_btn">
                  <button className='cancel' onClick={() => { WriteReview() }}>{LText.cancelRe}</button>
                  <button className='submit' onClick={() => {
                    submitReview(
                      {
                        url: getShopAddress(),
                        shop_domain: getShopAddress(),
                        platform: 'shopify',
                        reviewer_name_format: reviewer_name_format,
                        name: name,
                        email: email,
                        rating: starScore,
                        title: reviewTitle,
                        body: review,
                        id: product_id,
                      },
                      imgList,
                      setErrorText,
                      setIsSuccess
                    )
                  }}>{LText.submitRe}</button>
                </div>
              </div>
            </div>
            {
              isSuccess ? <div className='review_submit'>
                <div className="review_submit_tit">{LText.subReview}</div>
                <div className="review_submit_content">{LText.subComtent}</div>
              </div> : null
            }
          </div>
          {commentHtml && (
            <div className='comment_box'>
              {/* <div className='comment_screen'>
                <select value={sortBy} onChange={(e) => { setScreen(e.target.value, product_id, setComment, setSortBy, filtRat) }} >
                  <option value="created_at">{LText.screenCreate}</option>
                  <option value="desc">{LText.screenDesc}</option>
                  <option value="asc">{LText.screenAsc}</option>
                  <option value="with_pictures">{LText.screenWith}</option>
                  <option value="pictures_first">{LText.screenPic}</option>
                  <option value="videos_first">{LText.screenVideo}</option>
                  <option value="most_helpful">{LText.screenMost}</option>
                </select>
              </div> */}
              <div
                className="dark:prose-invert comment_list"
                onClick={(e) => { changePage(e, product_id, setComment, sortBy, filtRat) }}
                dangerouslySetInnerHTML={{ __html: commentHtml }}
              />
            </div>
          )}
        </div>
        {selectedVariant && (
          // <div className="grid items-stretch gap-4 sticky_bottom">
          //   <button className={`inline-block rounded font-medium text-center w-full ${isOutOfStock ? 'border border-primary/10 bg-contrast text-primary' : 'bg-primary text-contrast'}`}>
          //     {isOutOfStock ? (
          //       <Text className='py-3 px-6'>{LText.sold}</Text>//卖完了
          //     ) : (
          //       <Text //立即购买
          //         as="span"
          //         className="flex items-center justify-center gap-2 py-3 px-6"
          //         style={{ maxWidth: 'initial' }}
          //         onClick={() => { goSettleAccounts() }}
          //       >
          //         <span>{LText.buy}</span>
          //       </Text>
          //     )}
          //   </button>
          // </div>
          <div className='settle_accounts_foot'>
            <div>
              <div className='buy_btn_price'>
                <span className='btn_price btn_price_new'>
                  <i>{currency} </i>{parseFloat(selectedVariant?.price?.amount)}
                </span>
                {isOnSale && (
                  <span className='btn_price btn_price_old'>
                    <i>{currency} </i>{parseFloat(selectedVariant?.compareAtPrice?.amount)}
                  </span>
                )}
              </div>
              <div className='submit_btn'>
                <button className='inline-block rounded font-medium text-center w-full bg-primary text-contrast paddingT5'>
                  <Text //立即购买
                    as="span"
                    className="flex items-center justify-center gap-2 py-3 px-6 buy_text"
                    style={{ maxWidth: 'initial' }}
                    onClick={() => { goSettleAccounts() }}
                  >
                    <span>{LText.buy}</span>
                  </Text>
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
function saveXgood(list) {
  return
  let pixelId = ''
  if (window.fbq.getState && window.fbq.getState()) {
    pixelId = window.fbq.getState()?.pixels[0]?.id
  }
  if (!pixelId) return
  const price = productData?.variants?.nodes[0]?.price?.amount || '';
  let params = {
    userId: localStorage.getItem("uid") || "",
    events: [],
  };
  list.forEach((item) => {
    params.events.push({
      eventName: item,
      eventTime: Math.floor(Date.now() / 1000) + "",
      actionSource: "website",
      eventSourceUrl: location.href,
      userData: {
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
      },
      customData: {
        currency: currencyCode === 'zł' ? 'POL' : currencyCode,
        value: price,
      },
    });
  });
  fetch.post(`https://cod.xgoodspic.com/product-manage/event/${pixelId}`, params).then(() => { });
}

function sendGtag(data) {
  let sym = location.search.indexOf('?') > -1 ? "&" : "?"
  let url = location.search.indexOf('source') > -1 ? location.href : location.href + sym + window.localStorage.getItem("sourceObj")
  let obj = {
    time_stamp: new Date().getTime() + "",
    cl: currencyCode || "",
    procudt_id: productData.id || "",
    user_ID: localStorage.getItem("uid") || "",
    UA: navigator.userAgent,
    url: url,
  };
  const params = { ...data, ...obj };
  fetch.get(`https://www.xgoodspic.com/`, { params }).then(() => { });
}

function goSettleAccounts() {
  sendGtag({ event_name: "AddCart" });
  saveXgood(["AddToCart", "SubscribedButtonClick", "InitiateCheckout"]);
  // const firstVariant = productData.variants.nodes[0];
  // const selectedVariant = productData.selectedVariant ?? firstVariant;
  // if (currencyCode) {
  //   selectedVariant.price.currencyCode = currencyCode
  // }
  // localStorage.removeItem('selectedVariant')
  // localStorage.setItem('selectedVariant', JSON.stringify(selectedVariant))
  localStorage.removeItem('productVariant')
  localStorage.setItem('productVariant', JSON.stringify(productData))
  sendFbq('AddToCart')

  let source_name = window.localStorage.getItem('sourceName')
  if (source_name) {
    let params = {
      source: source_name,
      url: window.location.href,
    }
    fetch.post(`${getDomain()}/account-service/media_orders/cart_creat/pass`, params).then(() => {
      window.open(`/settleAccounts?id=${productData.id}`, '_self')
    })
  } else {
    window.open(`/settleAccounts?id=${productData.id}`, '_self')
  }
}
function getCookie(name) {
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie.indexOf(name + '=') === 0) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

// FBQ
function sendFbq(a, b, c) {
  if ("function" == typeof window.fbq) {
    window.fbq("track", a, b, c)
  }
}

export function ProductForm() {
  const { product, analytics } = useLoaderData();

  const [currentSearchParams] = useSearchParams();
  const transition = useTransition();

  /**
   * We update `searchParams` with in-flight request data from `transition` (if available)
   * to create an optimistic UI, e.g. check the product option before the
   * request has completed.
   */
  const searchParams = useMemo(() => {
    return transition.location
      ? new URLSearchParams(transition.location.search)
      : currentSearchParams;
  }, [currentSearchParams, transition]);

  const firstVariant = product.variants.nodes[0];

  /**
   * We're making an explicit choice here to display the product options
   * UI with a default variant, rather than wait for the user to select
   * options first. Developers are welcome to opt-out of this behavior.
   * By default, the first variant's options are used.
   */
  const searchParamsWithDefaults = useMemo(() => {
    const clonedParams = new URLSearchParams(searchParams);

    for (const { name, value } of firstVariant.selectedOptions) {
      if (!searchParams.has(name)) {
        clonedParams.set(name, value);
      }
    }

    return clonedParams;
  }, [searchParams, firstVariant.selectedOptions]);

  /**
   * Likewise, we're defaulting to the first variant for purposes
   * of add to cart if there is none returned from the loader.
   * A developer can opt out of this, too.
   */
  const selectedVariant = product.selectedVariant ?? firstVariant;
  const isOutOfStock = !selectedVariant?.availableForSale;

  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount;

  const productAnalytics = {
    ...analytics.products[0],
    quantity: 1,
  };
  const [currency, setCurrency] = useState('');
  useEffect(() => {
    if (currencyCode) {
      setCurrency(currencyCode)
    } else {
      setCurrency(selectedVariant?.price?.currencyCode)
    }
  }, []);

  return (
    <div className="grid pricex_box">
      <div className="grid gap-4">
        <Text
          as="span"
          className="flex items-baseline"
        >
          {/* <Money
            withoutTrailingZeros
            data={selectedVariant?.price}
            as="span"
            className='fontS'
          /> */}
          <span className='current_price current_price_new'>
            <i>{currency} </i>{parseFloat(selectedVariant?.price?.amount)}
          </span>
          {isOnSale && (
            // <Money
            //   withoutTrailingZeros
            //   data={selectedVariant?.compareAtPrice}
            //   as="span"
            //   className="opacity-50 strike"
            // />
            <span className='current_price current_price_old'>
              <i>{currency} </i>{parseFloat(selectedVariant?.compareAtPrice?.amount)}
            </span>
          )}
        </Text>
        {/* <img className="variant_img" src={selectedVariant?.image?.url} /> */}
        {/* <ProductOptions
          options={product.options}
          searchParamsWithDefaults={searchParamsWithDefaults}
        /> */}
        {/* {selectedVariant && (
          <div className="grid items-stretch gap-4">
            <button className={`inline-block rounded font-medium text-center w-full ${isOutOfStock ? 'border border-primary/10 bg-contrast text-primary' : 'bg-primary text-contrast'}`}>
              {isOutOfStock ? (
                <Text className='py-3 px-6'>تم البيع</Text>//卖完了
              ) : (
                <Text
                  as="span"
                  className="flex items-center justify-center gap-2 py-3 px-6"
                  onClick={() => { goSettleAccounts() }}
                >
                  <span>اشتر الآن</span>
                </Text>
              )}
            </button>

            <AddToCartButton
              lines={[
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]}
              variant={isOutOfStock ? 'secondary' : 'primary'}
              data-test="add-to-cart"
              analytics={{
                products: [productAnalytics],
                totalValue: parseFloat(productAnalytics.price),
              }}
            >
              {isOutOfStock ? (
                <Text>تم البيع</Text>//卖完了
              ) : (
                <Text
                  as="span"
                  className="flex items-center justify-center gap-2" //加入购物车
                >
                  <span>أضف إلى السلة</span> <span>·</span>{' '}
                </Text>
              )}
            </AddToCartButton>
            {!isOutOfStock && (
              <ShopPayButton variantIds={[selectedVariant?.id]} />
            )}
          </div>
        )} */}
      </div>
      <div className='service'>
        {
          LText.policyList && LText.policyList.length > 0 ? LText.policyList.map((item, index) => {
            return <div className='service_li' key={index}>
              <img className='service_icon' src="https://platform.antdiy.vip/static/image/cod_success.svg" alt="" />
              {
                index === 0 ? <span>{item}<img src="https://platform.antdiy.vip/static/image/CErenzheng.svg" alt="" /></span> : <span>{item}</span>
              }
            </div>
          }) : null
        }
      </div>
      <div className='division_box'>{LText.divisionText}</div>
    </div>
  );
}

function ProductOptions({ options, searchParamsWithDefaults }) {
  const checkOpt = options.map(i => { return i.name })
  const closeRef = useRef(null);
  return (
    <>
      {options
        .filter((option) => option.values.length > 1)
        .map((option) => (
          <div
            key={option.name}
            className="flex flex-col flex-wrap gap-y-2 last:mb-0"
          >
            <Heading as="legend" size="lead" className="min-w-[4rem]">
              {option.name}
            </Heading>
            <div className="flex flex-wrap items-baseline gap-2">
              {/**
               * First, we render a bunch of <Link> elements for each option value.
               * When the user clicks one of these buttons, it will hit the loader
               * to get the new data.
               *
               * If there are more than 7 values, we render a dropdown.
               * Otherwise, we just render plain links.
               */}
              {option.values.length > 7 ? (
                <div className="relative w-full">
                  <Listbox>
                    {({ open }) => (
                      <>
                        <Listbox.Button
                          ref={closeRef}
                          className={clsx(
                            'flex items-center justify-between w-full py-3 px-4 border border-primary',
                            open
                              ? 'rounded-b md:rounded-t md:rounded-b-none'
                              : 'rounded',
                          )}
                        >
                          <span>
                            {searchParamsWithDefaults.get(option.name)}
                          </span>
                          <IconCaret direction={open ? 'up' : 'down'} />
                        </Listbox.Button>
                        <Listbox.Options
                          className={clsx(
                            'border-primary bg-contrast absolute bottom-12 z-30 grid h-48 w-full overflow-y-scroll rounded-t border px-2 py-2 transition-[max-height] duration-150 sm:bottom-auto md:rounded-b md:rounded-t-none md:border-t-0 md:border-b',
                            open ? 'max-h-48' : 'max-h-0',
                          )}
                        >
                          {option.values.map((value) => (
                            <Listbox.Option
                              key={`option-${option.name}-${value}`}
                              value={value}
                            >
                              {({ active }) => (
                                <ProductOptionLink
                                  optionName={option.name}
                                  optionValue={value}
                                  className={clsx(
                                    'text-primary w-full p-2 transition rounded flex justify-start items-center text-left cursor-pointer',
                                    active && 'bg-primary/10',
                                  )}
                                  searchParams={searchParamsWithDefaults}
                                  checkOpt={checkOpt}
                                  onClick={() => {
                                    if (!closeRef?.current) return;
                                    closeRef.current.click();
                                  }}
                                >
                                  {value}
                                  {searchParamsWithDefaults.get(option.name) ===
                                    value && (
                                      <span className="ml-2">
                                        <IconCheck />
                                      </span>
                                    )}
                                </ProductOptionLink>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </>
                    )}
                  </Listbox>
                </div>
              ) : (
                <>
                  {option.values.map((value) => {
                    const checked =
                      searchParamsWithDefaults.get(option.name) === value;
                    const id = `option-${option.name}-${value}`;

                    return (
                      <Text key={id} style={{ marginBottom: '10px' }}>
                        <ProductOptionLink
                          optionName={option.name}
                          optionValue={value}
                          searchParams={searchParamsWithDefaults}
                          checkOpt={checkOpt}
                          className={clsx(
                            'leading-none py-1 border-b-[1.5px] cursor-pointer transition-all duration-200 bord_sku',
                            checked ? 'active_sku' : '',
                          )}
                        />
                      </Text>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ))}
    </>
  );
}

function funcUrlDel(name) {
  var loca = window.location;
  var baseUrl = loca.pathname + "?";
  var query = loca.search.substr(1);
  if (query.indexOf(name) > -1) {
    var obj = {}
    var arr = query.split("&");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split("=");
      obj[arr[i][0]] = arr[i][1];
    };
    delete obj[name];
    var url = JSON.stringify(obj).replace(/[\"\{\}]/g, "").replace(/\:/g, "=").replace(/\,/g, "&").replace(/\?/g, "=");
    return url
  } else {
    return window.location.pathname;
  };
}

function getVariantId(query, checkOpt) {
  if (query) {
    // let aaa = Object.fromEntries(new URLSearchParams(query).entries())
    // console.log(JSON.stringify(aaa).replace(/[\"\{\}]/g, "").replace(/\:/g, "=").replace(/\,/g, "&").replace(/\?/g, "="))
    query = query.replace(/\+/g, ' ')
    var obj = {}
    var stringurl = []
    var arr = query.split("&");
    for (var i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split("=");
      obj[arr[i][0]] = arr[i][1];
      if (checkOpt.join(',').indexOf(arr[i][0]) > -1) {
        stringurl.push(new URLSearchParams(query).get(arr[i][0]))
      }
    };
    delete obj['variant'];
    if (stringurl && stringurl.length > 0 && productVariants && productVariants.length > 0) {
      let variantId = productVariants.filter(i => i.title === stringurl.join(' / '))[0]
      if (variantId) {
        obj.variant = setSplit(variantId.id)
        return setSplit(variantId.id)
        // var url = JSON.stringify(obj).replace(/[\"\{\}]/g, "").replace(/\:/g, "=").replace(/\,/g, "&").replace(/\?/g, "=");
        // return url
      }
    }
  }
}

function ProductOptionLink({
  optionName,
  optionValue,
  searchParams,
  checkOpt,
  children,
  ...props
}) {
  const { pathname } = useLocation();
  const isLangPathname = /\/[a-zA-Z]{2}-[a-zA-Z]{2}\//g.test(pathname);
  // fixes internalized pathname
  const path = isLangPathname
    ? `/${pathname.split('/').slice(2).join('/')}`
    : pathname;

  const clonedSearchParams = new URLSearchParams(searchParams);
  clonedSearchParams.set(optionName, optionValue);
  if (checkOpt && checkOpt.length > 0) {
    let newparam = getVariantId(decodeURIComponent(clonedSearchParams.toString()), checkOpt)
    if (newparam) {
      clonedSearchParams.set('variant', newparam);
    }
  }
  let splicParam = clonedSearchParams.toString()

  return (
    <Link
      {...props}
      preventScrollReset
      prefetch="intent"
      replace
      to={`${path}?${splicParam}`}
    >
      {children ?? optionValue}
    </Link>
  );
}


const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariantFragment on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_QUERY = `#graphql
  ${MEDIA_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      vendor
      handle
      descriptionHtml
      description
      options {
        name
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        ...ProductVariantFragment
      }
      media(first: 250) {
        nodes {
          ...Media
        }
      }
      variants(first: 250) {
        nodes {
          ...ProductVariantFragment
        }
      }
      seo {
        description
        title
      }
    }
    shop {
      name
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
`;

async function getRecommendedProducts(storefront, productId) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: { productId, count: 12 },
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = products.recommended
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts
    .map((item) => item.id)
    .indexOf(productId);

  mergedProducts.splice(originalProduct, 1);

  return mergedProducts;
}

function setSplit(data) {
  if (data.indexOf('/') > -1) {
    let arr = data.split('/')
    return arr[arr.length - 1]
  } else {
    return data
  }
}
