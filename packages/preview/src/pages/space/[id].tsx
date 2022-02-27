import * as React from 'react';
import { useRouter } from 'next/router';
import useSwr from 'swr';
import { basePath } from '../../../next.config';
import { useIO, useMidi } from '../../hooks';

import { Space } from '../../components/Space';
import { mapElements } from '../../helpers';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PreviewYard() {
  const router = useRouter();

  const spaceId = router.query.id as string;

  const { data: map = {}, error } = useSwr(
    spaceId ? `${basePath}/api/map/${spaceId}` : null,
    fetcher
  );

  const elements = mapElements(map);

  useMidi(router.query.events === 'midi', elements);
  useIO(router.query.events === 'io', elements);

  if (!spaceId) {
    return null;
  }

  return <Space id={spaceId} elements={elements} />;
}
