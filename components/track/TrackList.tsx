import { } from 'next-auth/client';
import React, { FC, useCallback, useEffect, useMemo } from "react";
import { AutoSizer, InfiniteLoader, List as VirtualList } from 'react-virtualized';
import { useSWRInfinite } from 'swr';
import List from '../../interfaces/List';
import { SavedTrack } from "../../interfaces/Track";
import { ITag } from '../../models/Tag';
import { Options } from '../hooks/useMenu';
import useSelection from "../hooks/useSelection";
import { request } from '../hooks/useSubmit';
import TrackLine from "./TrackLine";

const PER_SCROLL = 10

const TrackList: FC<{
   tags: ITag[]
   endpoint: string
   initial?: SavedTrack[]
}> = ({ tags, endpoint, initial = [] }) => {

   const { data, setSize, revalidate } = useSWRInfinite<List<SavedTrack>>(
      (_, previous) => {
         if (previous && !previous.next) return null
         const offset = previous ? (previous.offset + previous.items.length) : 0
         return `${endpoint}?offset=${offset + initial.length}&limit=${PER_SCROLL}`
      }
   )

   useEffect(() => {
      revalidate()
   }, [endpoint, revalidate])

   const loadNext = useCallback(() => setSize(i => i + 1), [setSize])

   const tracks = useMemo(() => [...initial, ...data?.map(it => it.items).flat() ?? []], [data, initial])
   const hasNext = useMemo(() => !!data?.[data.length - 1].next, [data])
   const isLoaded = useCallback(({ index }) => !!tracks[index], [tracks])

   const { isSelected, events } = useSelection(tracks, t => t.track.id, selected => ({

      title: `${selected.length} tracks`,

      'Add Tag': tags.reduce((o, tag) => ({
         ...o, [tag.name]: () => request.post(`/tag/${tag.id}/track`, { tracks: selected }).then(revalidate)
      }), {} as Options),

      'Remove Tag': tags.reduce((o, tag) => ({
         ...o, [tag.name]: () => request.delete(`/tag/${tag.id}/track`, { data: { tracks: selected } }).then(revalidate)
      }), {} as Options),

   }))

   const total = data?.[0]?.total ?? 0

   return (
      <AutoSizer>
         {({ height, width }) =>
            <InfiniteLoader
               rowCount={total}
               minimumBatchSize={PER_SCROLL}
               loadMoreRows={loadNext}
               isRowLoaded={isLoaded}>
               {({ onRowsRendered, registerChild }) =>

                  <VirtualList
                     rowCount={total}
                     onRowsRendered={onRowsRendered}
                     ref={registerChild}
                     height={height}
                     width={width}
                     rowHeight={140}
                     rowRenderer={({ key, index, style }) => {
                        const track = tracks[index]
                        return track && <TrackLine
                           style={style}
                           key={key}
                           {...track.track}
                           selected={isSelected(track)}
                           {...events(track)}
                        />
                     }}>
                  </VirtualList>

               }
            </InfiniteLoader>
         }
      </AutoSizer>
   )
}

export default TrackList