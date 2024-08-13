import { PageHeader, Text } from './Text';
import { useEffect, useState } from 'react';
import { getShopAddress, getLanguage } from '~/lib/P_Variable';
const LText = getLanguage()

export function NotFound({ type = 'page' }) {
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    var canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.localStorage !== "undefined");
    if (canUseDOM) {
      if (LText.type === 'RON') {
        window.open('https://' + getShopAddress(), '_self')
      } else {
        setHeading(LText.notFoundTit)
        setDescription(LText.notFoundText)
      }
    }
  }, []);

  return (
    <>
      <PageHeader heading={heading}>
        <Text width="narrow" as="p">
          {description}
        </Text>
      </PageHeader>
    </>
  );
}
