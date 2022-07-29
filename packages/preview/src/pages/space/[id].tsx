import * as React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import useSwr from 'swr';
import { basePath } from '../../../next.config';

import { mapElements } from '@lightshow/core/dist/helpers';
import { Player } from '../../components/Player';
import { SpacePicker } from '../../components/SpacePicker';

import type { Track } from '@lightshow/core';
import { scaleElements } from '../../helpers/scaleElements';
// @ts-ignore
const Space = dynamic(() => import('../../components/Space'), {
  ssr: false,
});

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PreviewSpace() {
  const router = useRouter();

  const spaceId = router.query.id as string;
  const editable = !!router.query.editable;

  // Fetch space
  const { data: spaces = [], error: fetchSpaceError } = useSwr(
    `${basePath}/api/spaces`,
    fetcher
  );

  // Fetch playlist tracks
  const { data: tracks = [], error } = useSwr('/api/playlist', fetcher);

  const [activeSpace, setActiveSpace] = React.useState<any | null>(null);
  const [controlsVisible, setControlsVisible] = React.useState(false);

  const [activeTrack, setActiveTrack] = React.useState<
    (Track & { paused: boolean }) | null
  >(null);

  React.useEffect(() => {
    const spaceMatch = spaces?.find((s) => s.id === spaceId);
    if (spaceMatch) {
      if (!spaceMatch.elements) {
        spaceMatch.elements = mapElements(spaceMatch);
      }

      scaleElements(spaceMatch, window.innerWidth, window.innerHeight);
      setActiveSpace(spaceMatch);
    }
  }, [spaceId, spaces]);

  const handlePlayTrack = (track, action?: string) => {
    fetch(`/api/console/track/load?track=${track.name}`).then(() => {
      setControlsVisible(false);
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
        if (!space.elements) {
          space.elements = mapElements(space);
        }
        scaleElements(space, window.innerWidth, window.innerHeight);
        setControlsVisible(false);
        setActiveSpace(space);
      });
  };

  return (
    <>
      {activeSpace && <Space editable={editable} space={activeSpace} />}
      <div
        onDoubleClick={() => setControlsVisible(!controlsVisible)}
        style={{
          cursor: 'pointer',
          position: 'absolute',
          height: 20,
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <Player
          visible={controlsVisible}
          tracks={tracks}
          activeTrack={activeTrack}
          onPlayClick={handlePlayTrack}
        />
        <SpacePicker
          visible={controlsVisible}
          onLoadSpace={handleLoadSpace}
          activeSpace={activeSpace}
          spaces={spaces}
        />
      </div>
    </>
  );
}
