// 详情页左侧
import { ATTR_LOADING_EAGER } from '~/lib/const';
import { useEffect, useState } from 'react';
import Swiper from 'swiper'

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */

export function ProductGallery({ media, product, className }) {
  if (!media.length) {
    return null;
  }
  const [image_url, setImgUrl] = useState('');
  const [preview_img, setPreviewImg] = useState(false);
  useEffect(() => {
    if (product.selectedVariant && product.selectedVariant.image) {
      setImgUrl(product.selectedVariant.image)
    } else {
      setImgUrl(media && media.length > 0 ? media[0].image : '')
    }
    var swiper = new Swiper('.swiper-container', {
      loop: true,
      autoplay: {
        disableOnInteraction: false,
        delay: 3000,
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'fraction',
      },
    });
  }, [product.selectedVariant])


  return (
    <div className={`sticky_img`}>
      <div className="swiper-container" id='swiper'>
        <div className="swiper-wrapper">
          {media.map((med, i) => {
            const data = {
              ...med,
              image: {
                ...med.image,
                altText: med.alt || 'Product image',
              },
            };
            return (
              <div
                className="swiper-slide"
                key={med.id || med.image.id}
              >
                {med.image && (
                  <img
                    src={data.image.url}
                    alt={data.image.altText}
                    className="w-full h-full aspect-square fadeIn object-cover"
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="swiper-pagination"></div>
      </div>
      {/* <img className='advertisement' src='https://platform.antdiy.vip/static/image/hultoo_guanggao.png' /> */}
      {/* 占位 */}
    </div>
  );
  // return (
  //   <div className={`sticky_img`}>
  //     {
  //       preview_img ? <div className='fixed_img' onClick={() => { setPreviewImg(false) }}>
  //         <img src={image_url.url} />
  //       </div> : null
  //     }
  //     <img
  //       src={image_url.url}
  //       className="master_map w-full h-full aspect-square fadeIn object-cover"
  //       onClick={() => { setPreviewImg(true) }}
  //       style={{ cursor: 'pointer' }}
  //     />
  //     <div className='padding16'>
  //       <div
  //         className={`swimlane md:grid-flow-row hiddenScroll md:p-0 md:overflow-x-auto md:grid-cols-2 ${className}`}
  //       >
  //         {media.map((med, i) => {
  //           let mediaProps = {};
  //           const isFirst = i === 0;
  //           const isFourth = i === 3;
  //           const isFullWidth = i % 3 === 0;

  //           const data = {
  //             ...med,
  //             image: {
  //               // @ts-ignore
  //               ...med.image,
  //               altText: med.alt || 'Product image',
  //             },
  //           };

  //           switch (med.mediaContentType) {
  //             case 'IMAGE':
  //               mediaProps = {
  //                 width: 800,
  //                 widths: [400, 800, 1200, 1600, 2000, 2400],
  //               };
  //               break;
  //             case 'VIDEO':
  //               mediaProps = {
  //                 width: '100%',
  //                 autoPlay: true,
  //                 controls: false,
  //                 muted: true,
  //                 loop: true,
  //                 preload: 'auto',
  //               };
  //               break;
  //             case 'EXTERNAL_VIDEO':
  //               mediaProps = { width: '100%' };
  //               break;
  //             case 'MODEL_3D':
  //               mediaProps = {
  //                 width: '100%',
  //                 interactionPromptThreshold: '0',
  //                 ar: true,
  //                 loading: ATTR_LOADING_EAGER,
  //                 disableZoom: true,
  //               };
  //               break;
  //           }

  //           if (i === 0 && med.mediaContentType === 'IMAGE') {
  //             mediaProps.loading = ATTR_LOADING_EAGER;
  //           }

  //           const style = [
  //             isFullWidth ? 'md:col-span-2' : 'md:col-span-1',
  //             isFirst || isFourth ? '' : 'md:aspect-[4/5]',
  //             'aspect-square snap-center card-image bg-white dark:bg-contrast/10 w-mobileGallery md:w-full',
  //           ].join(' ');

  //           return (
  //             <div
  //               className={`${image_url.url == data.image.url ? 'active' : ''} list_img ${style}`}
  //               // @ts-ignore
  //               // MasterImg({image_url:med.image})
  //               key={med.id || med.image.id}
  //               onClick={() => { setImgUrl(med.image) }}
  //             >
  //               {/* TODO: Replace with MediaFile when it's available */}
  //               {med.image && (
  //                 <img
  //                   src={data.image.url}
  //                   alt={data.image.altText}
  //                   className="w-full h-full aspect-square fadeIn object-cover"
  //                 />
  //               )}
  //               {/* <MediaFile
  //                   tabIndex="0"
  //                   className={`w-full h-full aspect-square fadeIn object-cover`}
  //                   data={data}
  //                   sizes={
  //                     isFullWidth
  //                       ? '(min-width: 64em) 60vw, (min-width: 48em) 50vw, 90vw'
  //                       : '(min-width: 64em) 30vw, (min-width: 48em) 25vw, 90vw'
  //                   }
  //                   // @ts-ignore
  //                   options={{
  //                     crop: 'center',
  //                     scale: 2,
  //                   }}
  //                   {...mediaProps}
  //                 /> */}
  //             </div>
  //           );
  //         })}

  //         <div className='list_img empty_img'></div>
  //         <div className='list_img empty_img'></div>
  //         <div className='list_img empty_img'></div>
  //         <div className='list_img empty_img'></div>
  //         <div className='list_img empty_img'></div>
  //         <div className='list_img empty_img'></div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
