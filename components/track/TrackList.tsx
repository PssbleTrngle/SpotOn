import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import {} from 'next-auth/client'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List as VirtualList, ListRowProps } from 'react-virtualized'
import { useSWRInfinite } from 'swr'
import List from '../../interfaces/List'
import Track, { SavedTrack } from '../../interfaces/Track'
import { ITag } from '../../models/Tag'
import Button from '../Button'
import { Options } from '../hooks/useMenu'
import useSelection from '../hooks/useSelection'
import { request } from '../hooks/useSubmit'
import TrackLine from './TrackLine'

const PER_SCROLL = 50

const cache = new CellMeasurerCache({
   fixedWidth: true,
   defaultHeight: 140,
})

export enum ListType {
   BIG,
   SMALL,
}

const TrackList: FC<{
   tags: ITag[]
   endpoint: string
   initial?: SavedTrack[]
}> = ({ tags, endpoint, initial = [] }) => {
   const { data, setSize, revalidate } = useSWRInfinite<List<SavedTrack>>((_, previous) => {
      if (previous && !previous.next) return null
      const offset = previous ? previous.offset + previous.items.length : 0
      return `${endpoint}?offset=${offset + initial.length}&limit=${PER_SCROLL}`
   })

   useEffect(() => {
      revalidate()
   }, [endpoint, revalidate])

   const loadNext = useCallback(() => setSize(i => i + 1), [setSize])

   const tracks = useMemo(() => [...initial, ...(data?.map(it => it.items).flat() ?? [])], [data, initial])
   //const hasNext = useMemo(() => !!data?.[data.length - 1].next, [data])
   const isLoaded = useCallback(({ index }) => !!tracks[index], [tracks])

   const { isSelected, events } = useSelection(
      tracks,
      t => t.track.id,
      selected => ({
         title: `${selected.length} tracks`,

         'Add Tag': tags.reduce(
            (o, tag) => ({
               ...o,
               [tag.name]: () => request.post(`/tag/${tag.id}/track`, { tracks: selected }).then(revalidate),
            }),
            {} as Options
         ),

         'Remove Tag': tags.reduce(
            (o, tag) => ({
               ...o,
               [tag.name]: () => request.delete(`/tag/${tag.id}/track`, { data: { tracks: selected } }).then(revalidate),
            }),
            {} as Options
         ),
      })
   )

   const total = data?.[0]?.total ?? 0

   const [type, setType] = useState<ListType>(ListType.BIG)
   const cycleType = useCallback(() => setType(t => (t === ListType.SMALL ? ListType.BIG : ListType.SMALL)), [setType])

   const list = useRef<VirtualList | null>(null)
   useEffect(() => {
      cache.clearAll()
      //list.current?.recomputeRowHeights()
   }, [type, list])

   return (
      <Style>
         <ul>
            <Button onClick={cycleType}>Switch View</Button>
         </ul>

         <div>
            <InfiniteLoader rowCount={total} minimumBatchSize={PER_SCROLL} loadMoreRows={loadNext} isRowLoaded={isLoaded}>
               {({ onRowsRendered, registerChild }) => (
                  <AutoSizer>
                     {({ height, width }) => (
                        <VirtualList
                           deferredMeasurementCache={cache}
                           style={{ outline: 'none' }}
                           rowCount={total}
                           onRowsRendered={onRowsRendered}
                           overscanColumnCount={2}
                           ref={l => {
                              list.current = l
                              registerChild(l)
                           }}
                           height={height}
                           width={width}
                           rowHeight={cache.rowHeight}
                           rowRenderer={props => {
                              const track = tracks[props.index]
                              return track && <ListItem type={type} {...events(track)} selected={isSelected(track)} {...props} {...track} />
                           }}></VirtualList>
                     )}
                  </AutoSizer>
               )}
            </InfiniteLoader>
         </div>
      </Style>
   )
}

const Style = styled.div`
   height: 100%;

   display: grid;
   gap: 20px;

   grid-template:
      'buttons' auto
      'tracks' 1fr;
`

const MinifiedTrackLine: FC<Track> = ({ name }) => <p>{name}</p>

const ListItem: FC<
   SavedTrack &
      ListRowProps & {
         selected?: boolean
         type: ListType
      }
> = ({ track, index, parent, style, columnIndex, type, ...itemProps }) => {
   const component = useMemo(() => {
      switch (type) {
         case ListType.BIG:
            return TrackLine
         case ListType.SMALL:
            return MinifiedTrackLine
      }
   }, [type])

   return (
      <CellMeasurer parent={parent} rowIndex={index} columnIndex={columnIndex} cache={cache}>
         {({ registerChild, measure }) => (
            <div ref={e => e && registerChild?.(e)} style={style} onLoad={measure}>
               {jsx(component, {
                  ...track,
                  ...itemProps,
               })}
            </div>
         )}
      </CellMeasurer>
   )
}

export default TrackList
