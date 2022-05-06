import * as React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import useSwr from 'swr';
import { basePath } from '../../../next.config';
import { useIO, useMidi } from '../../hooks';

import { Space } from '../../components/Space';

import { mapElements } from '../../helpers';
import { Player } from '../../components/Player';
import { SpacePicker } from '../../components/SpacePicker';

import type { Track } from '@lightshow/core';

// @ts-ignore
const CanvasSpace = dynamic(() => import('../../components/CanvasSpace'), {
  ssr: false,
});

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PreviewSpace() {
  const router = useRouter();

  const spaceId = router.query.id as string;

  // Fetch space
  const { data: spaces = [], error: fetchSpaceError } = useSwr(
    `${basePath}/api/spaces`,
    fetcher
  );

  // Fetch playlist tracks
  const { data: tracks = [], error } = useSwr('/api/playlist', fetcher);

  const [activeSpace, setActiveSpace] = React.useState<any | null>(null);

  const [activeTrack, setActiveTrack] = React.useState<
    (Track & { paused: boolean }) | null
  >(null);

  useMidi(router.query.events === 'midi', activeSpace);
  useIO(router.query.events === 'io', activeSpace);

  React.useEffect(() => {
    const spaceMatch = spaces?.find((s) => s.id === spaceId);
    if (spaceMatch) {
      spaceMatch.elements = mapElements(spaceMatch);
      setActiveSpace(spaceMatch);
    }
  }, [spaceId, spaces]);

  const handlePlayTrack = (track, action?: string) => {
    fetch(`/api/console/track/load?track=${track.name}`).then(() => {
      setActiveTrack(track);
    });
  };

  const handleLoadSpace = (space) => {
    fetch(`${basePath}/api/map/${space.id}`)
      .then((response) => {
        return response.json();
      })
      .then((space) => {
        // @ts-ignore
        space.elements = mapElements(space);
        setActiveSpace(space);
      });
  };

  return (
    <>
      <Player
        tracks={tracks}
        activeTrack={activeTrack}
        onPlayClick={handlePlayTrack}
      />
      <SpacePicker
        onLoadSpace={handleLoadSpace}
        activeSpace={activeSpace}
        spaces={spaces}
      />
      <CanvasSpace id={activeSpace?.id} elements={activeSpace?.elements} />
    </>
  );
}
