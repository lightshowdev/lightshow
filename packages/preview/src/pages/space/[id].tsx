import * as React from 'react';
import { useRouter } from 'next/router';
import useSwr from 'swr';
import { basePath } from '../../../next.config';
import { useIO, useMidi } from '../../hooks';

import { Space } from '../../components/Space';
import { mapElements } from '../../helpers';
import { Player } from '../../components/Player';

import type { Track } from '@lightshow/core';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PreviewSpace() {
  const router = useRouter();

  const spaceId = router.query.id as string;

  // Fetch space
  const { data: map = {}, error: fetchSpaceError } = useSwr(
    spaceId ? `${basePath}/api/map/${spaceId}` : null,
    fetcher
  );

  // Fetch playlist tracks
  const { data: tracks = [], error } = useSwr('/api/playlist', fetcher);

  const [activeTrack, setActiveTrack] = React.useState<
    (Track & { paused: boolean }) | null
  >(null);

  const elements = mapElements(map);

  useMidi(router.query.events === 'midi', elements);
  useIO(router.query.events === 'io', elements);

  if (!spaceId) {
    return null;
  }

  const handlePlayTrack = (track, action?: string) => {
    fetch(`/api/console/track/load?track=${track.name}`).then(() => {
      setActiveTrack(track);
    });
  };

  return (
    <>
      <Player
        tracks={tracks}
        activeTrack={activeTrack}
        onPlayClick={handlePlayTrack}
      />
      <Space id={spaceId} elements={elements} />
    </>
  );
}
