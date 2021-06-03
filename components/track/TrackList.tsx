import { } from 'next-auth/client';
import React, { FC } from "react";
import { SavedTrack } from "../../interfaces/Track";
import { ITag } from '../../models/Tag';
import { Options } from '../hooks/useMenu';
import useSelection from "../hooks/useSelection";
import { request } from '../hooks/useSubmit';
import TrackLine from "./TrackLine";

const TrackList: FC<{
   tracks: SavedTrack[]
   tags: ITag[]
}> = ({ tracks, tags }) => {

   const { isSelected, events } = useSelection(tracks, t => t.track.id, selected => ({

      title: `${selected.length} tracks`,

      'Add Tag': tags.reduce((o, tag) => ({
         ...o, [tag.name]: () => request.post(`/tag/${tag.id}/track`, { tracks: selected })
      }), {} as Options),

      'Remove Tag': tags.reduce((o, tag) => ({
         ...o, [tag.name]: () => request.delete(`/tag/${tag.id}/track`, { data: { tracks: selected } })
      }), {} as Options),

   }))

   return <ul>
      {tracks.map(saved =>
         <TrackLine
            key={saved.track.id}
            {...saved.track}
            selected={isSelected(saved)}
            {...events(saved)}
         />
      )}
   </ul>

}

export default TrackList